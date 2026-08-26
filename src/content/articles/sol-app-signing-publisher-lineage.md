---
slug: sol-app-signing-publisher-lineage
lang: zh
title: 签名不只是证明文件没变：SOL 如何延续应用身份
description: SOL 的应用签名同时绑定完整 bundle、版本与最低系统契约，并用 publisher lineage 证明密钥轮换前后的身份连续性，让更新、回滚、权限继承和撤销有共同依据。
date: 2026-08-26
topic: 开源项目
coverImage: /images/articles/sol-app-signing-publisher-lineage.svg
coverAlt: SOL 应用 bundle 经过完整内容摘要和发布签名，并沿 Key A、Key B、Key C 的 publisher lineage 延续身份
featured: false
---

“这个应用有数字签名”听起来像一个简单判断：签名有效，文件就可信；签名无效，拒绝安装。但操作系统真正需要回答的问题远比这复杂。

签名覆盖了 bundle 里的每一个文件吗？攻击者能不能加入一个未列出的可执行文件？发布者更换密钥后，系统怎样知道它仍是同一个发布者？旧密钥泄露时，哪些历史版本还能运行？两个签名中有一个被破坏，是否还能接受另一个？同名 App ID 的陌生签名，能否继承用户已经授予的文档、账户或相机权限？

[SOL](https://github.com/viloris-org/SOL) 为 `.app` bundle 设计签名方案时，目标从来不只是“检测文件有没有变化”。它要建立一条可以持续多年的 **publisher identity**，让内容完整性、版本升级、密钥轮换、回滚、权限继承与撤销共享同一份密码学证据。

> 签名证明的不只是“这些字节来自某把钥匙”，还要证明“这次发布属于哪个持续演进的应用身份”。

## 完整性、真实性和连续性是三个问题

应用签名至少要区分三种性质：

1. **内容完整性**：安装和运行的字节是否与签名时一致。
2. **发布真实性**：这些字节是否由持有合法发布私钥的人授权。
3. **身份连续性**：当前密钥是否由上一把可信密钥明确授权，因而仍属于同一 publisher lineage。

只做第一项，攻击者可能重新打包并用自己的密钥签名；只做前两项，合法发布者永远不能安全换钥匙；如果把“App ID 字符串相同”当作连续性，陌生发布者就可能接管旧应用的权限和数据边界。

SOL 因此把 durable security identity 定义为 `App ID + verified publisher lineage`。具体 release 还会绑定精确 bundle hash 与 version code。权限继承看 lineage，进程与 live handle 看精确 release；两者不能混用。

## 一个 `.app` bundle 到底签了什么

SOL 的应用在磁盘上是目录式 bundle，分发时可以压缩成 archive。签名信息放在 bundle 内的 `.signatures/`：

```text
Example.app/
├── App.toml
├── bin/x86_64-linux/app
├── lib/
├── resources/
├── metadata/
└── .signatures/
    ├── manifest.json
    ├── signature.bin
    └── lineages/
        ├── 0.bin
        └── 1.bin
```

`manifest.json` 不是一张宽松的文件列表，而是 canonical、sectioned、complete inventory。`App.toml`、executables、libraries、resources、metadata 和其他常规文件都会记录相对路径、精确字节长度与 SHA-256；整个 inventory 还有 domain-separated total content hash。

验证器重新扫描 bundle，并比较所有预期与实际路径。因此，修改已有资源、删除文件或额外加入一个 unsigned file 都会失败。符号链接会被拒绝，未声明的可执行内容会被拒绝，`.signatures/` 中多出的歧义文件和 non-canonical metadata 也会被拒绝。

这条规则很重要：安全验证不能只回答“列表里的文件是否正确”，还要回答“是否存在列表之外会被运行时解释的内容”。

## Signature block 也必须不可塑

`signature.bin` 使用 canonical protobuf，包含一个或多个 signer。签名覆盖 App ID、human-readable version、单调 `version_code`、manifest digest、content digest、timestamp 与最低 SOL version 等发布数据。

最低系统版本也必须进入签名范围。否则攻击者可能把外层的 compatibility floor 调低，诱导旧系统加载依赖新安全语义的应用。当前测试会直接篡改 `min_sol_version`，验证器必须以 signed-data mismatch 拒绝。

SOL 当前支持三种发布签名算法：

- Ed25519：新 publisher 的默认选择；
- ECDSA P-256 / SHA-256：面向既有 PKI 兼容；
- RSA-4096 / SHA-256：仅面向 legacy publisher。

实现预留了可选 X.509 certificate 字段，但在完整 certificate-chain 与 validity validation 到位之前，任何非空 certificate 都会被拒绝；当前以 raw publisher public key 为权威。这比“先接受但少验证几步”更符合 fail-closed 原则。

## 多签名为什么必须 all-or-nothing

企业合并、共同发布或迁移期可能需要多个 signer。一个危险的验证策略是“只要至少一个签名有效就接受”，因为攻击者可以在合法签名旁边加入自己的 signer，诱导下游系统把它视为共同 publisher。

SOL 采用 all-or-nothing：signature block 中出现的每一个 signer 都必须有效，并且每一个 signer 都必须匹配自己的 lineage。只要其中一个被篡改，整个 bundle 被拒绝。

这并不意味着 signer 越多越安全。多签名表达的是发布策略，验证器的责任是确保 bundle 声明的整个策略都成立，而不是替它从中挑一个看起来还能用的子集。

## 密钥轮换不应该让应用变成陌生人

私钥不可能永远不变。它会到期，算法会升级，组织会调整密钥托管，最坏情况下还会泄露。如果“换钥匙”等于创建新应用，用户要么永久承担旧密钥风险，要么在每次轮换后重新授权和迁移身份。

publisher lineage 用前一把密钥签名下一把密钥，形成 root-to-current 的连续证明：

```text
Key A (root)
    │ signs Key B + rotation metadata
    ▼
Key B
    │ signs Key C + rotation metadata
    ▼
Key C (current release signer)
```

每次 transition 都绑定 next public key、签名算法、UTC timestamp、reason 和 description。验证器检查链的相邻关系、每一跳签名、当前 release signer 是否等于 lineage 最后一个 key，并拒绝重复 key、循环引用、断链、过长链和 non-canonical signed data。

第一把 root key 定义 publisher identity，最后一把 current key 才能签新 release；旧 key 仍可以验证历史版本以支持受控回滚。只有当新 lineage 以旧 lineage 为精确前缀、root 相同，更新才属于同一身份。

如果攻击者用 Key X 签署同一个 `com.example.editor`，但拿不出 A → X 的 continuity proof，系统看到的是新的 security identity。它不能继承旧应用的 durable grants。

## 回滚和防重放必须同时存在

允许历史 key 验证旧版本，不代表任意旧版本都能覆盖新版本。SOL 的 `version_code` 是严格单调的 anti-replay 边界：正常 update 必须向前；拿当前 identity 更新回更低 code 会被判定为 downgrade attempt。

真正的用户发起回滚可以由 package transaction policy 选择以前验证并激活过的 bundle hash，而不是把“不检查版本”当作回滚机制。这让“受控恢复到已知版本”和“攻击者重放有漏洞的旧包”成为两个不同操作。

签名也把最低 SOL contract revision 绑定进 release。OS rollback 时，package resolver 可以选择与当前系统兼容的已验证 app 版本，或者明确标记不可用，但不能偷偷修改 bundle 的兼容性声明。

## 撤销不是删除一把公钥那么简单

如果当前 publisher key 泄露，系统需要知道从哪个时间点开始拒绝它签出的 release，并可能指向安全 replacement。SOL 的实现提供 repository-synchronized revocation cache，记录 key fingerprint、`revoked_after`、reason 和可选 safe replacement。

验证时，只有签名时间位于 cutoff 之后的受影响 release 被阻止。cache 还区分 fresh、stale、expired 与 missing，使上层安装策略能够明确处理离线和过期状态，而不是假装撤销信息永远最新。

目前这仍是可选 cache check 和底层状态分类；完整的 repository metadata、在线同步、transparency 和安装 UI 策略还没有实现。签名验证器能识别撤销，不等于整个生态已经解决 compromised-key recovery。

## 当前实现到了哪里

与许多仍处于架构阶段的 SOL 子系统不同，`sol-bundle` 已经有相对完整的 library、CLI 和安全测试：

- key generation、sign、verify、add-signer 与 rotate-key 命令；
- Ed25519、ECDSA P-256 和 RSA-4096 的签名/验证 round trip；
- 完整 canonical content manifest 与 added/changed/missing file 检测；
- canonical protobuf signature block 与 all-or-nothing multi-signer；
- publisher lineage 的轮换、连续性、长度/time budget、重复 key 与循环保护；
- `version_code` downgrade rejection、minimum SOL version 防篡改和 primary-lineage grant continuity；
- 可选 key revocation cache；
- 对 symbolic link、未声明 executable、extra signature entry 和 malformed metadata 的 fail-closed 拒绝。

仍待完成的是 distribution archive 的完整 install-time pipeline、repository signing 与 transparency、production revocation 同步、publisher recovery policy、X.509 chain validation，以及把 verified identity 真正接入 `sol-packaged`、launcher、sandbox 和 `sol-securityd`。

因此当前最准确的边界是：SOL 已经可以在本地构建、签署并严格验证一个 `.app` bundle，也可以证明同一 publisher 的密钥轮换；它还没有完成从仓库分发到安装、运行、撤销和恢复的整条生产信任链。

## 签名最终连接的是代码与权力

应用签名经常被当成 package manager 的一个安装步骤。对 SOL 来说，它更接近权限系统的根：没有稳定 publisher lineage，系统就不知道更新后是否仍是同一个应用；没有精确 bundle hash，live handle 就无法绑定到具体 release；没有 anti-replay，回滚与降级攻击就无法区分；没有完整 inventory，授权给“这个应用”的权力可能被后来注入的代码继承。

这也是签名值得单独写一篇文章的原因。密码学 primitive 只是最底层的一小部分，真正困难的是定义哪些数据必须被签、身份怎样跨时间延续、什么时候拒绝继承，以及故障和密钥泄露后系统怎样恢复。

你可以查看 [`sol-bundle` README](https://github.com/viloris-org/SOL/blob/main/packaging/sol/bundle/README.md)、[ADR-0029](https://github.com/viloris-org/SOL/blob/main/docs/decisions/ADR-0029-app-signing-publisher-lineage.md)、[签名测试](https://github.com/viloris-org/SOL/blob/main/packaging/sol/bundle/tests/signing.rs) 与 [native packaging boundary](https://github.com/viloris-org/SOL/blob/main/packaging/sol/README.md)。

这篇文章与 [SCP 的窗口安全边界](/zh/articles/designing-scp-secure-compositor-protocol)、[可验证的 A/B 启动与恢复](/zh/articles/sol-boot-verifiable-ab-recovery) 和 [SOL 的最小授权系统](/zh/articles/sol-capability-permission-system) 共同组成 SOL 系统契约系列。

一个应用可以换版本、换构建产物，甚至按计划更换密钥。SOL 想保留下来的不是某个永远不变的文件，而是一条能够被验证、被撤销，也不会被同名陌生人接管的身份。

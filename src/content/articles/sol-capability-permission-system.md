---
slug: sol-capability-permission-system
lang: zh
title: 权限不是弹窗：SOL 如何设计可撤销的最小授权系统
description: SOL 的权限模型从默认拒绝、签名身份、typed action 和 portal 开始，把一次授权收紧为用户、应用、能力、资源与时长的组合，并要求 grant、审计和 handle 原子提交。
date: 2026-08-26
topic: 开源项目
coverImage: /images/articles/sol-capability-permission-system.svg
coverAlt: SOL 权限系统把已认证应用的 typed request 转换为限定用户、能力、资源与时长的 scoped handle
featured: false
---

很多产品把权限管理理解成一组弹窗：应用第一次访问相机时问一次，用户点击“允许”，设置里再放几个开关。界面很重要，但它并不是权限系统本身。真正的问题是，弹窗关闭以后，哪个进程获得了什么资源、可以用多久、更新后是否继续有效、撤销时怎样让已经发出的访问凭据失效，以及系统如何证明这一切没有被绕过。

这也是 SOL 权限设计的出发点：**权限不是一段 UI，而是一条从应用身份到内核与 broker enforcement 的完整链路。**

在前一篇 [SCP 文章](/zh/articles/designing-scp-secure-compositor-protocol) 中，我介绍了 compositor 如何用 capability token 保护窗口、全屏、剪贴板和捕获能力。这篇把视角扩大到整个操作系统：文档、账户、凭据、相机、麦克风、通知、自动化和系统操作，怎样共享同一套最小授权原则。

> Manifest 决定应用最多可以请求什么，用户与系统策略决定这一次实际授予什么；两者都不等于应用天然拥有资源。

## “应用声明了权限”不等于“应用获得了权限”

SOL 的 `.app` bundle 带有签名 manifest。manifest 可以声明应用希望使用哪些 capability，但声明只建立请求上限，不产生授权。

这个区别看似细微，却决定了系统能否保持 default-deny。如果“安装一个声明了相机权限的应用”就等于授权相机，那么签名只证明发布者确实想要相机，并没有证明用户愿意给。第一方签名、应用商店审核、已经登录账户、过去版本曾经获得权限，也都不能自动变成新能力。

完整流程应当是：

```text
Signed manifest: capability is requestable
        ↓
Authenticated process: who is asking
        ↓
Typed request: what exact action/resource
        ↓
Policy + trusted consent: whether, scope, duration
        ↓
Atomic grant + audit + handle issuance
        ↓
Kernel / portal / broker enforcement
```

其中任何一步失败，都不能留下部分可用的权限。

## 一个 grant 应该小到什么程度

传统权限往往只按“应用 × 相机”或“应用 × 文件”存储。SOL 把一个 durable permission atom 定义得更窄：

```text
user
× App ID / verified publisher lineage
× capability
× resource scope
× duration
```

例如，“Rownix 允许 `com.example.editor` 打开这一个文档一次”和“这台机器允许某个企业签名应用永久读取整个 Documents 目录”不是同一种授权。它们的用户、应用身份、资源范围、时长和策略来源都不同。

更窄的 portal 能解决问题时，broker 应拒绝更宽的 ambient authority。文件选择器可以返回一个选中文档的 scoped handle，而不是暴露父目录；一次屏幕分享可以绑定一个窗口和当前 session，而不是授予永久全屏捕获；账户服务可以返回短期 credential lease，而不是把长期 token 交给应用保存。

最小权限不是把弹窗写得更吓人，而是让系统根本没有必要交出更大的权力。

## Typed action 为什么比 shell 命令重要

SOL 中的搜索、Quick Settings、通知、自动化、辅助技术、语音和 AI 都可能请求系统执行操作。如果给这些入口一个任意 shell 字符串，系统就无法稳定回答调用者是谁、请求对应哪个 capability、用户究竟同意了什么，也无法产生有意义的审计记录。

`sol-system` 因此定义了一个封闭的 `SystemAction` catalog。启动应用、系统搜索、调整音量、执行声明过的通知 action、请求截屏和打开文档，都是带类型的请求；每个 action 映射到明确的 `SystemCapability`，请求中没有“顺便执行任意程序”的逃生口。

这让同一套权限边界可以服务不同交互入口。AI 可以请求 `OpenDocument`，但不能把自然语言直接变成 root shell；通知按钮可以触发 manifest 中声明的 action，但不能把任意参数注入后台服务；辅助技术可以得到专门的能力，而不是因为“需要访问很多界面”就获得全部系统权限。

类型系统不能代替安全边界，但它能把请求变成可以校验、授权和审计的对象。

## 用户同意必须发生在可信边界

应用自己绘制一个“是否允许？”对话框没有安全意义，因为它既可以伪造系统样式，也可以在用户拒绝后继续声称已经获得许可。SOL 的 consent UI 必须由可信 Shell surface 承载，并明确展示应用、publisher、资源、用途、范围和时长。

一个 workflow 可以在同一张系统页面解释为什么需要相机、麦克风和选定文档，但每项 capability 仍然有独立的 control、commit 与 revoke。不会出现一个含义模糊的“Allow all”把无关权力捆在一起。

当 policy 返回 `RequireUserConsent` 时，当前 API 只产生 opaque `ConsentId`，并不会执行操作。只有可信 UI 才能把它解析为 allow once、allow always 或 deny；同一个 consent 不能重放。即使得到 `Authorized`，也只代表未来的受保护 adapter 可以处理这一个绑定请求，它不是一张可调用任意私有服务的 bearer token。

## Grant、审计和 handle 必须一起成功

权限系统最危险的故障通常藏在多个组件之间：grant 已写入，但 audit 失败；账户服务已经准备好 lease，但 coordinator 崩溃；用户选择 allow once，机器断电后这次授权又能被消费一次。

SOL 的目标边界要求 grant persistence、必需 audit record 和 capability handle/lease issuance 属于同一事务。只有 commit 完成，handle 才可使用；验证、持久化、审计或签发任一失败，整个授权都不生效。allow-once 的消费也必须持久且原子，崩溃不能让它复活。

当授权需要 `sol-accountsd` 或 `sol-vaultd` 等另一个特权服务参与时，`sol-securityd` 是唯一 coordinator。参与者可以按 transaction ID 准备状态，但 prepared association 本身不可用。`sol-securityd` 提交 grant、audit、participant receipts 和新的 authorization generation 后，参与者才根据 commit proof 激活。

撤销则先提交更高的 generation。所有 broker 都拒绝旧 generation，所以即使物理 cleanup 延迟或某个服务在清理前崩溃，旧 lease 也不能恢复权力。

## 更新之后，权限应该保留还是清空

如果每次更新都清空权限，用户会被重复弹窗淹没；如果只看 App ID 永久继承，攻击者拿同名 bundle 替换应用就可能接管全部授权。

SOL 把 durable security identity 定义为 **App ID + verified publisher lineage**。同一 lineage 的正常升级或回滚可以保留 durable grants，但激活新 bundle 时必须撤销旧 release/process generation 的 live handles。新进程重新请求 handle，broker 再次检查 manifest 声明、durable grant、资源范围、时长和当前 policy。

如果 publisher lineage 中断，它就是一个新的安全身份，即使 App ID 字符串相同也不继承权限。新版本新增到 manifest 的 capability 也只是变得可请求，不会因为旧版本已有其他 grant 而自动获得。

卸载的语义更严格：先 fence 并撤销 outstanding leases，再撤销该安全身份的 durable grants。以后重新安装同一个 App ID 仍需重新同意，即使用户选择保留应用数据。数据保留与权力保留是两个不同决定。

## 沙箱必须在不可信代码运行之前建立

如果应用先启动，再由运行时“提醒它不要访问某些目录”，权限模型就只是一份合作协议。SOL 的目标是，在第三方 entry point 执行前建立 default-deny sandbox，并把授权投射到真正的 enforcement 层。

计划中的组合包括 namespaces、cgroups、seccomp、Landlock 和/或其他 LSM、文件所有权、每应用存储、SCP mediation 与 portal/broker。具体 LSM 组合还没有最终决定，但不变的原则是：SDK API 只是请求入口，实际权力来自内核对象、scoped handle 或特权 broker。

这也意味着应用自带 toolkit、runtime，甚至完全绕过 SolKit，都不应该获得更多访问。平台的一致 UI 可以依赖 SDK，安全隔离不能依赖应用是否使用官方 SDK。

## 当前实现到了哪里

SOL 的权限工作现在有两层成熟度，不能混为一谈。

已经存在的 API 与服务基础包括：

- `sol-system` 的 closed `SystemAction` catalog、caller-attributed request、default-deny policy、allow/deny/revoke、opaque consent 与 typed audit record；
- 内存与文件 permission store，以及内存与文件 audit store 的确定性实现和测试；
- `sol-portal` 对 document-open 与 screen-capture 请求的 typed authorization facade、D-Bus adapter 和 screencast session lifecycle；
- SCP 中应用/session/capability 绑定的 token 骨架与窗口对象所有权检查。

仍未完成的 production enforcement 包括：

- `sol-securityd` 的权威 identity、grant ledger、transaction coordinator、revocation generation 和私有 audit storage；
- 在应用 entry point 前构建的 kernel/LSM sandbox；
- grant、audit 与 handle/lease 的统一原子存储；当前 permission 与 audit store 仍然分离；
- 真实文件、相机、麦克风、账户与凭据 broker，以及 trusted consent UI 的端到端连接；
- crash injection、sandbox escape、spoofing、撤销和真实桌面/硬件环境验证。

所以现在的代码证明了 typed request、默认拒绝、caller-scoped grant、consent lifecycle 与 portal contract 可以被测试；它还不能证明一个恶意 Linux 进程已经被完整 containment。截图里出现权限弹窗，也永远不会是后者的证据。

## 权限系统最终应该让拒绝变得可证明

安全产品很容易只展示成功路径：用户点击允许，功能开始工作。但 SOL 更关心拒绝路径能否成为稳定、可测试的系统性质：未声明且未授权的访问不会弹窗也会失败；选中一个文档不会泄露父目录；旧 handle 在更新或撤销后失效；参与者崩溃不会暴露未提交的凭据；应用携带自己的 runtime 也不能绕开 broker。

这就是为什么权限管理值得单独成为一项系统工程。弹窗只负责让人做决定，manifest 只负责限制请求上限，typed API 只负责表达意图，签名只负责绑定身份。只有 sandbox、broker、事务、撤销与审计共同工作，决定才真正变成权限。

你可以从 [application security README](https://github.com/viloris-org/SOL/blob/main/security/README.md)、[ADR-0021](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0021-application-security-permissions.md)、[typed action ADR](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0013-system-action-permission-layer.md) 和 [`sol-portal`](https://github.com/viloris-org/SOL/tree/main/services/sol-portal) 查看当前设计与实现。

这篇文章与 [SCP 的窗口安全边界](/zh/articles/designing-scp-secure-compositor-protocol)、[可验证的 A/B 启动与恢复](/zh/articles/sol-boot-verifiable-ab-recovery) 和 [应用签名与 publisher lineage](/zh/articles/sol-app-signing-publisher-lineage) 共同组成 SOL 系统契约系列。

SOL 想做的不是让用户回答更多权限问题，而是让系统少索取、不暗示、不捆绑，并且在用户说“不”或“现在撤销”时，真的没有别的路径可以绕过去。

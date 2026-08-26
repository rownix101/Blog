---
slug: sol-boot-verifiable-ab-recovery
lang: zh
title: Bootloader 不只是启动菜单：SOL 如何让失败更新安全返回
description: SOL 把启动、更新试运行、成功确认、A/B 回退与恢复设计成一个可验证的状态机。真正重要的不是把系统拉起来，而是在断电和坏版本之后仍保住一条已知可用的路。
date: 2026-08-26
topic: 开源项目
coverImage: /images/articles/sol-boot-verifiable-ab-recovery.svg
coverAlt: SOL bootloader 在已知可用的 A 槽、试运行的 B 槽和独立恢复路径之间做验证与回退
featured: false
---

大多数时候，我们不会注意 bootloader。按下电源，厂商 Logo 闪过，系统出现登录界面，它的任务似乎就结束了。只有当一次更新失败、根文件系统损坏，或者机器卡在循环重启时，我们才会意识到：启动不是一条“加载内核”的直线，而是操作系统最后一条自救路径。

这正是 [SOL](https://github.com/viloris-org/SOL) 自己设计 `sol-boot` 的原因。

SOL 的 bootloader 不想成为一个更漂亮的启动菜单。它承担的是一份更严格的系统契约：每次启动的部署必须经过验证；新版本只能先试运行；一次失败不能覆盖最后的已知可用版本；只有真实 userspace 通过健康检查，试运行版本才能晋升；当所有系统槽都不可用时，恢复环境仍必须独立可达。

> 一个可靠的 bootloader，不是保证每次都能启动新版本，而是保证新版本失败时仍然知道怎样回来。

## 启动、更新和回退其实是同一个问题

如果系统更新只是替换当前根目录里的文件，bootloader 很难知道它将要启动的内核、initrd、系统镜像和运行时是否仍然属于同一次部署。一次断电可能留下新旧文件混合的状态；即使签名都正确，也不代表这些组件组合在一起能够工作。

SOL 因此把系统版本定义为一个完整 deployment，而不是一组可以各自更新的全局文件。一个部署描述把槽位、generation、体系结构、manifest 的精确长度与摘要，以及 UKI 的精确长度与摘要绑定在一起。内核和 initrd 进入 slot-specific Unified Kernel Image；根镜像、运行时描述与其他系统身份则由 manifest 统一描述。

启动链条因此不是“找到一个内核并执行”，而是：

```text
Platform Secure Boot policy
        ↓
signed sol-boot.efi
        ↓
signed deployment descriptor
        ↓
exact manifest + exact UKI
        ↓
slot-bound system deployment
        ↓
userspace health gate
```

这里存在两层不同的签名。平台 Secure Boot 的 PE 签名回答“固件是否允许执行这个 EFI image”；SOL 的 deployment 签名回答“这组 manifest、UKI、slot 和 generation 是否是 SOL 发布系统授权过的完整部署”。两者用途不同，不能互相替代。

## A/B 的重点不是两个分区，而是状态转换

简单地准备 A、B 两个槽并不自动带来可靠性。真正困难的是：什么时候选择 B？尝试次数在何时扣除？机器断电发生在扣除前还是启动后怎么办？谁有权宣布 B 已经成功？如果成功报告属于另一次启动，是否会错误晋升当前版本？

`sol-boot-core` 把这些问题建模成一个不依赖 UEFI、文件系统、图形和时钟的确定性状态机：

```text
Known-good A
    │ stage verified B
    ▼
Trial B (bounded attempts)
    │ health report matches exact slot + generation + attempt
    ├──────────────────────────────► Promote B to known-good
    │ boot fails / attempts exhausted
    └──────────────────────────────► Fall back to A

No valid deployment ──────────────► Recovery
```

它最关键的约束叫做 **consume before transfer**：在把控制权交给试运行 UKI 之前，bootloader 必须先持久化“这次尝试已经被消耗”，再读回并确认写入的状态准确。否则机器若在启动过程中断电，同一次尝试可能被无限重放，一个永远无法进入健康 userspace 的版本就会形成启动循环。

这个顺序也被直接暴露在 API 里。`prepare_boot` 先返回需要持久化的新状态；只有适配层确认写入并读回后，`confirm_persisted` 才会给出真正的 trial boot action。正确顺序不只存在于注释中，而是状态机调用者必须满足的条件。

## “启动成功”不能等于内核开始运行

坏版本往往能加载内核，也能启动几个服务，真正的问题可能到 compositor、账户服务或关键存储挂载时才出现。因此，bootloader 看到 `StartImage` 成功，不代表部署已经 known-good。

在 SOL 的设计中，`sol-boot` 在试运行前写出一份精确的 attempt report template，包含 slot、generation 和 attempt。只有 early userspace 完成规定的健康门槛后，才会提交匹配的 success report。下一次启动时，状态机只接受与待确认试运行完全一致的报告；来自旧 generation、旧 attempt 或另一个 slot 的报告不能晋升当前部署。

这带来一个重要属性：成功是 userspace 与 bootloader 之间的一次明确提交，而不是“机器似乎活了一会儿”的猜测。

目前 success report 的传输仍依赖 installer 与 early userspace 对 ESP 的保护。最终发布还需要 TPM-backed 认证，防止拥有错误写入路径的组件伪造成功。这项边界在仓库文档中被明确列为 release blocker。

## 持久化状态必须经得起断电

启动状态本身也可能损坏。SOL 使用两份冗余状态记录，每份都带有 magic、格式、长度、单调 sequence、固定 A/B 记录和 CRC32 tear detection。系统选择 sequence 最高的有效副本；一份缺失、损坏或写到一半时，另一份仍可独立使用；两个 sequence 相同却内容冲突的副本会被拒绝。

CRC32 在这里只用于发现撕裂写入和偶然损坏，并不是安全认证。把数据完整性和数据真实性混在一起，是启动设计里很危险的捷径。真正的认证必须由签名、受保护的传输或未来的硬件信任根承担。

`sol-boot-core` 的 fault-injection tests 会在写入前、每一个可能的 torn-write 字节位置、sync 前后和 read-back 期间注入失败。目标不是证明文件 API 能返回成功，而是证明无论故障落在哪一步，系统都不会丢掉最后一个已知可用 deployment，也不会在未持久化尝试次数时启动 trial。

## 恢复路径不能依赖图形桌面

当 A 和 B 都不可用时，告诉用户“请进入设置修复系统”没有意义。Shell、compositor、账户服务甚至主系统镜像本身都可能是故障的一部分。

因此 SOL 要求 recovery 是独立、非图形依赖、可从固件看到的启动路径。boot state 不依赖 Shell；恢复请求在尝试前被消费；recovery A/B 也保留冗余。更新 boot authority 与 recovery 本身时，同样遵循写入 inactive copy、验证、一次试运行、晋升或回退，而不是原地覆盖唯一副本。

当前 `sol-boot` 已经可以按顺序尝试独立的 recovery images，但完整的恢复环境与 boot/recovery 自更新试运行仍是后续工作。这里最重要的是先固定安全属性：桌面失败不能让恢复入口一起消失。

## 启动画面也服从可靠性，而不是反过来

SOL 希望第一帧尽可能使用面板首选分辨率，并在 UEFI GOP、Linux 和 compositor 之间减少可见 modeset。但“无缝”不能成为启动安全的依赖。

`sol-boot` 只会在 GOP 真正暴露 EDID 首选分辨率时选择它；如果固件没有该 mode，就保留一个可用的当前模式，而不会自己编造 timing。渲染器限制每次 framebuffer 写入范围，支持 RGB、BGR 和合法 bit-mask 模式；图形路径失败只允许降低显示效果，不能改变验证、重试、回退或恢复决策。

这是 SOL 很看重的一条工程边界：视觉连续性是产品质量，已知可用回退是系统正确性。前者不能削弱后者。

## 当前实现到了哪里

截至 2026 年 8 月 26 日，仓库里已经存在可以执行和测试的基础，而不只是 ADR：

- `sol-boot-core` 实现了 A/B trial、bounded attempts、known-good fallback、recovery selection 和精确 success-report 绑定；
- 168 字节 deployment record 使用 Ed25519 签名，绑定完整 manifest/UKI 的长度与 SHA-256 digest；
- 持久化状态支持冗余副本、单调 sequence、严格编码与 torn-write fault injection；
- x86-64 `sol-boot.efi` 已能交叉构建为 PE32+ EFI application，并在 OVMF 中执行；
- UEFI 适配层验证 descriptor、manifest 与 UKI，持久扣除 trial attempt，再通过 `LoadImage` / `StartImage` 启动 UKI；
- OVMF harness 覆盖 fail-closed recovery 与完整的 signed A/B trial、健康报告和下一次启动晋升。

尚未完成的发布级证明包括 TPM-backed success report、EDID Active protocol 的安全接线、真实硬件上的无缝图形 handoff、完整 recovery image，以及 boot authority/recovery 自更新试运行。平台 Secure Boot 的 PE 签名和密钥 provision 也属于独立的 release pipeline，而不是把私钥编进 bootloader。

所以现在最准确的说法是：SOL 已经有一条能在开发镜像和 OVMF 中工作的可验证启动路径，但还没有获得真实硬件与完整发布信任链的资格证明。

## Bootloader 是操作系统承诺的起点

当 SOL 说自己不是安装在任意发行版上的桌面层，而是一套完整的 Linux-family OS，bootloader 就不再是外围工具。它决定系统身份从哪里开始、更新失败时由谁负责、什么证据足以把一个版本称为 known-good。

这套设计追求的不是“永不失败”。真正可靠的系统会假设签名文件可能损坏、更新可能断电、新版本可能无法启动、状态副本可能撕裂，甚至图形初始化可能失效，然后为每一种情况保留一条可验证的下一步。

你可以从 [`sol-boot` README](https://github.com/viloris-org/SOL/blob/main/boot/sol-boot/README.md)、[`sol-boot-core` README](https://github.com/viloris-org/SOL/blob/main/boot/sol-boot-core/README.md)、[boot boundary ADR](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0019-os-product-and-boot-boundary.md) 和 [graphics handoff ADR](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0026-sol-boot-uki-and-graphics-handoff.md) 查看设计与实现。

这篇文章与 [SCP 的窗口安全边界](/zh/articles/designing-scp-secure-compositor-protocol)、[SOL 的最小授权系统](/zh/articles/sol-capability-permission-system) 和 [应用签名与 publisher lineage](/zh/articles/sol-app-signing-publisher-lineage) 共同组成 SOL 系统契约系列。

下一次启动顺利完成时，bootloader 仍然应该安静地消失。但它安静的原因不该是我们忽略了失败，而应该是失败路径已经提前被设计、持久化并测试过。

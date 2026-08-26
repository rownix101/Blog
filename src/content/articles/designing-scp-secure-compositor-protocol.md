---
slug: designing-scp-secure-compositor-protocol
lang: zh
title: 我为什么为 SOL 设计 SCP：把窗口协议变成安全边界
description: SOL Compositor Protocol 不只是另一套窗口消息格式。它把应用身份、能力令牌、可信系统界面与用户意图放进 compositor 的原生契约，尝试从协议层收紧桌面应用的权限边界。
date: 2026-08-26
topic: 开源项目
coverImage: /images/articles/designing-scp-secure-compositor-protocol.svg
coverAlt: SCP 将已认证应用、能力令牌与受保护的窗口表面连接到 SOL compositor
featured: true
---

桌面上的一个普通应用，可能接触键盘输入、剪贴板、拖放内容、屏幕画面、全局快捷键和多个窗口。我们习惯把这些看作“桌面功能”，但从安全角度看，它们都是权力：读取剪贴板可能拿到密码，截屏可能带走私密信息，伪造系统界面可能诱导用户授权，而占据特殊窗口层级甚至可以改变用户看到的整个桌面。

这也是我为 [SOL](https://github.com/viloris-org/SOL) 设计 **SCP（SOL Compositor Protocol）** 的原因。

SCP 不只是为了换一种消息格式，也不是为了证明我们能重新发明窗口协议。它要回答的是一个更基础的问题：如果 SOL 从一开始就是一套 application-first、能力导向的操作系统，那么连接应用与 compositor 的协议，为什么不直接表达应用是谁、它拥有什么权力，以及这项权力在什么条件下才有效？

> 窗口协议不应该只负责搬运像素和输入事件。它也应该是一份可验证的权限契约。

## 问题不只是“能不能显示一个窗口”

成熟的 Linux 图形栈已经非常强大。Wayland 把协议核心保持得小而清晰，compositor、portal 和扩展协议可以在其上建立策略。这对通用 Linux 生态很重要；SCP 的出发点并不是简单地说“Wayland 不安全”。

SOL 面对的是另一组产品约束。它不准备成为可以运行任意 Linux 桌面应用的传统发行版，而是希望像 Android 或 ChromeOS 那样，定义自己的应用模型、运行时、打包格式和系统边界。在这个前提下，如果我们一边设计按应用身份授权的系统，一边又让图形协议暴露一套与身份无关的全局能力，安全模型就会被拆成两半：协议先允许，外围组件再尝试补救。

SCP 选择反过来做。一个客户端在创建敏感对象前，先要回答三个问题：

1. **你是谁？** 连接必须绑定到操作系统验证过的应用身份，而不是相信客户端自报的名字。
2. **你被允许做什么？** 创建顶层窗口、进入全屏、读取剪贴板、截屏或占用系统层级，是不同作用域的能力。
3. **为什么现在允许？** 有些能力不仅依赖静态权限，还依赖前台焦点、最近一次真实交互或本次用户确认。

这三个问题组成了 SCP 的基本安全模型：identity first，capability next，context always。

## 一次 SCP 连接是怎样建立的

当前原型使用 `$XDG_RUNTIME_DIR/sol-compositor-0` 下的 Unix domain socket。socket 权限被收紧为 `0600`；消息使用 4 字节大端长度前缀，单帧限制为 1 MiB；共享缓冲区的文件描述符通过 `SCM_RIGHTS` 传递，而不是相信 JSON 里由客户端填写的整数。

连接流程大致如下：

```text
App process
    │  Connect { app_id, pid }
    ▼
SCP transport ── SO_PEERCRED 验证真实 PID
    │
    ▼
SecurityCoordinator ── PID → AppId，评估能力
    │
    ▼
Connected { session_id, capability tokens }
    │
    ▼
CreateSurface → CreateToplevel(token) → Configure → Commit
```

传输层先通过内核提供的 `SO_PEERCRED` 读取对端 PID；如果消息里声称的 PID 与真实连接者不一致，连接会被拒绝。认证成功后，compositor 为连接建立 session，并返回作用域明确的 opaque token。客户端本地的 surface ID 只在自己的 session 中有效，另一个客户端不能拿同一个数字操作它的 surface。

创建普通 surface 本身不等于获得窗口权力。当客户端请求 `CreateToplevel` 时，还必须提交属于这个应用、这个 session 和 `window-toplevel` 能力的 token。伪造 token、过期 token、能力作用域不匹配，或者试图操作其他 session 的对象，都会被拒绝。

这条路径现在已经不是纯设计图。仓库里的原生示例客户端可以完成真实的 **connect → surface → toplevel → configure → commit** 往返；集成测试也覆盖了 PID 冒充、伪造能力令牌、跨 session 对象隔离，以及通过 `SCM_RIGHTS` 传递缓冲区 FD。

## 能力不是一张永久通行证

传统权限界面很容易把授权简化成一个布尔值：允许或拒绝。但桌面能力通常还需要范围、时间和交互上下文。

SCP 因此把能力设计成独立、可审计的授权单元。下面是协议希望建立的边界；其中一部分已经进入状态机和 token 验证，另一部分仍需要 `sol-securityd`、Shell 和真实输入链路完成端到端集成。

| 能力 | 目标策略 | 为什么不能只用一个总开关 |
|---|---|---|
| 顶层窗口 | 普通应用默认获得，创建时仍验证 token | 防止跨 session 伪造和对象劫持 |
| Popup | 必须绑定属于同一应用的父 surface | 菜单不能逃离父窗口的生命周期 |
| 剪贴板读取 | 只允许当前前台应用 | 后台进程不应静默收集复制内容 |
| 剪贴板写入 | 需要近期真实用户交互 | 防止后台应用污染剪贴板 |
| 拖放 | 由真实指针交互启动，并绑定 serial | 防止合成一次不存在的拖放 |
| 屏幕捕获 | 按窗口、输出或工作区授权，并要求用户确认 | “能截屏”不应等于“永远能截一切” |
| 全局快捷键 | 声明用途并单独授权 | 防止应用抢占系统或其他应用的按键 |
| Layer shell | 仅保留给认证过的 `sol-shell` | 第三方应用不能伪造状态栏或系统面板 |
| 全屏 | 独立于普通窗口能力 | 全屏会遮挡系统界面，应有更强约束 |

token 也不是为了给旧式 ACL 换个名字。它可以带有过期时间，也可以设计成一次性使用；compositor 在执行具体操作时再次校验 token 的应用身份和能力作用域，而不是只在连接时检查一次。未来当用户撤销授权时，`sol-securityd` 可以使 token 失效，compositor 则停止对应能力，而不必终止整个应用。

最终目标是让每次敏感操作都留下可以解释的记录：哪个 AppId，在什么上下文里，请求了什么能力，结果是授权、拒绝还是实际使用。可审计性必须和授权走同一条路径，而不是依赖应用自觉写日志。

## 可信界面必须由系统拥有

权限模型还有一个经常被忽视的部分：用户如何知道自己看到的是系统，而不是应用画出来的一块相似界面？

SCP 的答案是强制 server-side decoration。标题栏、关闭按钮、应用身份标识和权限对话框属于 compositor 与 Shell 的可信界面，普通客户端不能替换它们。客户端可以提供窗口标题，但窗口位置、系统 chrome 和特殊层级由系统控制。

这不是单纯的视觉一致性选择。只要应用能够无差别地绘制一套看起来像系统的标题栏、状态栏或授权提示，用户就很难判断自己正在信任谁。SOL 想让“这是系统界面”成为架构保证，而不是一条设计规范。

当前 SCP 已经在 `ConfigureToplevel` 中预留 compositor decoration 的尺寸，状态机也由 compositor 分配窗口大小和状态；真正的标题栏绘制、点击关闭和完整的反钓鱼体验仍要接入原生渲染器。这里同样需要区分协议契约和已经呈现在屏幕上的产品能力。

## 为什么愿意放弃现成兼容性

设计 SCP 最昂贵的决定不是写协议，而是接受它对生态的影响。

如果 SOL 最终以 SCP 作为唯一的原生 compositor 协议，它就不能承诺任意 Wayland 应用无需修改即可运行。标准调试工具也不能直接使用；SolKit、`sol-app` SDK、示例应用、inspector、trace、fuzzer 和迁移文档都需要自己建设。协议、renderer、Shell、输入法和辅助技术之间的验证成本，不会因为架构更干净而消失。

但维持两套产品级协议同样不是免费的。每个窗口生命周期要实现两次，每条敏感能力要在旧协议上重新过滤，每项新保证都可能被兼容路径绕开。对一个资源有限、仍在 pre-alpha 阶段的项目来说，“全部兼容”和“边界可证明”很难同时成为第一优先级。

所以 SOL 选择把方向说清楚：它是一套 Linux-family OS，而不是另一款通用 Linux 发行版。Linux 内核、驱动和成熟系统组件仍然是基础，但应用面向 SOL Runtime 与 SolKit，图形客户端最终面向 SCP。仓库中的 Smithay/Wayland frontend 目前仍作为过渡开发路径存在，原生 SCP 渲染接入后才会逐步退出；这不是已经完成的迁移。

## SCP 现在真正完成了什么

截至 2026 年 8 月 26 日，SCP 仍处于早期实现阶段。当前可以由代码和测试支持的事实包括：

- 独立的 Unix socket 传输、长度 framing、消息上限、peer credential 验证和安全的 stale-socket 处理；
- 后端无关的 SCP listener，可在 winit、udev 和 headless 模式启动；
- 已认证 session、应用与 session 绑定的 capability token，以及 surface/toplevel 所有权校验；
- surface 的创建、销毁、attach、damage、pending state 与原子 commit 的状态机；
- toplevel、popup、输入事件和输出管理的协议类型与基础状态管理；
- 原生示例客户端，以及覆盖真实 socket 往返、PID 冒充、token 伪造和 FD 传递的测试。

还不能对外宣称完成的部分同样重要：

- 原生 renderer 还没有真正消费 SCP surface 并把它们合成到屏幕；
- `Damage`、input region、buffer release、DMA-BUF 和真实输入/输出链路仍需集成；
- 生产级 AppId 认证、签名 token、用户同意、动态撤销和审计仍由 stub `SecurityCoordinator` 占位；
- server-side decoration、屏幕捕获、剪贴板、拖放与全局快捷键还没有完成端到端安全闭环；
- 当前 wire payload 仍是便于 Phase 1 开发的 Rust/Serde JSON，稳定 schema 与版本演进机制尚未定型；
- `scp-inspector`、trace/replay、fuzzer、第三方 SDK 和迁移指南仍在路线图上。

换句话说，SCP 已经证明了传输、身份绑定、对象隔离和 capability-gated 请求可以在真实进程间跑通；它还没有证明自己是一套可供日常桌面使用的完整图形协议。下一阶段最关键的里程碑，不是再增加更多消息枚举，而是让原生 renderer 和输入循环消费这些状态，并在真实硬件上验证整个闭环。

## 我希望 SCP 最终证明什么

SCP 的价值不会由代码行数决定，也不会由“自研协议”四个字决定。它最终需要证明四件事：安全边界比兼容层更容易解释和测试；应用开发者不必直接承受底层协议复杂度；普通用户能感受到一致而可信的系统行为；项目愿意为自己的取舍承担生态成本。

如果这些目标做不到，SCP 就只是一套昂贵的新格式。如果能够做到，它会成为 SOL 最重要的系统契约之一：应用可以自由绘制内容，但不能自由伪造身份；可以请求能力，但不能把请求当成所有权；可以获得数据，但每次访问都带着清楚的范围和用户意图。

你可以从 [SCP 协议概览](https://github.com/viloris-org/SOL/blob/main/docs/scp-protocol-summary.md)、[ADR-0027](https://github.com/viloris-org/SOL/blob/main/docs/decisions/ADR-0027-sol-compositor-protocol.md)、[实现清单](https://github.com/viloris-org/SOL/blob/main/docs/scp-implementation-checklist.md) 和 [原生示例客户端](https://github.com/viloris-org/SOL/blob/main/compositor/examples/scp-client.rs) 开始阅读，也可以直接查看 [SOL 仓库](https://github.com/viloris-org/SOL)。

这篇文章与 [可验证的 A/B 启动与恢复](/zh/articles/sol-boot-verifiable-ab-recovery)、[SOL 的最小授权系统](/zh/articles/sol-capability-permission-system) 和 [应用签名与 publisher lineage](/zh/articles/sol-app-signing-publisher-lineage) 共同组成 SOL 系统契约系列。

我尤其希望听到来自协议设计、Linux graphics、Rust、capability security、输入法、辅助技术和应用框架开发者的反对意见。SCP 现在还足够早，最有价值的贡献不只是帮它实现更多功能，也可能是指出哪一条安全假设根本不成立。

---
slug: building-sol-application-first-linux-os
lang: zh
title: 我为什么要做 SOL：它不只是另一个 Linux 桌面
description: SOL 是一个基于 Linux 内核、使用 Rust 与 Wayland 构建的 application-first 操作系统。它想解决的不是主题和发行版选择，而是从启动、更新、权限到 Shell 与应用 SDK 的一致系统契约。
date: 2026-08-24
topic: 开源项目
coverImage: /images/articles/building-sol-application-first-linux-os.svg
coverAlt: SOL 操作系统从 Linux 内核、系统服务、Wayland 到应用框架的分层结构
featured: true
---

Linux 桌面从来不缺选择。发行版、桌面环境、窗口管理器、包管理器和主题，每一层都有大量成熟项目。自由组合是 Linux 最迷人的地方之一，但它也留下了另一个问题：如果目标不是“把喜欢的组件拼在一起”，而是做出一套从开机到应用都连贯、可预测、可以作为一个完整产品演进的桌面操作系统，应该从哪里开始？

[SOL](https://github.com/viloris-org/SOL) 就是我对这个问题的尝试。

SOL 是一个基于 Linux 内核、使用 Rust、Wayland 和 Smithay 构建的 application-first 操作系统。它不是给现有发行版换一套主题，也不是在任意 Linux 主机上安装的桌面层。它想拥有一套完整的操作系统契约：启动与恢复、系统镜像与更新、应用包、权限和账户、Wayland compositor、Shell、系统服务、应用框架，以及最终呈现在用户面前的视觉和交互语言。

> Reuse Linux. Own the operating-system contract.

这句话是 SOL 最短的定义：复用 Linux，但把“什么是这个操作系统”掌握在自己手里。

## 为什么不是再做一个发行版或桌面环境

如果只想快速得到一个漂亮的 Linux 桌面，最合理的做法当然是选择一个成熟发行版，再基于 GNOME、KDE Plasma 或其他桌面环境进行定制。SOL 选择了一条更慢、风险也更高的路，因为它想解决的问题不在主题层。

一个应用的权限如何被授予、撤销和审计？系统更新失败后如何回到已知可用状态？应用应该依赖主机上任意版本的共享库，还是依赖一套明确、可版本化的平台运行时？系统账户和长期凭据应该归应用管理，还是由操作系统保管，只向应用提供范围受限的句柄？Shell、compositor 和应用框架之间的行为，应该靠开发者遵守设计规范，还是由系统架构直接提供？

这些决定彼此并不独立。包管理会影响回滚，回滚会影响运行时兼容，运行时兼容会影响应用打包，应用身份又会影响权限和凭据。如果每层来自不同产品、按不同假设演进，最后很难仅靠视觉规范把它们变成一个整体。

SOL 因此把边界向下放到了启动与系统镜像，向上延伸到了应用框架：

```text
UEFI firmware
    ↓
SOL boot / recovery
    ↓
Linux kernel + system image
    ↓
security / accounts / package / system services
    ↓
Wayland compositor + Shell + SOL Runtime
    ↓
SolKit and third-party .app applications
```

Linux 内核、驱动、Mesa、PipeWire、NetworkManager、BlueZ 和 systemd 仍然是重要的基础。SOL 没有理由重写已经被证明可靠的底层组件。它要拥有的是这些组件如何被组合、更新、保护，以及如何作为一个稳定平台暴露给用户和应用。

## Application-first 到底是什么意思

很多桌面系统先完成窗口、面板和启动器，再让应用去适配它们。SOL 希望把应用体验放在系统设计的起点。

在 SOL 中，原生应用面向 SolKit 编程。按钮、文本输入、布局、命令、生命周期、图形和动效不是每个应用各自重新实现的约定，而是平台能力。目标不是让所有应用看起来一模一样，而是让基本行为天然一致：键盘导航、可访问性、权限请求、窗口行为、触控板手势和动画中断，都应该在框架和系统层有清楚的答案。

这也是为什么 SOL 把动效当成交互模型，而不是装饰。理想的触控板操作应该是手指移动多少，界面就推进多少；用户改变方向时，动画可以立即被接管，而不是识别到一个手势后播放一段无法打断的视频。

同样，application-first 不意味着封闭生态。SOL 计划支持 GTK、Qt、SDL、Electron、Flutter 和其他 Wayland 原生应用。不同工具包可以有不同程度的视觉融合，但它们应共享同一套应用身份、沙箱、权限、系统服务和更新保证。

## 系统更新、应用和权限应该是一件完整的事

SOL 希望系统的变化是可验证、可回退的。

系统部署采用与内核、initrd、根镜像和运行时描述绑定的 A/B 槽位；更新先写入非活动槽，验证通过后再试运行。启动失败不应该把用户留在一台无法工作的机器上，而应该自动回到已知可用的部署。恢复环境和 bootloader 自身也必须保留独立的回退路径。

应用则以签名、只读、内容寻址的 `.app` bundle 存在。每个应用携带自己的非 SOL 依赖，通过明确的平台运行时使用公共能力。安装一个应用不会自动授予它读取文档、访问摄像头或取得账户凭据的权力；声明能力只代表它可以提出请求，真正的授权必须是明确、最小范围并且可撤销的。

这套设计目前仍有大量实现工作，但它很早就被放进项目边界里。安全、更新和恢复如果等到桌面“做完以后”再添加，往往只能成为贴在既有架构外面的一层补丁。

## SOL 现在已经做到哪里

这里需要非常坦白：SOL 目前是 **concept / pre-alpha**，不是可以安装到主力电脑上的成品，也没有做出 daily-driver 的承诺。

现阶段已经存在的是一组可以继续推进的实现基础：Smithay compositor 能够建立自己的 Wayland socket，仓库内客户端可以完成部分 headless 协议往返，winit 开发渲染路径可以运行；SolKit 已经有语义组件、布局、设计 token、生命周期、命令、图形和动效等实现切片；系统镜像与启动方向也已经有可复现 manifest、槽位策略和 UEFI 启动路径方面的基础。

但真正困难的部分仍在前面：完整窗口与 popup 生命周期、真实硬件上的 DRM/GBM 路径、多显示器与缩放、输入法、拖放和剪贴板互操作、compositor 与 Shell 的端到端契约、原生渲染与输入节奏，以及真实辅助技术环境里的可访问性验证。

项目的 [Roadmap](https://github.com/viloris-org/SOL/blob/main/docs/ROADMAP.md) 使用 S0 到 S5 的成熟度模型记录这些边界。一个类型、处理器或单元测试的存在，不等于功能已经可用；只有经过真实集成、硬件和用户场景验证的能力，才会被视为完成。我宁愿项目进度看起来慢一些，也不想靠模糊的完成度制造一个不存在的系统。

## 为什么现在就把它公开

操作系统很容易变成一个只存在于设计文档里的宏大计划。越晚接受外部检验，越容易在错误的抽象上投入太久。因此，SOL 不会等到“看起来像成品”才开始公开构建。

现在开放项目，不是为了宣布一个即将发布的消费产品，而是为了让关键问题尽早暴露：Wayland 协议边界是否准确，启动与回滚状态机是否可靠，权限模型是否真的满足最小授权，SDK 是否能被项目之外的开发者理解，设计系统能否兼顾一致性和可访问性。

接下来我会持续分享具体的实现进展，而不仅是概念图：一个 popup 如何完整地创建和销毁，一次系统部署如何在断电后回退，一个应用权限如何在授权、使用和撤销之间保持原子性，SolKit 如何让交互动画真正可中断。这些小问题最终决定 SOL 能不能从愿景变成操作系统。

## 如果你也对这个问题感兴趣

SOL 需要的不只是写代码的人。Rust、Smithay、Wayland、Linux graphics、UEFI、系统安全、应用运行时、输入法、辅助技术、交互设计、技术写作和测试经验，都会直接影响它能走多远。

你可以从 [GitHub 仓库](https://github.com/viloris-org/SOL) 查看代码、[产品需求文档](https://github.com/viloris-org/SOL/blob/main/docs/PRD.md)、[OS Platform Definition](https://github.com/viloris-org/SOL/blob/main/docs/os-platform.md) 和当前 Roadmap。如果这个方向让你觉得值得继续，欢迎留下 Star、提出问题，或者告诉我哪一项假设最值得被推翻。

SOL 现在还很早。也正因为早，每一个认真反馈都可能改变它未来的形状。

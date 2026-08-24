---
slug: building-sol-application-first-linux-os
lang: en
title: "Why I Am Building SOL: More Than Another Linux Desktop"
description: SOL is an application-first operating system built on the Linux kernel with Rust and Wayland. Its goal is a coherent contract spanning boot, updates, permissions, the Shell, and the application SDK.
date: 2026-08-24
topic: Open Source
coverImage: /images/articles/building-sol-application-first-linux-os.svg
coverAlt: Layered SOL operating-system architecture from the Linux kernel and system services to Wayland and the application framework
featured: true
---

The Linux desktop has never lacked choice. Distributions, desktop environments, window managers, package managers, and themes all have mature options. That freedom to combine components is one of Linux's greatest strengths. It also leaves another question open: what would it take to build a desktop operating system that behaves as one coherent, predictable product from boot to applications?

[SOL](https://github.com/viloris-org/SOL) is my attempt to answer that question.

SOL is an application-first operating system built on the Linux kernel with Rust, Wayland, and Smithay. It is not a new theme for an existing distribution, and it is not a desktop layer meant to sit on an arbitrary Linux host. Its intended boundary includes boot and recovery, system images and updates, application bundles, permissions and accounts, a Wayland compositor, the Shell, system services, an application framework, and the visual and interaction language presented to users.

> Reuse Linux. Own the operating-system contract.

That is the shortest definition of SOL: reuse Linux, while taking responsibility for what the operating system promises as a product.

## Why Not Build Another Distribution or Desktop Environment?

If the goal were simply to produce an attractive Linux desktop quickly, the sensible path would be to start from an established distribution and customize GNOME, KDE Plasma, or another mature environment. SOL takes a slower and riskier path because its problem is not at the theme layer.

How is application authority granted, revoked, and audited? How does the machine return to a known-good state after a failed system update? Should an application depend on arbitrary shared libraries from the host, or on an explicit, versioned platform runtime? Should applications own durable account credentials, or should the operating system hold them and issue scoped handles? Should consistent Shell and application behavior depend on developers following a design guide, or should the architecture provide it by default?

These decisions are connected. Packaging affects rollback. Rollback affects runtime compatibility. Runtime compatibility affects application bundles. Application identity affects permissions and credentials. When each layer belongs to a different product with different assumptions, visual guidelines alone cannot turn them into one system.

SOL therefore extends its boundary down to boot and system images, and up through the application framework:

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

The Linux kernel, drivers, Mesa, PipeWire, NetworkManager, BlueZ, and systemd remain essential foundations. SOL has no reason to rewrite reliable lower-level components. What it needs to own is how those components are assembled, updated, protected, and exposed to users and applications as a stable platform.

## What Application-First Means

Many desktop projects build windows, panels, and launchers first, then ask applications to adapt. SOL treats application experience as an input to system design.

Native SOL applications target SolKit. Buttons, text input, layout, commands, lifecycle, graphics, and motion are platform capabilities instead of conventions that every application reimplements. The goal is not to make every app look identical. The goal is to make fundamental behavior coherent by default: keyboard navigation, accessibility, permission requests, window behavior, touchpad gestures, and animation interruption should all have clear system-level answers.

This is also why SOL treats motion as part of interaction rather than decoration. An ideal touchpad gesture maps finger movement directly to interface progress. If the user reverses direction, the transition should be immediately interruptible instead of continuing like a prerecorded clip.

Application-first does not mean a closed ecosystem. SOL intends to support GTK, Qt, SDL, Electron, Flutter, and other Wayland-native applications. Toolkits can reach different levels of visual integration while sharing the same application identity, sandbox, permission, system-service, and update guarantees.

## Updates, Applications, and Authority Form One System

SOL is designed around verifiable and recoverable change.

System deployments use A/B slots bound to a kernel, initrd, root image, and runtime descriptor. An update is staged into the inactive slot, verified, and trialed before promotion. A failed boot should not strand the user with a broken machine; it should return automatically to a known-good deployment. Recovery and the bootloader itself also retain independent fallback paths.

Applications are signed, read-only, content-addressed `.app` bundles. Each bundle carries its non-SOL dependencies and consumes common capabilities through an explicit platform runtime. Installing an application does not automatically give it access to documents, cameras, or account credentials. Declaring a capability only makes it requestable. Actual authority must be explicit, narrow, and independently revocable.

Much of this still needs to be implemented, but it belongs inside the project boundary from the beginning. Security, updates, and recovery are difficult to add after the desktop is supposedly finished; by then, they are usually patches around assumptions that have already hardened.

## Where SOL Is Today

The status needs to be unambiguous: SOL is currently **concept / pre-alpha**. It is not ready to install on a primary computer, and it makes no daily-driver claim.

What exists today is a set of foundations that can be developed further. The Smithay compositor can create its own Wayland socket, repository-owned clients complete selected headless protocol round trips, and the winit development rendering path runs. SolKit has implementation slices for semantic components, layout, design tokens, lifecycle, commands, graphics, and motion. The system-image and boot work also has foundations for reproducible manifests, slot policy, and a UEFI boot path.

The hardest work remains open: complete window and popup lifecycles, DRM/GBM on real hardware, multiple displays and scaling, input methods, drag-and-drop and clipboard interoperability, an end-to-end compositor-to-Shell contract, native rendering and input pacing, and accessibility validation with real assistive technology.

The project [Roadmap](https://github.com/viloris-org/SOL/blob/main/docs/ROADMAP.md) uses an S0-to-S5 maturity model to keep those boundaries visible. The existence of a type, handler, or unit test does not make a feature usable. A capability is complete only after real integration, hardware, and user-scenario validation. I would rather make the project look slower than imply that a system exists where it does not.

## Why Build in Public This Early?

Operating systems can easily become ambitious plans that exist only in design documents. The later a project meets external scrutiny, the longer it can invest in the wrong abstractions. SOL is therefore being built in public before it looks like a finished product.

This is not an announcement of an imminent consumer release. It is an invitation to test the important assumptions early: whether the Wayland protocol boundaries are correct, whether boot and rollback state machines survive failure, whether the permission model really provides minimum authority, whether developers outside the project can understand the SDK, and whether the design system can deliver consistency without sacrificing accessibility.

I will keep sharing concrete implementation work, not just concept images: how a popup completes its entire lifecycle, how a deployment recovers after interrupted writes, how an application permission remains atomic across consent and revocation, and how SolKit makes interaction genuinely interruptible. Those details will decide whether SOL becomes an operating system rather than a document about one.

## If This Is a Problem You Care About

SOL needs more than code. Experience with Rust, Smithay, Wayland, Linux graphics, UEFI, system security, application runtimes, input methods, accessibility, interaction design, technical writing, and testing can all shape how far it goes.

You can explore the [GitHub repository](https://github.com/viloris-org/SOL), the [Product Requirements Document](https://github.com/viloris-org/SOL/blob/main/docs/PRD.md), the [OS Platform Definition](https://github.com/viloris-org/SOL/blob/main/docs/os-platform.md), and the current Roadmap. If the direction seems worth pursuing, leave a Star, open a question, or tell me which assumption most deserves to be challenged.

SOL is still early. That is exactly why thoughtful feedback can still change its shape.

---
slug: designing-scp-secure-compositor-protocol
lang: en
title: "Why I Designed SCP for SOL: Making the Window Protocol a Security Boundary"
description: SOL Compositor Protocol is more than another window-message format. It makes application identity, capability tokens, trusted system UI, and user intent part of the compositor's native contract.
date: 2026-08-26
topic: Open Source
coverImage: /images/articles/designing-scp-secure-compositor-protocol.svg
coverAlt: SCP connects an authenticated application and scoped capability token to a protected surface in the SOL compositor
featured: true
---

An ordinary desktop application may encounter keyboard input, clipboard contents, drag-and-drop data, screen pixels, global shortcuts, and several kinds of windows. We tend to call these desktop features. From a security perspective, however, each one is authority: reading the clipboard can expose a password, screen capture can copy private information, counterfeit system UI can trick a user into granting access, and privileged window layers can change the desktop the user believes they are operating.

That is why I am designing **SCP—the SOL Compositor Protocol**—for [SOL](https://github.com/viloris-org/SOL).

SCP is not an exercise in changing message formats, nor an attempt to reinvent a window protocol for its own sake. It asks a more basic question: if SOL is an application-first, capability-oriented operating system, why should the protocol between applications and the compositor not directly express who an application is, what authority it holds, and under which conditions that authority remains valid?

> A window protocol should not only transport pixels and input. It should also be a verifiable authority contract.

## The Problem Is Larger Than Displaying a Window

The mature Linux graphics stack is extraordinarily capable. Wayland keeps its core protocol small, while compositors, portals, and extensions build policy around it. That approach matters to a general-purpose Linux ecosystem; SCP does not begin with the simplistic claim that “Wayland is insecure.”

SOL has a different set of product constraints. It is not intended to be a traditional distribution that runs arbitrary Linux desktop applications. Like Android or ChromeOS, it aims to define an application model, runtime, package format, and system boundary. Under that assumption, it would be contradictory to design identity-based authorization at the operating-system level while exposing a graphics protocol whose global capabilities are independent of that identity. The protocol would permit an operation first, leaving surrounding components to repair the boundary later.

SCP reverses that order. Before a client creates a sensitive object, the system asks three questions:

1. **Who are you?** A connection must be bound to an operating-system-verified application identity, not a name supplied on trust.
2. **What are you allowed to do?** Creating a toplevel, entering fullscreen, reading the clipboard, capturing a screen, and occupying a system layer are independently scoped capabilities.
3. **Why is it allowed now?** Some capabilities depend not only on a static grant, but also on foreground focus, recent genuine interaction, or consent for this particular operation.

Those questions form SCP's basic security model: identity first, capability next, context always.

## How an SCP Connection Is Established

The current prototype uses a Unix domain socket at `$XDG_RUNTIME_DIR/sol-compositor-0`. Its permissions are restricted to `0600`. Messages use a four-byte big-endian length prefix with a 1 MiB frame limit. Shared-buffer file descriptors travel through `SCM_RIGHTS`; the compositor never trusts an integer placed in JSON by the client.

The connection looks roughly like this:

```text
App process
    │  Connect { app_id, pid }
    ▼
SCP transport ── verify the real PID with SO_PEERCRED
    │
    ▼
SecurityCoordinator ── PID → AppId, evaluate capabilities
    │
    ▼
Connected { session_id, capability tokens }
    │
    ▼
CreateSurface → CreateToplevel(token) → Configure → Commit
```

The transport first obtains the peer PID from the kernel with `SO_PEERCRED`. If the PID claimed by the message differs from the process that opened the socket, the connection is rejected. After authentication, the compositor creates a session and returns opaque, narrowly scoped tokens. A client's local surface IDs only exist within that session; another client cannot reuse the same numeric ID to operate on those surfaces.

Creating a plain surface does not itself grant window authority. A `CreateToplevel` request must also provide a token bound to that application, that session, and the `window-toplevel` capability. A forged or expired token, a scope mismatch, or an attempt to operate on another session's object is rejected.

This path is no longer only an architecture diagram. The repository's native example client performs a real **connect → surface → toplevel → configure → commit** round trip. Integration tests also cover PID impersonation, forged capability tokens, cross-session object isolation, and buffer-FD delivery through `SCM_RIGHTS`.

## A Capability Is Not a Permanent Master Key

Traditional permission interfaces tend to reduce authorization to a Boolean: allow or deny. Desktop capabilities frequently need scope, time, and interaction context as well.

SCP therefore models each capability as a separate, auditable authorization unit. The following table shows the intended boundaries. Some already exist in the state machine and token validation; others still require end-to-end integration with `sol-securityd`, the Shell, and real input paths.

| Capability | Intended policy | Why one global switch is insufficient |
|---|---|---|
| Toplevel window | Granted by default to ordinary applications, but token-checked on creation | Prevents cross-session forgery and object takeover |
| Popup | Must be attached to a parent surface owned by the same application | A menu cannot escape its parent's lifecycle |
| Clipboard read | Available only to the foreground application | Background processes should not silently collect copied data |
| Clipboard write | Requires recent genuine user interaction | Prevents silent background clipboard poisoning |
| Drag and drop | Starts from real pointer interaction and is bound to a serial | Prevents fabrication of an interaction that never happened |
| Screen capture | Scoped to a window, output, or workspace and confirmed by the user | “May capture” must not mean “may always capture everything” |
| Global shortcuts | Declares a purpose and receives an independent grant | Prevents applications from taking system or peer shortcuts |
| Layer shell | Reserved for the authenticated `sol-shell` | Third-party apps cannot counterfeit status bars or system panels |
| Fullscreen | Separate from ordinary window authority | Fullscreen obscures system UI and deserves a stronger boundary |

Tokens are not merely old access-control lists with a new name. They can expire or be single-use. The compositor validates the token's application identity and capability scope again when performing an operation, rather than checking only once during connection setup. When the user eventually revokes access, `sol-securityd` should be able to invalidate the token and let the compositor stop the affected authority without terminating the entire application.

The final system should also explain every sensitive operation: which AppId requested which capability, under what context, and whether it was granted, denied, or used. Auditing belongs on the authorization path instead of depending on applications to log their own behavior.

## Trusted UI Must Belong to the System

There is another frequently overlooked part of permission design: how can users know that they are looking at the system rather than an application drawing something similar?

SCP's answer is mandatory server-side decoration. Title bars, close controls, application identity, and permission dialogs belong to trusted compositor and Shell UI. An ordinary client cannot replace them. Clients may provide a title, but window position, system chrome, and privileged layers remain under system control.

This is not merely a visual-consistency preference. If applications can freely reproduce the title bar, status bar, or consent prompt, users cannot reliably tell whom they are trusting. SOL wants “this is system UI” to be an architectural guarantee rather than a sentence in a design guide.

SCP already reserves compositor-decoration space in `ConfigureToplevel`, and its state machine lets the compositor allocate window size and state. Actual title-bar rendering, close interaction, and the full anti-phishing experience still need native-renderer integration. Here again, the protocol contract and the visible product capability must not be confused.

## Why Accept the Cost of Giving Up Compatibility?

The most expensive SCP decision is not writing the protocol. It is accepting the effect on the application ecosystem.

If SCP becomes SOL's only native compositor protocol, SOL cannot promise that arbitrary Wayland applications will run unchanged. Standard debugging tools will not simply carry over. SolKit, the `sol-app` SDK, examples, inspectors, trace tools, fuzzers, and migration guides all have to be built. A cleaner architecture does not erase the cost of validating the protocol, renderer, Shell, input methods, and assistive technology together.

Maintaining two production protocol stacks is not free either. Each window lifecycle is implemented twice. Every sensitive capability needs retrofitted filtering. Every new guarantee may be bypassed through the compatibility path. For a resource-constrained project still in pre-alpha, “support everything” and “make the boundary provable” cannot both be the first priority.

SOL is therefore making its direction explicit: it is a Linux-family OS, not another general-purpose Linux distribution. The Linux kernel, drivers, and mature system components remain its foundation, while applications target SOL Runtime and SolKit, and graphics clients ultimately target SCP. The Smithay/Wayland frontend still exists today as a transitional development path. It can only be retired after native SCP rendering is connected; this migration is not complete.

## What SCP Has Actually Completed

As of August 26, 2026, SCP remains an early implementation. Claims supported by code and tests include:

- a dedicated Unix-socket transport with framing, message limits, peer-credential verification, and safe stale-socket recovery;
- a backend-independent SCP listener that starts in winit, udev, and headless modes;
- authenticated sessions, application- and session-bound capability tokens, and surface/toplevel ownership checks;
- state machines for surface creation, destruction, attachment, damage, pending state, and atomic commit;
- protocol types and foundational state for toplevels, popups, input events, and output management;
- a native example client and tests covering real socket round trips, PID impersonation, token forgery, and FD passing.

The unfinished list is equally important:

- the native renderer does not yet consume SCP surfaces and compose them on screen;
- `Damage`, input regions, buffer release, DMA-BUF, and real input/output paths still need integration;
- production AppId authentication, signed tokens, user consent, runtime revocation, and audit are represented by a stub `SecurityCoordinator`;
- server-side decoration, screen capture, clipboard, drag and drop, and global shortcuts do not yet form complete end-to-end security paths;
- the current wire payload is Rust/Serde JSON for Phase 1 development; a stable schema and versioning mechanism are not final;
- `scp-inspector`, trace/replay, fuzzing, a third-party SDK, and migration guides remain on the roadmap.

In other words, SCP has demonstrated that transport, identity binding, object isolation, and capability-gated requests can work between real processes. It has not demonstrated a complete daily-use graphics protocol. The next important milestone is not adding more message enums. It is connecting the native renderer and input loop to this state and validating the whole path on real hardware.

## What SCP Ultimately Needs to Prove

SCP's value will not be determined by its line count or by the phrase “custom protocol.” It must prove four things: that its security boundary is easier to explain and test than a compatibility layer; that application developers do not have to absorb its low-level complexity; that ordinary users experience coherent, trustworthy system behavior; and that the project can bear the ecosystem cost of its choices.

If it cannot meet those tests, SCP will be only an expensive new format. If it can, it will become one of SOL's most important system contracts: applications remain free to draw their content but cannot freely counterfeit identity; they may request capabilities but cannot treat requests as ownership; and they may receive data only through authority with a clear scope and connection to user intent.

You can start with the [SCP protocol overview](https://github.com/viloris-org/SOL/blob/main/docs/scp-protocol-summary.md), [ADR-0027](https://github.com/viloris-org/SOL/blob/main/docs/decisions/ADR-0027-sol-compositor-protocol.md), the [implementation checklist](https://github.com/viloris-org/SOL/blob/main/docs/scp-implementation-checklist.md), and the [native example client](https://github.com/viloris-org/SOL/blob/main/compositor/examples/scp-client.rs), or explore the complete [SOL repository](https://github.com/viloris-org/SOL).

This article joins [verifiable A/B boot and recovery](/en/articles/sol-boot-verifiable-ab-recovery), [SOL's minimum-authority permission model](/en/articles/sol-capability-permission-system), and [application signing with publisher lineage](/en/articles/sol-app-signing-publisher-lineage) in the SOL system-contract series.

I am especially interested in objections from people working on protocol design, Linux graphics, Rust, capability security, input methods, accessibility, and application frameworks. SCP is still early enough that the most valuable contribution may not be implementing another feature. It may be showing that one of its security assumptions is wrong.

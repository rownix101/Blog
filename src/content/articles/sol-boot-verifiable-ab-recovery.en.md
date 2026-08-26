---
slug: sol-boot-verifiable-ab-recovery
lang: en
title: "A Bootloader Is More Than a Menu: How SOL Returns Safely from Failed Updates"
description: SOL models boot, update trials, success confirmation, A/B fallback, and recovery as one verifiable state machine. The goal is not merely to boot, but to preserve a known-good path after failure or power loss.
date: 2026-08-26
topic: Open Source
coverImage: /images/articles/sol-boot-verifiable-ab-recovery.svg
coverAlt: The SOL bootloader verifies and selects between known-good slot A, trial slot B, and an independent recovery path
featured: false
---

Most of the time, we do not notice the bootloader. We press the power button, a vendor logo flashes, and the login screen appears. Only after a broken update, corrupted root filesystem, or reboot loop do we remember that boot is not a straight line that loads a kernel. It is the operating system's last route back to a working state.

That is why [SOL](https://github.com/viloris-org/SOL) owns `sol-boot`.

SOL's bootloader is not intended to be a prettier boot menu. It enforces a stricter contract: every deployment is verified; a new version begins as a bounded trial; failure cannot overwrite the final known-good version; only a real userspace health gate may promote a trial; and an independent recovery path must remain reachable when both system slots fail.

> A reliable bootloader does not promise that every new version will boot. It promises that the machine still knows how to return when one does not.

## Boot, Update, and Rollback Are One Problem

If an update replaces files in the active root independently, the bootloader cannot prove that the kernel, initrd, root image, and runtime descriptors still belong to one release. Power loss can leave a mixture of old and new files. Even individually valid signatures do not prove that the combination works.

SOL therefore treats a system version as a complete deployment. A signed descriptor binds the slot, generation, architecture, and exact lengths and digests of the manifest and Unified Kernel Image. The UKI contains the Linux EFI stub, kernel, initrd, immutable command line, and release metadata. The manifest describes the slot-bound root image and the rest of the system identity.

```text
Platform Secure Boot policy
        ↓
signed sol-boot.efi
        ↓
signed deployment descriptor
        ↓
exact manifest + exact UKI
        ↓
slot-bound deployment
        ↓
userspace health gate
```

Two signatures have distinct jobs. The platform Secure Boot PE signature answers whether firmware permits execution of an EFI image. SOL's deployment signature authorizes one complete combination of manifest, UKI, slot, and generation. Neither substitutes for the other.

## A/B Is a State Machine, Not Two Partitions

Creating slots A and B does not automatically create reliability. The hard questions are when B becomes selectable, when its remaining attempt count is consumed, who may declare success, and what happens if power fails between those operations.

`sol-boot-core` models the policy as a deterministic state machine with no UEFI, filesystem, graphics, clock, or cryptography dependency:

```text
Known-good A
    │ stage verified B
    ▼
Trial B (bounded attempts)
    │ exact health report
    ├──────────────────────────► Promote B
    │ failure / exhausted attempts
    └──────────────────────────► Fall back to A

No valid deployment ──────────► Recovery
```

Its most important ordering rule is **consume before transfer**. Before control passes to a trial UKI, the bootloader persists the consumed attempt and reads back the exact state. Otherwise, power loss during boot could replay the same attempt forever and trap the machine in a loop.

The API makes that ordering explicit. `prepare_boot` produces a `PersistTrial` plan. Only after the adapter verifies durable storage does `confirm_persisted` expose the trial action. Correctness is a requirement on the caller rather than a comment that can be ignored.

## Kernel Entry Is Not Boot Success

A defective release may start the kernel and several services before failing at storage, accounts, or the compositor. `StartImage` returning successfully cannot make a deployment known-good.

Before a trial, `sol-boot` writes an exact attempt-report template containing slot, generation, and attempt. Early userspace copies it to the success location only after its health gate. On the next boot, the state machine accepts only a report matching the pending trial exactly. A stale report from another slot, generation, or attempt cannot promote the current deployment.

Success is therefore an explicit commit between userspace and boot policy, not a guess that the machine remained alive for a while.

Today, report transport still relies on installer and early-userspace protection of the EFI System Partition. TPM-backed report authentication remains a release blocker, and the repository says so explicitly.

## Durable State Must Survive Torn Writes

The boot state itself can be damaged. SOL keeps redundant records with magic, version, length, a monotonic sequence, fixed A/B entries, and CRC32 torn-write detection. The highest valid sequence wins. Either copy remains useful if the other is missing, corrupt, or partly written; conflicting copies with the same sequence are rejected.

CRC32 detects accidental corruption. It is not authentication. Signatures, protected transport, or a future hardware trust root must provide authenticity.

Fault-injection tests fail before writes, at every byte of a torn write, before and after sync, and during read-back. The invariant is not merely that a filesystem call returns success. It is that the machine retains a known-good deployment and never launches a trial whose attempt consumption was not durably confirmed.

## Recovery Cannot Depend on the Desktop

When both slots fail, “open Settings to repair the system” is not useful. The Shell, compositor, account services, or system image may be the failing component.

SOL therefore keeps boot state independent of the graphical Shell and requires an independently bootable recovery path. A recovery request is consumed before use; redundant recovery images are tried separately. Updates to the boot authority and recovery are intended to follow the same write-inactive, verify, one-shot-trial, promote-or-fallback rule.

`sol-boot` can already try independent recovery EFI images. The complete recovery environment and boot/recovery self-update trials remain future work. The essential property is fixed first: desktop failure must not erase the repair path.

## Graphics Quality Cannot Weaken Boot Policy

SOL wants the first frame to use the panel's preferred resolution where firmware exposes it and to minimize visible mode changes between UEFI, Linux, and the compositor. That seamless handoff is a quality goal, not a security dependency.

`sol-boot` only chooses the EDID-preferred resolution if GOP actually exposes that mode. Otherwise it preserves a usable current mode instead of inventing timings. Rendering bounds every framebuffer write and supports RGB, BGR, and valid bit-mask modes. Graphics failure may degrade presentation, but it cannot alter verification, retry, fallback, or recovery decisions.

## What Exists Today

As of August 26, 2026, the repository contains executable foundations rather than only ADRs:

- `sol-boot-core` implements A/B trials, bounded attempts, known-good fallback, recovery selection, and exact success-report binding;
- a canonical 168-byte Ed25519-signed deployment record binds full manifest/UKI lengths and SHA-256 digests;
- redundant durable state has monotonic sequences, strict encoding, and torn-write fault injection;
- `sol-boot.efi` cross-builds as a PE32+ x86-64 EFI application and runs under OVMF;
- the UEFI adapter verifies the descriptor, manifest, and UKI, durably consumes an attempt, and starts the UKI with `LoadImage` / `StartImage`;
- the OVMF harness covers fail-closed recovery and a complete signed A/B trial through health reporting and promotion on the next boot.

Release qualification still requires TPM-backed success reports, safe EDID Active protocol wiring, physical-hardware graphics handoff, a complete recovery image, and boot/recovery self-update trials. Platform Secure Boot PE signing and key provisioning are also separate release-pipeline work; the private release key is never embedded in the bootloader.

The precise claim today is that SOL has a verifiable development and OVMF boot path. It has not yet qualified the complete trust chain on physical hardware.

## The Bootloader Starts the Operating-System Promise

When SOL describes itself as a Linux-family OS rather than a desktop installed on an arbitrary distribution, the bootloader becomes part of the product boundary. It defines where system identity begins, who owns update failure, and which evidence is sufficient to call a version known-good.

The design does not assume that failure can be eliminated. It assumes signatures can be corrupted, updates can lose power, new releases can fail, state writes can tear, and graphics can break—and preserves a verifiable next action for each case.

Read the [`sol-boot` README](https://github.com/viloris-org/SOL/blob/main/boot/sol-boot/README.md), [`sol-boot-core` README](https://github.com/viloris-org/SOL/blob/main/boot/sol-boot-core/README.md), [boot-boundary ADR](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0019-os-product-and-boot-boundary.md), and [graphics-handoff ADR](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0026-sol-boot-uki-and-graphics-handoff.md) for the implementation and its explicit qualification limits.

This article joins [SCP's window-system security boundary](/en/articles/designing-scp-secure-compositor-protocol), [SOL's minimum-authority permission model](/en/articles/sol-capability-permission-system), and [application signing with publisher lineage](/en/articles/sol-app-signing-publisher-lineage) in the SOL system-contract series.

When the next boot succeeds, the bootloader should still disappear quietly. It should be quiet because the failure paths were designed, persisted, and tested—not because they were ignored.

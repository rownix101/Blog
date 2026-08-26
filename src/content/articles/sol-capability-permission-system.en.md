---
slug: sol-capability-permission-system
lang: en
title: "Permissions Are Not Prompts: SOL's Revocable Minimum-Authority Model"
description: SOL begins with default denial, signed identity, typed actions, and portals. It scopes each grant by user, application, capability, resource, and duration, and requires grant, audit, and handle issuance to commit atomically.
date: 2026-08-26
topic: Open Source
coverImage: /images/articles/sol-capability-permission-system.svg
coverAlt: SOL turns an authenticated application's typed request into a scoped handle limited by user, capability, resource, and duration
featured: false
---

Many products reduce permission management to prompts: ask when an application first accesses the camera, let the user click Allow, and provide a few switches in Settings. That interface matters, but it is not the permission system. The real system determines which process receives which resource, for how long, whether an update preserves access, how already-issued credentials become invalid after revocation, and whether any alternate path bypasses the decision.

SOL begins with a stricter premise: **permissions are not UI; they are an end-to-end path from authenticated application identity to kernel and broker enforcement.**

The previous [SCP article](/en/articles/designing-scp-secure-compositor-protocol) described capability tokens for windows, fullscreen, clipboard access, and capture. This article expands the boundary to documents, accounts, credentials, cameras, microphones, notifications, automation, and system actions.

> A manifest defines what an application may ask for. User consent and managed policy define what it actually receives. Neither creates ambient authority by itself.

## Declaration Is Not a Grant

A signed `.app` manifest declares requestable capabilities. It grants none of them.

If installing a camera-declaring app automatically grants camera access, its signature proves only that the publisher wanted a camera. It does not prove that the user agreed. First-party status, store review, an existing account, or authority held by an older release must not create new access implicitly.

The intended chain is:

```text
Signed manifest: capability is requestable
        ↓
Authenticated process: who is asking
        ↓
Typed request: exact action and resource
        ↓
Policy + trusted consent: scope and duration
        ↓
Atomic grant + audit + handle issuance
        ↓
Kernel / portal / broker enforcement
```

If any step fails, no partial authority may remain.

## How Small Should One Grant Be?

SOL defines a durable permission atom as:

```text
user
× App ID / verified publisher lineage
× capability
× resource scope
× duration
```

“This user allows this editor to open one selected document once” is fundamentally different from permanent access to the Documents directory. The user, durable application identity, resource, duration, and policy source all matter.

When a narrow portal is enough, a broker should reject broad ambient access. A file picker returns a handle to the selected document rather than exposing its parent directory. A screen-share grant names one window or output and session rather than all future pixels. An account service returns a short-lived credential lease rather than a durable token for the application to store.

Minimum authority is not a more alarming prompt. It is an architecture that does not need to hand over unnecessary power.

## Why Typed Actions Matter

Search, Quick Settings, notifications, automation, accessibility, voice, and AI may all request system work. If those entry points receive an arbitrary shell string, the OS cannot reliably attribute the caller, map the operation to a capability, describe what the user approved, or create a meaningful audit record.

`sol-system` therefore defines a closed `SystemAction` catalog. Launching an application, system search, changing output volume, invoking a declared notification action, requesting capture, and opening a document are typed operations. Each maps to one `SystemCapability`; there is no untyped executable-and-arguments escape hatch.

An AI may request `OpenDocument`, but it cannot turn natural language into an implicit root shell. A notification may invoke a declared action without injecting arbitrary arguments into a private service. Types are not enforcement, but they make requests stable objects that can be attributed, authorized, and audited.

## Consent Belongs to a Trusted Boundary

An application's self-drawn permission prompt has no security value. The app can counterfeit system style and ignore a denial. SOL's consent UI must be a trusted Shell surface that identifies application, publisher, resource, purpose, scope, and duration.

A workflow may explain several needs on one system page, but each capability retains its own control, commit, and revocation. There is no ambiguous Allow All that hides unrelated authority.

When policy returns `RequireUserConsent`, the current API creates an opaque `ConsentId`; it neither authorizes nor executes the action. Trusted UI resolves it as allow once, allow always, or deny, and the same consent cannot be replayed. Even an `Authorized` result only binds a future protected adapter to that exact request. It is not a bearer token for arbitrary private services.

## Grant, Audit, and Handle Must Commit Together

The hardest permission failures occur between components: a grant is persisted but the audit write fails; an account service prepares a lease before the coordinator crashes; or an allow-once decision can be consumed again after power loss.

SOL's target boundary makes grant persistence, the required audit record, and handle or lease issuance one transaction. The handle becomes usable only after commit. If validation, storage, audit, or issuance fails, no part of the authorization is effective. Allow-once consumption must also be durable and atomic.

When another privileged service participates, `sol-securityd` is the sole coordinator. Services may prepare state under a transaction ID, but prepared associations remain unusable. They activate only after validating the coordinator's commit proof. Revocation first commits a higher authorization generation; brokers reject older generations even if physical cleanup is delayed or another service crashes.

## Updates Preserve Identity, Not Live Authority

Clearing every permission on update creates consent fatigue. Preserving grants based only on an App ID string lets a same-name attacker take them over.

SOL's durable security identity is **App ID + verified publisher lineage**. Same-lineage updates and rollbacks may retain durable grants, but bundle activation revokes all handles tied to the old release or process generation. A replacement process requests new handles, and the broker rechecks the manifest declaration, durable grant, scope, duration, and current policy.

A publisher discontinuity is a new security identity and inherits nothing. Newly declared capabilities are only requestable. Uninstall fences outstanding leases and revokes durable grants; reinstall requires new consent even if application data was retained. Data retention and authority retention are separate decisions.

## The Sandbox Must Exist Before Untrusted Code Runs

If an app starts first and the runtime later asks it not to read certain directories, the permission model is voluntary. SOL intends to construct a default-deny sandbox before the third-party entry point executes and project grants into real enforcement.

The planned combination includes namespaces, cgroups, seccomp, Landlock and/or another LSM, filesystem ownership, per-app storage, SCP mediation, and portals. The final LSM combination is not fixed, but the invariant is: SDK calls are requests; real authority comes from kernel objects, scoped handles, or privileged brokers.

An application shipping its own toolkit or runtime must not gain additional access. UI consistency may depend on SolKit. Security isolation cannot.

## What Exists Today

The permission work has two different maturity levels.

Existing API and service foundations include:

- a closed `SystemAction` catalog, caller-attributed requests, default-deny policy, allow/deny/revoke, opaque consent, and typed audit records in `sol-system`;
- deterministic memory and file permission stores, memory and file audit stores, and tests;
- a `sol-portal` typed authorization facade for document-open and screen-capture requests, a D-Bus adapter, and a screencast-session lifecycle;
- application/session/capability-bound token foundations and object-ownership checks in SCP.

Production enforcement that remains open includes:

- the authoritative identity, grant ledger, transaction coordinator, revocation generations, and private audit store in `sol-securityd`;
- a kernel/LSM sandbox constructed before application entry;
- one atomic store for grant, audit, and handle issuance—the current stores remain separate;
- real file, camera, microphone, account, and credential brokers plus trusted consent UI;
- crash injection, sandbox-escape, spoofing, revocation, and real desktop/hardware validation.

The code proves typed requests, default denial, caller-scoped grants, consent lifecycle, and portal contracts. It does not yet prove containment of a hostile Linux process. A screenshot of a permission prompt would not prove that either.

## Denial Must Become a Testable Property

Security demos usually show the success path. SOL cares whether denial is stable: undeclared and ungranted access fails; a selected document does not reveal its directory; old handles die after update or revocation; a participant crash cannot expose an uncommitted credential; and a private runtime cannot bypass the broker.

That is why permission management deserves its own system design. Prompts help people decide. Manifests bound what can be requested. Typed APIs express intent. Signatures bind identity. Only sandboxing, brokers, transactions, revocation, and audit turn that decision into authority.

Read the [application security README](https://github.com/viloris-org/SOL/blob/main/security/README.md), [ADR-0021](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0021-application-security-permissions.md), the [typed-action ADR](https://github.com/viloris-org/SOL/blob/main/docs/decisions/0013-system-action-permission-layer.md), and [`sol-portal`](https://github.com/viloris-org/SOL/tree/main/services/sol-portal) for the current contract and implementation boundaries.

This article joins [SCP's window-system security boundary](/en/articles/designing-scp-secure-compositor-protocol), [verifiable A/B boot and recovery](/en/articles/sol-boot-verifiable-ab-recovery), and [application signing with publisher lineage](/en/articles/sol-app-signing-publisher-lineage) in the SOL system-contract series.

SOL's goal is not to make users answer more permission questions. It is to ask for less, avoid bundling unrelated authority, and make “no” or “revoke now” true across every access path.

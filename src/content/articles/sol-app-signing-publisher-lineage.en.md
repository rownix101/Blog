---
slug: sol-app-signing-publisher-lineage
lang: en
title: "Signatures Prove More Than Unchanged Files: Preserving Application Identity in SOL"
description: SOL signs complete bundles, versions, and minimum platform contracts, then uses publisher lineage to prove identity across key rotation so updates, rollback, permission inheritance, and revocation share one foundation.
date: 2026-08-26
topic: Open Source
coverImage: /images/articles/sol-app-signing-publisher-lineage.svg
coverAlt: A SOL application bundle passes through complete content hashing and release signing while publisher identity continues from Key A through Key B to Key C
featured: false
---

“This application is digitally signed” sounds like a Boolean statement: valid signature, trusted file; invalid signature, rejected installation. An operating system has to answer much more.

Does the signature cover every bundle file? Can an attacker add an unlisted executable? How does the system know that a publisher using a new key is still the same publisher? Which historical versions remain valid after compromise? If one signer in a multi-signer release is corrupted, may another save it? Can an unfamiliar signer using the same App ID inherit document, account, or camera grants?

[SOL](https://github.com/viloris-org/SOL) is designing `.app` signing not merely to detect changed files, but to establish a long-lived **publisher identity** shared by integrity checks, updates, key rotation, rollback, permission inheritance, and revocation.

> A signature must prove not only that these bytes came from a key, but also which continuously evolving application identity authorized the release.

## Integrity, Authenticity, and Continuity

Application signing needs at least three distinct properties:

1. **Content integrity:** installed bytes match the signed release.
2. **Publisher authenticity:** the holder of an authorized private key approved them.
3. **Identity continuity:** the current key was explicitly authorized by the previous trusted key.

Integrity alone permits an attacker to repackage and self-sign. Integrity plus authenticity makes safe key replacement impossible. Treating a matching App ID string as continuity lets an unrelated publisher take over the old application's authority.

SOL therefore defines durable security identity as `App ID + verified publisher lineage`. A concrete release also binds an exact bundle hash and monotonic version code. Durable grants follow lineage; running processes and live handles follow a precise release.

## What Exactly Is Signed?

SOL applications are directory-based bundles on disk and may be compressed for distribution:

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

`manifest.json` is a canonical, sectioned, complete inventory. `App.toml`, executables, libraries, resources, metadata, and every other regular file have a relative path, exact length, and SHA-256 digest. A domain-separated total content hash binds the complete inventory.

Verification rescans the bundle and compares every expected and actual path. Modified, missing, or newly added unsigned files fail. Symbolic links, undeclared executable content, unexpected signature-directory entries, and non-canonical metadata are rejected.

The verifier must answer not only whether listed files are correct, but whether any unlisted content could be interpreted by the runtime.

## The Signature Block Must Be Non-Malleable

Canonical protobuf `signature.bin` contains one or more signers. Signed release data binds the App ID, display version, monotonic `version_code`, manifest and content digests, timestamp, and minimum SOL version.

The compatibility floor belongs inside the signature. Otherwise, an attacker could lower an outer field and persuade an older system to load an application that assumes newer security semantics. Tests modify `min_sol_version` directly and require verification to fail.

SOL currently supports:

- Ed25519 as the default for new publishers;
- ECDSA P-256 with SHA-256 for existing PKI compatibility;
- RSA-4096 with SHA-256 for legacy publishers only.

The format reserves an optional X.509 certificate field, but the first implementation rejects populated certificates until full chain and validity verification exists. Raw publisher keys remain authoritative. Partial validation is not treated as sufficient.

## Multi-Signer Verification Is All-or-Nothing

Mergers, joint publication, and migration may require several signers. Accepting a bundle when any one signer is valid is dangerous: an attacker could append their own signer beside a legitimate signature and induce downstream systems to treat them as a co-publisher.

SOL validates every signer and its corresponding lineage. If any declared signer fails, the complete bundle fails. Multi-signing expresses release policy; the verifier enforces the whole policy rather than selecting a convenient subset.

## Key Rotation Should Not Create a Stranger

Private keys cannot remain unchanged forever. They expire, algorithms evolve, custody changes, and compromise happens. If replacing a key always creates a new application identity, users must choose between permanent exposure to an old key and repeated loss of trust and permissions.

Publisher lineage lets each current key authorize the next:

```text
Key A (root)
    │ signs Key B + rotation metadata
    ▼
Key B
    │ signs Key C + rotation metadata
    ▼
Key C (current release signer)
```

Each transition binds the next public key, algorithm, UTC timestamp, reason, and description. Verification checks adjacency, every transition signature, equality between the current release signer and the final lineage key, canonical encoding, maximum length, time budget, duplicates, cycles, and broken links.

The first root key defines publisher identity. Only the final current key may sign new releases; historical keys continue to verify controlled rollback candidates. A new lineage is continuous only when it has the same root and the old chain is its exact prefix.

If Key X signs `com.example.editor` without an A → X continuity proof, the same App ID represents a new security identity and inherits no grants.

## Rollback and Anti-Replay Must Coexist

Allowing historical keys to verify old releases does not let any old bundle overwrite a newer one. A strictly monotonic `version_code` makes ordinary downgrade attempts fail.

User-directed rollback is a package-policy operation that selects a previously verified and activated bundle hash. It is not an instruction to disable version checks. This separates deliberate recovery from replay of a vulnerable package.

The signed minimum SOL contract also lets package resolution select a compatible retained application during OS rollback—or mark it unavailable—without rewriting the publisher's compatibility declaration.

## Revocation Is More Than Deleting a Key

When a publisher key is compromised, the system needs a cutoff after which its releases are rejected and may need a safe replacement. The implementation provides a repository-synchronized revocation cache containing key fingerprint, `revoked_after`, reason, and optional replacement.

Only affected signatures at or after the cutoff are blocked. Cache state is classified as fresh, stale, expired, or missing so higher-level install policy can handle offline and outdated information explicitly.

This is currently an optional verification check and state model. Repository metadata, synchronization, transparency, recovery policy, and installation UX are not complete. Recognizing revocation is not the same as solving the entire compromised-key lifecycle.

## What Exists Today

`sol-bundle` already provides a substantial library, CLI, and security-test foundation:

- key generation, signing, verification, signer addition, and key rotation;
- Ed25519, ECDSA P-256, and RSA-4096 round trips;
- a canonical full-content manifest with added, changed, and missing file detection;
- canonical protobuf signatures and all-or-nothing multi-signer verification;
- bounded, cycle-resistant publisher lineage and continuity checks;
- downgrade rejection, signed minimum SOL version, and primary-lineage grant continuity;
- optional key revocation-cache checks;
- fail-closed rejection of symlinks, undeclared executables, unexpected signature entries, and malformed metadata.

Still open are the complete distribution-archive install pipeline, repository signing and transparency, production revocation synchronization, publisher recovery policy, X.509 validation, and integration of verified identity with `sol-packaged`, the launcher, sandbox, and `sol-securityd`.

The precise claim is that SOL can locally build, sign, and strictly verify `.app` bundles and prove publisher continuity across key rotation. It has not completed the production trust chain from repository distribution through install, launch, revocation, and recovery.

## Signatures Connect Code to Authority

Application signing is often treated as one package-manager step. In SOL, it is a root of permission identity. Without stable lineage, the OS cannot know whether an update is still the same application. Without an exact bundle hash, live handles cannot bind to a release. Without anti-replay, rollback and downgrade attack collapse into one operation. Without a complete inventory, injected code may inherit authority intended for the original app.

That is why signing deserves its own design discussion. The cryptographic primitive is the smallest part. The difficult questions are what must be signed, how identity survives time, when inheritance must be denied, and how the system recovers from failure or compromise.

Read the [`sol-bundle` README](https://github.com/viloris-org/SOL/blob/main/packaging/sol/bundle/README.md), [ADR-0029](https://github.com/viloris-org/SOL/blob/main/docs/decisions/ADR-0029-app-signing-publisher-lineage.md), [signing tests](https://github.com/viloris-org/SOL/blob/main/packaging/sol/bundle/tests/signing.rs), and [native packaging boundary](https://github.com/viloris-org/SOL/blob/main/packaging/sol/README.md).

This article joins [SCP's window-system security boundary](/en/articles/designing-scp-secure-compositor-protocol), [verifiable A/B boot and recovery](/en/articles/sol-boot-verifiable-ab-recovery), and [SOL's minimum-authority permission model](/en/articles/sol-capability-permission-system) in the SOL system-contract series.

An application may change versions, build artifacts, and eventually keys. What SOL preserves is not one immutable file, but an identity that can be verified, revoked, and protected from takeover by a same-name stranger.

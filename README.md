# LabRepairLogger — official binary releases

This public repository contains **compiled Client updates only**. The application source code, internal development, database files, private keys and GitHub credentials are not published here.

## Downloads

Nightly updates appear under [Releases](https://github.com/karoku9/LabRepairLogger-Releases/releases). Each Nightly release contains:

- `LRL-Nightly-Client-VERSION-win-x64.zip` — Windows x64 Client binaries.
- `client-update.json` — signed RSA-PSS/SHA-256 release manifest, binding the exact GitHub asset ID, byte length and archive checksum.

The Client pins the release signing public key. It verifies the signature and archive hash before preparing any update. The repository is public so **no GitHub access token is needed** for downloads, but public availability does not remove the Client's separate licensing or permissions.

The Nightly updater requires Windows x64 and the appropriate .NET Desktop runtime. The Client application handles activation, backup and rollback checks; do not manually replace its active binaries or database.

## Source and security

The source repository is private. This repository intentionally has only release documentation and uploaded binary assets. Report security concerns privately to the maintainer; do not post secrets or user databases in public issues.

Copyright belongs to the respective rights holders. Availability of compiled releases does not grant additional source-code or redistribution rights.

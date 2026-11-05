# Handoff migration

The original handoff archive is **not yet imported**. The GitHub repository initially contains the migration and CI infrastructure only.

## One-file import

1. Open the [handoff folder](https://github.com/nssang00/umaa_dev_studio/tree/main/handoff) on branch `main`.
2. Use **Add file → Upload files** to upload `UMAA_Development_Studio_HANDOFF_2026-11-05_v0.9.1.zip` into that folder.
3. Commit the upload to `main`. The **Import v0.9.1 handoff** GitHub Action will verify the ZIP, copy `project/` into the repository root, preserve the handoff documents under `handoff/`, and create `package-lock.json` when npm installation succeeds.
4. Check the import run's test/build result. Subsequent updates use the normal **CI** workflow.

The older binary ZIPs under `history/` are intentionally not copied, to avoid cluttering Git with prior release archives; they remain in the original uploaded archive. The original manifest and SHA256SUMS are retained as **handoff-archive** provenance, not current repository file checksums.

**Scope:** CI validates static code, Node/model tests and browser bundle build. It does not verify browser E2E, real UMAA DDS interoperability, or deployable DDS-connected components.

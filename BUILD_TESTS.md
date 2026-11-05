# Build / Test status (2026-11-04)

- PASS: `npm run check:static` — esbuild static IIFE design, JS/JSX only, no server, React Flow v12 import.
- PASS: `npm run test:icd` — Autopilot 14 Service Bindings (7P/7C), 56 Operations, 32 Topics, 32 Endpoints, `MissionPlanConstraintControl` Add/Delete, `PrimitiveDriverControl`, `ActiveConstraintsControl`, Large Set topic, CMake/manifest generation.
- PASS: Node.js `--check` JavaScript, TypeScript global parser for JSX source syntax (verification only; TypeScript not a project dependency).
- PENDING: actual frontend esbuild build/browser load — package registry inaccessible in this environment (`npm install --offline` gives ENOTCACHED).
- PENDING: Dagre layout test requires `npm install`.
- PASS: CMake-generated Autopilot mock `.so` build on Linux (no DDS transport) — see separate generation sample.

No actual UMAA DDS-compatible IDL/C++ network stack is claimed.

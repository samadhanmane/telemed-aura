# Hackathon Assessment Documents — Telemed Aura

**Project Title:** AI-Enabled Telehealth & Patient Data System  
**Product:** Telemed Aura  
**Branch:** `testcase` (includes validation, error handling, and these docs)

---

## Presentation Files (Submit Separately)

| Marks | Document | File |
|-------|----------|------|
| 10 | Coverage of Project Objectives | [DOCUMENT_01_PROJECT_OBJECTIVES.md](./DOCUMENT_01_PROJECT_OBJECTIVES.md) |
| 15 | Coverage of Project Modules | [DOCUMENT_02_PROJECT_MODULES.md](./DOCUMENT_02_PROJECT_MODULES.md) |
| 15 | Testing Strategy | [DOCUMENT_03_TESTING_STRATEGY.md](./DOCUMENT_03_TESTING_STRATEGY.md) |
| — | Test Scenarios & Test Cases (65 cases) | [DOCUMENT_04_TEST_CASES.md](./DOCUMENT_04_TEST_CASES.md) |
| 10 | Tools Used | [DOCUMENT_05_TOOLS_USED.md](./DOCUMENT_05_TOOLS_USED.md) |

---

## Supporting QA Material

- [MANUAL_TEST_CASES.md](../MANUAL_TEST_CASES.md) — Extended manual QA catalog
- [ERROR_HANDLING.md](../ERROR_HANDLING.md) — API response and validation reference
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) — Development phases

---

## How to Use Document 4 for Live Demo

1. Set up `.env` files (see `frontend/.env.example`, `backend/docs/ENV.md`).
2. Run backend and frontend dev servers.
3. Execute test cases in **DOCUMENT_04**; fill **Actual Result** and **Status** columns.
4. Use scenario groups SC-01 through SC-05 for judge walkthrough.

---

*All content is derived from the Telemed Aura codebase. Features not in code are marked as not implemented (e.g. payments).*

# Verification record

Verified locally on 2026-11-08.

| Check                         | Result                                   |
| ----------------------------- | ---------------------------------------- |
| Distinct exercise catalogue   | 100 challenges, 308 acceptance cases     |
| Functional tool catalogue     | 50 tools; all supplied examples executed |
| Unit and regression suite     | 206 passed, 0 failed                     |
| Browser suite with PostgreSQL | 4 passed, 0 skipped                      |
| Production build              | Passed                                   |
| TypeScript                    | Passed as part of production build       |

The browser suite covers failing then successful code execution, progress after reload, bookmarks, valid and invalid tool input, notebook persistence, mobile navigation, search, no horizontal overflow, infinite-loop interruption, PostgreSQL round-trip persistence after clearing local storage, isolation between two browser sessions, rejection of foreign-origin writes, and persistence of note deletion.

The sandbox suite additionally checks absent host APIs, fresh runtimes between cases, syntax errors, code-size limits, structural comparison, non-finite results and guest-memory exhaustion.

Browser checks used Chromium. PostgreSQL verification used a disposable local PostgreSQL 18 instance; the included Docker Compose and CI configuration target PostgreSQL 17. Those deployment environments were not run here. No GitHub remote or public deployment has been created.

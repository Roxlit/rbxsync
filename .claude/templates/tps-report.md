```
 _____ __  __  ___  _  _______ ____  _____  _    ____ _  __
/ ____|  \/  |/ _ \| |/ / ____|/ ___||_   _|/ \  / ___| |/ /
\__ \| |\/| | | | | ' /|  _|  \___ \  | | / _ \| |   | ' /
 ___) | |  | | |_| | . \| |___  ___) | | |/ ___ \ |___| . \
|____/|_|  |_|\___/|_|\_\_____||____/  |_/_/   \_\____|_|\_\
                 G  A  M  E  S
```

---

# TASK PROGRESS SUMMARY (TPS) REPORT

| Field                | Value                                    |
|----------------------|------------------------------------------|
| **Report ID**        | TPS-RBXSYNC-{XX}                         |
| **Date Filed**       | {YYYY-MM-DD}                             |
| **Agent ID**         | {worker-name / session-id}               |
| **Department**       | {core / server / cli / mcp / vscode / plugin} |
| **Priority**         | {P0 Critical / P1 Urgent / P2 High / P3 Medium / P4 Low} |
| **Status**           | {Complete / Partial / Blocked}           |
| **Reviewed By**      | Manager Agent                            |

---

## SECTION 1 -- EXECUTIVE SUMMARY

**Issue Reference:** RBXSYNC-{XX}

**Summary:** {One-line description of what was done}

**Business Justification:** {Why this work was necessary -- bug impact, feature value, or technical debt rationale}

---

## SECTION 2 -- WORK PERFORMED

### Files Modified

| File Path | Change Description |
|-----------|--------------------|
| `{path/to/file}` | {What was changed and why} |

### Metrics

| Metric         | Value |
|----------------|-------|
| Lines Added    | {N}   |
| Lines Removed  | {N}   |
| Files Changed  | {N}   |

### Tests

| Test Suite     | Result         | Notes          |
|----------------|----------------|----------------|
| `cargo build`  | {Pass / Fail}  | {any notes}    |
| `cargo test`   | {Pass / Fail}  | {any notes}    |
| `cargo clippy` | {Pass / Fail}  | {any notes}    |
| Manual Testing | {Pass / Fail / N/A} | {any notes} |

---

## SECTION 3 -- DELIVERABLES

| Deliverable      | Value                                         |
|------------------|-----------------------------------------------|
| **PR Number**    | #{N}                                          |
| **PR Link**      | https://github.com/devmarissa/rbxsync/pull/{N}|
| **Branch**       | {branch-name}                                 |
| **Build Status** | {Verified / Pending / Failed}                 |

---

## SECTION 4 -- RISK ASSESSMENT

| Risk Factor            | Assessment                |
|------------------------|---------------------------|
| **Breaking Changes**   | {Y / N}                   |
| **Regression Potential** | {Low / Medium / High}   |
| **Dependencies Affected** | {List or "None"}       |

**Additional Risk Notes:** {Any further context on risk, edge cases, or areas requiring monitoring}

---

## SECTION 5 -- SIGN-OFF

**Worker Certification:**
I, _{Agent ID}_, certify that the work described in this report has been completed to the best of my ability, all changes have been tested, and this report accurately reflects the work performed.

- [ ] Worker: _{Agent ID}_ -- Date: {YYYY-MM-DD}

**Manager Approval:**

- [ ] Manager Agent -- Date: ___________

---

_This report was prepared in accordance with Smokestack Games TPS Guidelines v1.0_
_Template version: 1.0.0 | Last updated: 2026-01-29_

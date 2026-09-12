# DawoLife — Dashboard Testing (Manual QA Plan)

Module: **Dashboard testing** — web (Next.js) + mobile (Flutter) side-by-side.
Covers: public overview stats, admin dashboard, agent dashboard, owner account, role gating, empty states, and data cross-checks against the API.

## 1. Scope

| Dashboard | Web URL | Mobile screen | Data source |
|---|---|---|---|
| Public stats (hero) | `/` hero stats | Home header | `GET /api/stats/overview` (60s cache) |
| Admin dashboard | `/admin` | `admin_dashboard.dart` | `GET /api/admin/overview` |
| Agent dashboard | `/agent` | `agent_dashboard.dart` | `GET /api/agent/stats` |
| Owner account | `/agent` (owner shell) | `AgentPortalScreen` (owner) | same as agent |

Out of scope: listing pages, post wizards, messages, payments flows (tested elsewhere). Dashboard-adjacent counts (notifications, permission requests) are spot-checked for consistency only.

## 2. Prerequisites / Setup

1. Server running on `:4000` with migrated DB (`npx prisma migrate deploy`, full `npx prisma generate`).
2. Web dev server (user's own terminal) and one mobile emulator/device.
3. Test accounts (create via `/register`; verify email via the **real backend OTP flow** — code persists on the user record with expiry, emailed via Resend from `POST /api/auth/resend-otp` / checked in `verify-otp`):
   - If local email delivery is unavailable, the dev-only `OTP_BYPASS_CODE` env var (server `auth.ts:25`, gate at `auth.ts:192`) accepts a single fixed code instead — optional shortcut, does not replace the real OTP path used for QA.
   - **Admin** — root: `falmitesfaye@gmail.com` / `SecurePass@123`
   - **Agent A** — Approved, onboarding complete (seed: 3 properties, 2 vehicles; mix of statuses)
   - **Agent B** — Pending agent (onboarding complete, not yet approved)
   - **Owner O** — Approved owner (seed: 1 approved property)
   - **Buyer U** — Approved `user` (seed: 2+ favorites, 1 message thread)
4. Seed a known-good state and record it: total counts by status for properties, vehicles, agents (incl. owner), payments by status, unread messages, unread notifications. Use SQL/Prisma Studio queries as ground truth.

## 3. Test execution

For each case: run on web, then on mobile. Record PASS/FAIL in the defects log (§8). Expected values below assume recorded seed numbers.

---

## A. Public overview stats (`/api/stats/overview`)

| ID | Steps | Expected |
|---|---|---|
| A1 | Load web `/` with seed data; call `GET /api/stats/overview`. | Web hero numbers == API: `listedHouses` = Approved properties, `listedCars` = Approved vehicles, `verifiedAgents` = Approved `agent`+`owner`, `activeUsers` = emailVerified users. |
| A2 | Mobile home header stats. | Same four numbers as web and API. |
| A3 | Seed 1 new Approved property, reload without… wait 60s. | Both platforms reflect the new count after cache expiry (map shows stale ≤60s is acceptable). |
| A4 | Logged-out vs every role. | Public stats visible to all; no auth prompt. |
| A5 | **Regression:** `verifiedAgents` must include owner accounts (matches `role IN [agent, owner]`). | If admin dashboard disagrees (see B5), flag cross-endpoint inconsistency. |

## B. Admin dashboard (web `/admin` + `admin_dashboard.dart`)

| ID | Steps | Expected |
|---|---|---|
| B1 | Load `/admin`. | Cards render: agents, pending agents, properties, pending properties, vehicles, pending vehicles. Values == `GET /api/admin/overview`. |
| B2 | Payment stats. | `totalRevenue` = sum of `Completed`; `completedCount`/`pendingCount`/`failedCount` match payments table filters. |
| B3 | Recent agents list. | 5 most recent by `createdAt`; shows id/username/email/status. |
| B4 | Recent payments list. | 5 most recent; shows title/method/paymentType/status/amount. |
| B5 | **Known gap — owners excluded:** create a pending Owner. | `pendingAgents` does NOT include the owner (server counts `role: 'agent'` only). Record as defect (G1) — verify web + mobile agree. |
| B6 | Approve/reject from `/admin/agents`, then reload dashboard. | Counts update (pendingAgents decreases, agents increases). |
| B7 | Mobile `admin_dashboard.dart`. | Same cards/values as web; chart series is hardcoded (see G2). |
| B8 | Empty DB check (see F). | No crash; zero cards show 0; recent lists show empty state. |

## C. Agent dashboard (web `/agent` + `agent_dashboard.dart`)

| ID | Steps | Expected |
|---|---|---|
| C1 | Login as Agent A (Approved). | Dashboard loads; property/vehicle counts match Agent A's own listings (all statuses). |
| C2 | Update counts: edit 1 listing (→ Pending), post 1 new. | Pending count and total increment accordingly on reload. |
| C3 | Recent listings. | Only Agent A's own listings, newest first. |
| C4 | **Known gap — view counts:** `totalViews` on web dashboard. | Always `0` (hardcoded). No real view data exists. Record (G3). Mobile: verify whether it renders a views number and from where. |
| C5 | Mobile `agent_dashboard.dart`. | Same stat cards as web. |
| C6 | Agent B (Pending) login → `/agent`. | Sees PendingApproval gate on both platforms (no dashboard stats exposed pre-approval). |
| C7 | Rejected-agent login. | Redirected to onboarding resubmit + profile on both platforms. |

## D. Owner account (agent portal as owner)

| ID | Steps | Expected |
|---|---|---|
| D1 | Login as Owner O (Approved). | Lands in agent shell on both web and mobile; portal label shows "Owner Portal" (web) / owner variant (mobile). |
| D2 | Agent dashboard stats for Owner O. | Counts == Owner O's own listings; if web/mobile labeling differs, record as cosmetic defect. |
| D3 | **Product gap:** confirm no owner-only features exist anywhere. | Both platforms identical to agent (expected per current design — record as design note G4, not a defect). |

## E. Role gating (route/entry access)

| ID | Steps | Expected |
|---|---|---|
| E1 | Buyer U requests `/admin` (web) / admin tab (mobile). | Blocked/redirected; no data leak on both. |
| E2 | Buyer U requests `/agent`; Agent B (not approved) requests `/admin`. | Both blocked consistently on web + mobile. |
| E3 | Admin opens `/agent` (web) and agent portal home (mobile). | **Blocked:** admin is redirected to the admin shell on both platforms. On web, only `/agent/properties/edit` + `/agent/vehicles/edit` (linked from the admin dashboard) are reachable to admins — rendered standalone with no agent nav; every other `/agent/*` route bounces to `/admin`. Mobile never renders the agent portal for admins. |
| E4 | Logged-out user opens `/` (`/api/stats/overview`). | Public; no 401. |

## F. Empty states

| ID | Steps | Expected |
|---|---|---|
| F1 | Fresh DB (or test user with 0 listings). | Admin dashboard zeros; agent dashboard zeros; recent lists render empty-state message (no crash). |
| F2 | Clear payment data for a new admin view. | `totalRevenue` = 0; recent payments empty state. |
| F3 | Mobile equivalents. | Same graceful empty states; no chart render errors. |

## G. Cross-check / data integrity

| ID | Steps | Expected |
|---|---|---|
| G1 | Compare `overview.agents` + `overview.pendingAgents` vs `/admin/agents` filter results. | Totals match (barring G1 defect re: owners). |
| G2 | Compare dashboard counts vs listing pages filtered per status. | Property/vehicle/pending numbers reconcile. |
| G3 | Notification/permission badges vs list pages. | Unread counts and permission-request badges match underlying lists within polling interval. |
| G4 | Same data viewed from web and mobile at same instant. | Identical numbers (allow cache/staleness up to poll intervals). |

---

## 7. Known gaps / expected-fails (do not start until tracked)

| ID | Gap | Where | Impact |
|---|---|---|---|
| K1 | `overview` agent counts exclude `owner` role (server `admin.ts:640`). | admin dashboard | Undercounts sellers |
| K2 | Chart series hardcoded on web and mobile admin dashboards; no time-series endpoint. | `/admin`, `admin_dashboard.dart`, `overview_chart.dart` | Misleading trend display |
| K3 | `totalViews` hardcoded `0` on web agent dashboard; no view-count tracking in schema. | `/agent` | Fake/incomplete metric |
| K4 | No `Sold`/`Rented` transition endpoint; no `featured` toggle (fields exist in schema only). | both platforms | Status columns always show Pending/Approved/Rejected |
| K5 | Mobile admin settings lacks app-wide contact/social editor (`PUT /api/settings`) that web `/admin/settings` has. | mobile admin | Web/mobile settings parity gap (verify during C-testing) |

## 8. Defects log (template)

| # | Area | Platform (W/M/Both) | Test ID | Severity | Expected | Actual | Steps to reproduce |
|---|---|---|---|---|---|---|---|
| – | – | – | – | – | – | – | – |

## 9. Exit criteria
- All A–G pass on both platforms, OR every failing case is logged with the owning gap (K1–K5).
- Zero data-leak findings in E.
- Defects log handed back so gaps K1–K5 can be fixed in the follow-up backend module.
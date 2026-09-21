# AIMS Spec Progress Diary

Last updated: 2026-09-19

## Where I am
Feature spec **aims-web** (requirements-first workflow). Spec docs are complete
and implementation has started.

Spec documents (all complete, format-validated):
- requirements.md — complete
- design.md — complete (serverless AWS architecture)
- tasks.md — complete (16 tasks)

Implementation progress (tasks.md):
- [x] Task 1 — Scaffold project structure and shared types (committed to Git)
- [x] Task 2 — Core field validation in the domain layer (DONE, NOT yet committed)
  - [x] 2.1 validators for identifier, quantity, NEQ
  - [x] 2.2 required-field presence checks
- [ ] Task 3 — NEXT: reference-data domain services (Manufacturer, Nature, HCC, Condition_Code)
- [ ] Tasks 4–16 — not started

## IMPORTANT: uncommitted work on the old machine
The Task 2 work and the NEQ reconciliation are NOT committed yet. Before leaving
the old machine I did NOT push. Working tree state:
- Modified: .kiro/specs/aims-web/design.md, requirements.md, tasks.md
- Modified: domain/types.ts
- New (untracked): domain/validation.ts, test/domain/validation.test.ts

If you want this work on the new machine, either:
(a) commit + push from the OLD machine first, then pull on the new one, OR
(b) re-do Task 2 on the new machine (it is small — one validation module + tests).

Recommended: option (a). See "Instructions for the new machine" below.

## Key decision this session: NEQ maximum reconciled
Per-item NEQ maximum standardized to **999,999.99 kg (~1,000 tonnes)** everywhere
(requirements 1.1, 1.5, 3.3, 3.4; design field-constraint table; domain/types.ts;
tasks.md 2.1 description). Rationale from web research: even the largest national
explosives depots hold on the order of hundreds of thousands of kg NEQ, so
999,999.99 kg is realistic and generous; 999,999,999.99 was unrealistic.
NOTE: the storehouse-level NEQ_Limit field deliberately KEEPS the larger range
0–999,999,999.99 (requirements 4.1, 4.2; design Property 18) — do not change it.

## What Task 2 delivered (already implemented)
- domain/validation.ts — pure validators with bounds as exported constants:
  Identifier 1–64 chars; Quantity integer 0–999,999,999; NEQ 0.00–999,999.99 (2 dp).
  Required-field check names exactly the omitted fields. Errors compose into a
  single structured VALIDATION_ERROR.
- test/domain/validation.test.ts — fast-check property tests (100 runs each),
  tagged "Feature: aims-web, Property N" for Properties 2, 3, 4.
- Build passes (`npm run build`), all 16 tests pass (`npm test`).

## Architecture (from design)
Fully serverless AWS:
- Frontend: React + Vite SPA on S3 + CloudFront
- API: API Gateway (HTTP API) + Cognito JWT authorizer
- Compute: TypeScript Lambdas over a pure, testable domain layer
- Data: DynamoDB single-table + GSIs; TransactWriteItems for atomic transfers
- Auth: Amazon Cognito (login, 5-attempt lockout ≥15 min, 15-min inactivity expiry)

## Project layout & conventions
- domain/    pure TypeScript logic (no AWS SDK), tested against InMemoryRepository
- adapters/  DynamoDB/Cognito/S3 (Task 11+)
- handlers/  Lambda entrypoints (Task 12)
- infra/cdk/ CDK: bootstrap, pipeline, app-stage, storage, database, auth, api stacks
- web/       React + Vite (Task 15)
- test/      Vitest; property tests use fast-check, ≥100 iterations, traceability tags
- Commands: `npm run build`, `npm test`, `npm run typecheck`

## Git / CI-CD status
- Repo: https://github.com/carbonless/aims.git (branch: main)
- CDK self-mutating CodePipeline: source carbonless/aims@main, Synth (npm ci/build/
  test + cdk synth), stages Dev -> Prod (Prod auto-promoted; add ManualApprovalStep
  to gate).
- One-time manual step still required: create the GitHub CodeConnections connection
  in the AWS console so Fn.importValue('AimsGitHubConnectionArn') resolves. Pipeline
  cannot source from GitHub until this exists.

## Next task detail — Task 3 (reference-data domain services)
- 3.1 create/round-trip + length validation for Manufacturer/Nature/HCC/Condition_Code
      (Condition_Code has a `serviceable` flag). Property tests P11, P12.
- 3.2 case-insensitive duplicate detection + reference-in-use guard. Property tests P13, P15.
- 3.3 constrained selectable-values lookup for the item editor. Property test P14.
- Requirements: 2.1–2.9. Build on domain/validation.ts and the Repository interface.

## Instructions for the new machine
See the chat message accompanying this update, or run the steps in the
"RESUME ON NEW MACHINE" section of this diary below.

## RESUME ON NEW MACHINE
1. (On OLD machine, if not done) commit + push the pending work:
     git add domain/validation.ts test/domain/ domain/types.ts \
       .kiro/specs/aims-web/requirements.md .kiro/specs/aims-web/design.md \
       .kiro/specs/aims-web/tasks.md AIMS_SPEC_DIARY.md
     git commit -m "Task 2: core field validation + reconcile per-item NEQ max to 999,999.99"
     git push
2. (On NEW machine) clone/pull:
     git clone https://github.com/carbonless/aims.git   # or: git pull
     cd aims && npm ci
3. Verify baseline:
     npm run build && npm test        # expect build clean, 16 tests passing
4. Open the aims workspace in Kiro and continue with:
     "Continue implementing the aims-web spec — start Task 3"

# AIMS Spec Progress Diary

Last updated: 2026-09-09

## Where I am
Working on the **aims-web** feature spec using the **requirements-first** workflow
(Requirements -> Design -> Tasks).

Progress:
- [x] Requirements document complete and format-validated
- [x] Technical design document complete and format-validated
- [x] Task list (tasks.md) generated from approved requirements and design
- [ ] **NEXT: Begin implementation, starting at Task 1 (scaffold project structure)**

## How to resume on the new machine
Open this workspace (`aims`) in Kiro and, in the aims-web spec, ask to:

> "Start task 1 for aims-web"

The tasks.md plan builds the pure domain layer + property tests first, then
wires it to AWS (DynamoDB, API Gateway/Lambda, Cognito, S3/CloudFront), and
finally the React/Vite frontend. Tasks are ordered so each builds on the prior.

## What the spec covers
AIMS (Ammunition Information Management System) — a greenfield, multi-site web app
for ammunition inventory management aligned with IATG-03.10 and IATG-01.40.

Nine capability areas:
1. Ammunition Inventory Management
2. Manufacturer & Reference Data Management
3. Hazard Classification & NEQ Tracking
4. Explosive Storehouse Management & Safety Limits
5. Condition / Serviceability Tracking
6. Ban & Restriction Management
7. Stock Movement & Audit Trail
8. Reporting & Inventory Accounting
9. User Access & Role-Based Authorization

## Architecture decided in design
Fully serverless AWS stack:
- Frontend: React + Vite SPA on S3 + CloudFront
- API: API Gateway (HTTP API) with Cognito JWT authorizer
- Compute: TypeScript Lambdas over a pure, testable domain layer
- Data: DynamoDB single-table design + GSIs; TransactWriteItems for atomic transfers
- Auth: Amazon Cognito (login, lockout, session expiry)

## Resolved item
NEQ maximum boundary discrepancy in requirements (RESOLVED 2026-09-09):
- Standardized item NEQ max at 999,999,999.99 kg across all criteria.
- Updated requirements.md criteria 1.1 and 1.5 (were 999,999.99) to match
  criteria 3.3/3.4, the storehouse NEQ_Limit ceiling, and the design's
  field-constraint table. Design needed no change.

## Spec files (in this workspace)
- requirements.md  (complete)
- design.md        (complete)
- tasks.md         (not yet created — next step)

# AIMS Spec Progress Diary

Last updated: 2026-09-09

## Where I am
Working on the **aims-web** feature spec using the **requirements-first** workflow
(Requirements -> Design -> Tasks).

Progress:
- [x] Requirements document complete and format-validated
- [x] Technical design document complete and format-validated
- [x] Task list (tasks.md) generated from approved requirements and design
- [x] Task 1 done: project scaffold, tooling, domain types, Repository
      interface, in-memory fake, smoke tests passing
- [x] Git + CI/CD set up (see below)
- [ ] **NEXT: Task 2 — core field validation (identifier/quantity/NEQ) with
      property tests P2, P3, P4**

## Git & CI/CD (set up 2026-09-09)
- GitHub: private repo `carbonless/aims`, trunk-based on `main` (modeled on
  the VEA Digital Asset Platform).
- CI/CD: AWS CDK Pipelines self-mutating CodePipeline in `infra/cdk/`, sourced
  from `carbonless/aims@main`. Stages: Dev -> Prod (no staging, per demo).
  Prod is currently auto-promoted (add a ManualApprovalStep to gate it).
- AWS target: `veasystems` profile = account 817583489060, region us-east-1.
- NOT YET DEPLOYED. Before `cdk deploy`:
  1. Create a GitHub CodeConnections connection in the console (OAuth), then
     `cdk deploy AimsBootstrapStack --parameters GitHubConnectionArn=<arn>`.
  2. `cdk bootstrap aws://817583489060/us-east-1` if not already bootstrapped.
  3. `cdk deploy AimsPipelineStack`.
- Application stacks (Storage/Database/Auth/Api) are stubs with real
  constructs + the outputs the pipeline's frontend step consumes; routes,
  Lambdas, and IAM append-only audit policy come in Tasks 11-13.

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

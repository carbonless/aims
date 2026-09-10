# AIMS — Ammunition Information Management System

A greenfield, multi-site web application for accountable, safety-focused
management of ammunition stockpiles, aligned with IATG-03.10 (Inventory
Management) and IATG-01.40.

## Status

Under active development. The feature spec (requirements, design, tasks) lives
in [`.kiro/specs/aims-web/`](.kiro/specs/aims-web/). Implementation follows the
task plan in `tasks.md`, building the pure domain layer with property-based
tests first, then wiring it to AWS.

## Architecture

Fully serverless AWS stack:

- **Frontend:** React + Vite SPA on S3 + CloudFront
- **API:** API Gateway (HTTP API) with a Cognito JWT authorizer
- **Compute:** TypeScript Lambdas over a pure, testable domain layer
- **Data:** DynamoDB single-table design + GSIs; `TransactWriteItems` for atomic transfers
- **Auth:** Amazon Cognito

## Layout

| Path | Purpose |
|------|---------|
| `domain/` | Pure TypeScript domain layer (no AWS SDK): types, `Repository` interface, in-memory fake |
| `adapters/` | DynamoDB / Cognito / S3 adapters (implement domain interfaces) |
| `handlers/` | Thin Lambda entrypoints |
| `infra/cdk/` | AWS CDK app: self-mutating CodePipeline (Dev → Prod) + application stacks |
| `web/` | React + Vite SPA |
| `test/` | Unit and property-based (`fast-check`) tests |
| `docs/` | Source reference material (IATG guidelines, data models) |

## Development

```bash
npm install        # install root dev deps (TypeScript, Vitest, fast-check)
npm run typecheck  # strict type check
npm test           # run unit + property tests
```

## Deployment

CI/CD is a self-mutating AWS CDK Pipeline (`infra/cdk/`), sourced from
`carbonless/aims` @ `main`, deploying to the `veasystems` account
(`us-east-1`). Stages: **Dev → Prod** (demo; no staging).

See `infra/cdk/lib/bootstrap-stack.ts` for the one-time GitHub connection setup.

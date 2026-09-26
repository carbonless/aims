/**
 * NEQ aggregation and Explosive_Storehouse safety domain logic (Task 5).
 *
 * Aggregation is computed on demand from item data (no maintained counters),
 * matching the Aurora/Postgres design where these are SQL aggregate queries.
 * The domain service computes them from Repository.listItems so the logic is
 * store-agnostic and property-testable against the in-memory fake.
 *
 *   - aggregate NEQ per storehouse = Σ(neq × quantity), 0.00 when empty (Req 3.5, 3.6)
 *   - per-HCC breakdown = same sum grouped by HCC (Req 3.7)
 *   - storehouse create/validation (name 1–100, NEQ_Limit 0–999,999,999.99, no dup) (Req 4.1–4.3)
 *   - remaining capacity = NEQ_Limit − aggregate NEQ (Req 4.5)
 *   - mixed-hazard: ≥2 distinct HCCs present, listing each (Req 4.6)
 */

import type { Repository } from "./repository.js";
import {
  type ExplosiveStorehouse,
  type FieldError,
  type Result,
  err,
  ok,
} from "./types.js";
import { roundNeq } from "./validation.js";
import { validationError } from "./validation.js";

export const STOREHOUSE_NAME_MAX = 100;
export const NEQ_LIMIT_MIN = 0;
export const NEQ_LIMIT_MAX = 999_999_999.99;

export type IdGen = () => string;
const defaultIdGen: IdGen = () => crypto.randomUUID();

export interface StorehouseInput {
  name?: string | undefined;
  neqLimit?: number | undefined;
  street?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
}

export interface NeqBreakdownEntry {
  hccCode: string;
  neq: number;
}

export interface StorehouseView {
  storehouse: ExplosiveStorehouse;
  aggregateNeq: number;
  neqLimit: number;
  remainingCapacity: number;
  mixedHazard: boolean;
  distinctHccs: string[];
}

export class StorehouseService {
  constructor(
    private readonly repo: Repository,
    private readonly idGen: IdGen = defaultIdGen,
  ) {}

  // --- Aggregate NEQ for a storehouse (Req 3.5, 3.6) ---
  async aggregateNeq(storehouseId: string): Promise<number> {
    const items = await this.repo.listItems({ storehouseId });
    const total = items.reduce((sum, i) => sum + i.neq * i.quantity, 0);
    return roundNeq(total);
  }

  // --- Per-HCC NEQ breakdown (Req 3.7) ---
  async neqBreakdown(storehouseId: string): Promise<NeqBreakdownEntry[]> {
    const items = await this.repo.listItems({ storehouseId });
    const byHcc = new Map<string, number>();
    for (const i of items) {
      byHcc.set(i.hccCode, (byHcc.get(i.hccCode) ?? 0) + i.neq * i.quantity);
    }
    return [...byHcc.entries()]
      .map(([hccCode, neq]) => ({ hccCode, neq: roundNeq(neq) }))
      .sort((a, b) => a.hccCode.localeCompare(b.hccCode));
  }

  // --- Distinct HCCs present in a storehouse (Req 4.6) ---
  async distinctHccs(storehouseId: string): Promise<string[]> {
    const items = await this.repo.listItems({ storehouseId });
    return [...new Set(items.map((i) => i.hccCode))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  // --- Create/validate a storehouse (Req 4.1–4.3) ---
  async create(input: StorehouseInput): Promise<Result<ExplosiveStorehouse>> {
    const fields: FieldError[] = [
      ...this.validateName(input.name),
      ...this.validateNeqLimit(input.neqLimit),
    ];
    if (fields.length > 0) return err(validationError(fields));

    // Case-insensitive duplicate name check (Req 4.3).
    const existing = await this.repo.listStorehouses();
    const key = input.name!.trim().toLowerCase();
    if (existing.some((s) => s.name.trim().toLowerCase() === key)) {
      return err({
        code: "CONFLICT",
        message: `An Explosive_Storehouse named '${input.name}' already exists`,
      });
    }

    const record: ExplosiveStorehouse = {
      id: this.idGen(),
      name: input.name!,
      neqLimit: input.neqLimit!,
      ...(input.street !== undefined ? { street: input.street } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
    };
    await this.repo.putStorehouse(record);
    return ok(record);
  }

  // --- Composite view: capacity + mixed-hazard (Req 4.5, 4.6) ---
  async view(storehouseId: string): Promise<Result<StorehouseView>> {
    const storehouse = await this.repo.getStorehouse(storehouseId);
    if (!storehouse) {
      return err({
        code: "NOT_FOUND",
        message: `Explosive_Storehouse '${storehouseId}' was not found`,
      });
    }
    const aggregateNeq = await this.aggregateNeq(storehouseId);
    const distinctHccs = await this.distinctHccs(storehouseId);
    return ok({
      storehouse,
      aggregateNeq,
      neqLimit: storehouse.neqLimit,
      remainingCapacity: roundNeq(storehouse.neqLimit - aggregateNeq),
      mixedHazard: distinctHccs.length >= 2,
      distinctHccs,
    });
  }

  // --- Validators ---
  private validateName(name: string | undefined): FieldError[] {
    if (name === undefined || name.trim().length === 0) {
      return [{ field: "name", reason: "name is required" }];
    }
    if (name.length > STOREHOUSE_NAME_MAX) {
      return [
        { field: "name", reason: `name must be at most ${STOREHOUSE_NAME_MAX} characters` },
      ];
    }
    return [];
  }

  private validateNeqLimit(neqLimit: number | undefined): FieldError[] {
    if (typeof neqLimit !== "number" || Number.isNaN(neqLimit)) {
      return [{ field: "neqLimit", reason: "NEQ_Limit must be a number" }];
    }
    if (neqLimit < NEQ_LIMIT_MIN || neqLimit > NEQ_LIMIT_MAX) {
      return [
        {
          field: "neqLimit",
          reason: `NEQ_Limit must be between ${NEQ_LIMIT_MIN.toFixed(2)} and ${NEQ_LIMIT_MAX.toFixed(2)} kilograms`,
        },
      ];
    }
    return [];
  }
}

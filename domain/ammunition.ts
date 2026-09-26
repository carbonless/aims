/**
 * Ammunition_Item domain service (Task 4): create, update, list, delete.
 *
 * Pure domain logic over the store-agnostic Repository. Composes the field
 * validators (Task 2) with referential gates (HCC and Condition_Code must exist)
 * and enforces the inventory rules:
 *   - create requires valid fields + existing HCC/Condition_Code (Req 1.1, 3.1, 3.2, 5.1, 5.2)
 *   - update persists valid values; non-existent item -> NOT_FOUND (Req 1.6, 1.7)
 *   - list returns the full field set; filters are sound and complete (Req 1.8, 1.9, 5.4)
 *   - delete only when Quantity == 0 (Req 1.10, 1.11)
 *
 * Audit records for create/update/delete are written in the same unit of work
 * as the state change (Req 1.4, 1.6, 1.10, 7.8/7.9 append-only).
 */

import type { ItemFilters, Repository } from "./repository.js";
import {
  type AmmunitionItem,
  type AuditRecord,
  type FieldError,
  type Result,
  err,
  ok,
} from "./types.js";
import {
  validateIdentifier,
  validateNeq,
  validateQuantity,
  validateRequiredItemFields,
  validationError,
} from "./validation.js";

export type IdGen = () => string;
export type Clock = () => Date;
const defaultIdGen: IdGen = () => crypto.randomUUID();
const defaultClock: Clock = () => new Date();

/** Fields a caller may supply to create an item. */
export interface CreateItemInput {
  manufacturerId?: string | undefined;
  natureId?: string | undefined;
  identifier?: string | undefined;
  quantity?: number | undefined;
  neq?: number | undefined;
  hccCode?: string | undefined;
  conditionCode?: string | undefined;
  storehouseId?: string | undefined;
}

/** Fields that may be changed on update (id is fixed; ban is managed elsewhere). */
export interface UpdateItemInput {
  manufacturerId?: string | undefined;
  natureId?: string | undefined;
  identifier?: string | undefined;
  quantity?: number | undefined;
  neq?: number | undefined;
  hccCode?: string | undefined;
  conditionCode?: string | undefined;
  storehouseId?: string | undefined;
}

export class AmmunitionService {
  constructor(
    private readonly repo: Repository,
    private readonly userId: string,
    private readonly idGen: IdGen = defaultIdGen,
    private readonly clock: Clock = defaultClock,
  ) {}

  // --- Create (Req 1.1–1.5, 3.1–3.4, 5.1, 5.2) ---
  async create(input: CreateItemInput): Promise<Result<AmmunitionItem>> {
    // Required-field presence first (Req 1.2).
    const missing = validateRequiredItemFields({
      manufacturerId: input.manufacturerId,
      natureId: input.natureId,
      identifier: input.identifier,
      quantity: input.quantity,
      storehouseId: input.storehouseId,
    });

    const fields: FieldError[] = [...missing];
    // Field-format validation for values that are present.
    if (input.identifier !== undefined)
      fields.push(...validateIdentifier(input.identifier));
    if (input.quantity !== undefined)
      fields.push(...validateQuantity(input.quantity));
    // NEQ is required at the hazard layer (Req 3.3); validate always.
    fields.push(...validateNeq(input.neq));

    if (fields.length > 0) return err(validationError(dedupe(fields)));

    // Referential gates (Req 3.1/3.2 HCC, 5.1/5.2 Condition_Code).
    const refError = await this.checkReferential(input.hccCode, input.conditionCode);
    if (refError) return err(refError);

    const item: AmmunitionItem = {
      id: this.idGen(),
      manufacturerId: input.manufacturerId!,
      natureId: input.natureId!,
      identifier: input.identifier!,
      quantity: input.quantity!,
      neq: input.neq!,
      hccCode: input.hccCode!,
      conditionCode: input.conditionCode!,
      storehouseId: input.storehouseId!,
      banStatus: "not_banned",
    };

    await this.repo.transact([
      { putItem: item },
      { appendAudit: this.audit("item_created", { itemId: item.id, storehouseId: item.storehouseId }) },
    ]);
    return ok(item);
  }

  // --- Update (Req 1.6, 1.7, 3.1–3.4, 5.1, 5.2) ---
  async update(id: string, input: UpdateItemInput): Promise<Result<AmmunitionItem>> {
    const existing = await this.repo.getItem(id);
    if (!existing) {
      return err({ code: "NOT_FOUND", message: `Ammunition_Item '${id}' was not found` });
    }

    const merged: AmmunitionItem = {
      ...existing,
      manufacturerId: input.manufacturerId ?? existing.manufacturerId,
      natureId: input.natureId ?? existing.natureId,
      identifier: input.identifier ?? existing.identifier,
      quantity: input.quantity ?? existing.quantity,
      neq: input.neq ?? existing.neq,
      hccCode: input.hccCode ?? existing.hccCode,
      conditionCode: input.conditionCode ?? existing.conditionCode,
      storehouseId: input.storehouseId ?? existing.storehouseId,
    };

    const fields: FieldError[] = [
      ...validateIdentifier(merged.identifier),
      ...validateQuantity(merged.quantity),
      ...validateNeq(merged.neq),
    ];
    if (fields.length > 0) return err(validationError(dedupe(fields)));

    const refError = await this.checkReferential(merged.hccCode, merged.conditionCode);
    if (refError) return err(refError);

    await this.repo.transact([
      { putItem: merged },
      { appendAudit: this.audit("item_updated", { itemId: merged.id, storehouseId: merged.storehouseId }) },
    ]);
    return ok(merged);
  }

  // --- List with filters (Req 1.8, 1.9, 5.4) ---
  async list(filters: ItemFilters = {}): Promise<AmmunitionItem[]> {
    // The Repository applies all provided filters (sound & complete); the full
    // field set is inherent to AmmunitionItem (Req 1.8).
    return this.repo.listItems(filters);
  }

  // --- Delete gated on zero quantity (Req 1.10, 1.11) ---
  async delete(id: string): Promise<Result<void>> {
    const existing = await this.repo.getItem(id);
    if (!existing) {
      return err({ code: "NOT_FOUND", message: `Ammunition_Item '${id}' was not found` });
    }
    if (existing.quantity > 0) {
      return err({
        code: "CONFLICT",
        message:
          "Stock must be disposed or transferred before deletion (Quantity must be zero)",
      });
    }
    await this.repo.transact([
      { appendAudit: this.audit("item_deleted", { itemId: id, storehouseId: existing.storehouseId }) },
    ]);
    await this.repo.deleteItem(id);
    return ok(undefined);
  }

  // --- Helpers ---
  private async checkReferential(
    hccCode: string | undefined,
    conditionCode: string | undefined,
  ): Promise<ReturnType<typeof buildRefError> | undefined> {
    if (hccCode === undefined || (await this.repo.getHcc(hccCode)) === undefined) {
      return buildRefError("hccCode", "HCC");
    }
    if (
      conditionCode === undefined ||
      (await this.repo.getConditionCode(conditionCode)) === undefined
    ) {
      return buildRefError("conditionCode", "Condition_Code");
    }
    return undefined;
  }

  private audit(
    action: AuditRecord["action"],
    ref: { itemId?: string; storehouseId?: string },
  ): AuditRecord {
    return {
      id: this.idGen(),
      action,
      userId: this.userId,
      timestamp: this.clock().toISOString(),
      ...(ref.itemId !== undefined ? { itemId: ref.itemId } : {}),
      ...(ref.storehouseId !== undefined ? { storehouseId: ref.storehouseId } : {}),
    };
  }
}

function buildRefError(field: string, label: string) {
  return validationError([{ field, reason: `${label} value is invalid or does not exist` }]);
}

/** Remove duplicate field errors (same field+reason) for a clean response. */
function dedupe(fields: FieldError[]): FieldError[] {
  const seen = new Set<string>();
  const out: FieldError[] = [];
  for (const f of fields) {
    const k = `${f.field}::${f.reason}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(f);
    }
  }
  return out;
}

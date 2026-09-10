/**
 * In-memory Repository implementation for unit and property-based tests.
 *
 * Mirrors the atomicity contract of the DynamoDB adapter: `transact` applies
 * all operations against a copied snapshot and only commits if every guarded
 * condition passes, otherwise it throws and leaves state untouched. This lets
 * the transfer-rollback property (P35) be exercised without AWS.
 */

import type {
  AmmunitionItem,
  AuditRecord,
  ConditionCode,
  ExplosiveStorehouse,
  Hcc,
  Manufacturer,
  Nature,
  StockMovement,
} from "./types.js";
import {
  type ItemFilters,
  type ReferenceType,
  type Repository,
  type StorehouseAggregates,
  type TransactionOp,
  TransactionConditionError,
} from "./repository.js";

interface HccCounter {
  hccCode: string;
  neqForHcc: number;
  itemCount: number;
}

interface State {
  items: Map<string, AmmunitionItem>;
  manufacturers: Map<string, Manufacturer>;
  natures: Map<string, Nature>;
  hccs: Map<string, Hcc>;
  conditionCodes: Map<string, ConditionCode>;
  storehouses: Map<string, ExplosiveStorehouse>;
  aggregateNeq: Map<string, number>; // storehouseId -> aggregate NEQ
  hccNeq: Map<string, Map<string, HccCounter>>; // storehouseId -> hccCode -> counter
  audit: AuditRecord[];
  movements: StockMovement[];
}

function emptyState(): State {
  return {
    items: new Map(),
    manufacturers: new Map(),
    natures: new Map(),
    hccs: new Map(),
    conditionCodes: new Map(),
    storehouses: new Map(),
    aggregateNeq: new Map(),
    hccNeq: new Map(),
    audit: [],
    movements: [],
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export class InMemoryRepository implements Repository {
  private s: State = emptyState();

  // --- Ammunition items ---
  async getItem(id: string): Promise<AmmunitionItem | undefined> {
    return clone(this.s.items.get(id));
  }
  async putItem(item: AmmunitionItem): Promise<void> {
    this.s.items.set(item.id, clone(item)!);
  }
  async deleteItem(id: string): Promise<void> {
    this.s.items.delete(id);
  }
  async listItems(filters: ItemFilters): Promise<AmmunitionItem[]> {
    return [...this.s.items.values()]
      .filter((i) => matches(i, filters))
      .map((i) => clone(i)!);
  }

  // --- Reference data ---
  async getManufacturer(id: string) {
    return clone(this.s.manufacturers.get(id));
  }
  async putManufacturer(m: Manufacturer) {
    this.s.manufacturers.set(m.id, clone(m)!);
  }
  async deleteManufacturer(id: string) {
    this.s.manufacturers.delete(id);
  }
  async listManufacturers() {
    return [...this.s.manufacturers.values()].map((m) => clone(m)!);
  }

  async getNature(id: string) {
    return clone(this.s.natures.get(id));
  }
  async putNature(n: Nature) {
    this.s.natures.set(n.id, clone(n)!);
  }
  async deleteNature(id: string) {
    this.s.natures.delete(id);
  }
  async listNatures() {
    return [...this.s.natures.values()].map((n) => clone(n)!);
  }

  async getHcc(code: string) {
    return clone(this.s.hccs.get(code));
  }
  async putHcc(h: Hcc) {
    this.s.hccs.set(h.code, clone(h)!);
  }
  async deleteHcc(code: string) {
    this.s.hccs.delete(code);
  }
  async listHccs() {
    return [...this.s.hccs.values()].map((h) => clone(h)!);
  }

  async getConditionCode(code: string) {
    return clone(this.s.conditionCodes.get(code));
  }
  async putConditionCode(c: ConditionCode) {
    this.s.conditionCodes.set(c.code, clone(c)!);
  }
  async deleteConditionCode(code: string) {
    this.s.conditionCodes.delete(code);
  }
  async listConditionCodes() {
    return [...this.s.conditionCodes.values()].map((c) => clone(c)!);
  }

  async countItemsReferencing(
    type: ReferenceType,
    key: string,
  ): Promise<number> {
    let count = 0;
    for (const i of this.s.items.values()) {
      if (type === "manufacturer" && i.manufacturerId === key) count++;
      else if (type === "nature" && i.natureId === key) count++;
      else if (type === "hcc" && i.hccCode === key) count++;
      else if (type === "conditionCode" && i.conditionCode === key) count++;
    }
    return count;
  }

  // --- Storehouses & aggregates ---
  async getStorehouse(id: string) {
    return clone(this.s.storehouses.get(id));
  }
  async putStorehouse(st: ExplosiveStorehouse) {
    this.s.storehouses.set(st.id, clone(st)!);
  }
  async listStorehouses() {
    return [...this.s.storehouses.values()].map((st) => clone(st)!);
  }
  async getStorehouseAggregates(id: string): Promise<StorehouseAggregates> {
    const perHccMap = this.s.hccNeq.get(id);
    return {
      aggregateNeq: round2(this.s.aggregateNeq.get(id) ?? 0),
      perHcc: perHccMap
        ? [...perHccMap.values()].map((c) => ({ ...c, neqForHcc: round2(c.neqForHcc) }))
        : [],
    };
  }

  // --- Audit & movements ---
  async queryAudit(query: {
    itemId?: string;
    storehouseId?: string;
  }): Promise<AuditRecord[]> {
    return this.s.audit
      .filter(
        (a) =>
          (query.itemId === undefined || a.itemId === query.itemId) &&
          (query.storehouseId === undefined ||
            a.storehouseId === query.storehouseId),
      )
      .slice()
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)) // newest-first
      .map((a) => clone(a)!);
  }

  async queryMovements(range: {
    start: string;
    end: string;
  }): Promise<StockMovement[]> {
    return this.s.movements
      .filter((m) => m.timestamp >= range.start && m.timestamp <= range.end)
      .map((m) => clone(m)!);
  }

  // --- Atomic transaction ---
  async transact(ops: TransactionOp[]): Promise<void> {
    // Work on a snapshot; commit only if every op applies cleanly.
    const snapshot = snapshotState(this.s);
    try {
      for (const op of ops) this.applyOp(op);
    } catch (e) {
      this.s = snapshot; // rollback — all-or-nothing
      throw e;
    }
  }

  private applyOp(op: TransactionOp): void {
    if (op.putItem) {
      this.s.items.set(op.putItem.id, clone(op.putItem)!);
    }
    if (op.adjustItemQuantity) {
      const { itemId, delta, requireQuantityGte } = op.adjustItemQuantity;
      const item = this.s.items.get(itemId);
      if (!item) throw new TransactionConditionError(`item ${itemId} not found`);
      if (
        requireQuantityGte !== undefined &&
        item.quantity < requireQuantityGte
      ) {
        throw new TransactionConditionError(
          `item ${itemId} quantity ${item.quantity} < required ${requireQuantityGte}`,
        );
      }
      item.quantity += delta;
    }
    if (op.adjustAggregateNeq) {
      const { storehouseId, delta } = op.adjustAggregateNeq;
      this.s.aggregateNeq.set(
        storehouseId,
        (this.s.aggregateNeq.get(storehouseId) ?? 0) + delta,
      );
    }
    if (op.adjustHccNeq) {
      const { storehouseId, hccCode, neqDelta, itemCountDelta } = op.adjustHccNeq;
      let map = this.s.hccNeq.get(storehouseId);
      if (!map) {
        map = new Map();
        this.s.hccNeq.set(storehouseId, map);
      }
      const c = map.get(hccCode) ?? { hccCode, neqForHcc: 0, itemCount: 0 };
      c.neqForHcc += neqDelta;
      c.itemCount += itemCountDelta;
      map.set(hccCode, c);
    }
    if (op.appendAudit) {
      if (this.s.audit.some((a) => a.id === op.appendAudit!.id)) {
        throw new TransactionConditionError(
          `audit ${op.appendAudit.id} already exists`,
        );
      }
      this.s.audit.push(clone(op.appendAudit)!);
    }
    if (op.appendMovement) {
      this.s.movements.push(clone(op.appendMovement)!);
    }
  }

  // --- Test helpers (not part of the Repository interface) ---
  /** Direct audit append for non-transactional actions (e.g. auth events). */
  async appendAudit(record: AuditRecord): Promise<void> {
    this.s.audit.push(clone(record)!);
  }
  /** Snapshot count of stored audit records (used by append-only property). */
  auditCount(): number {
    return this.s.audit.length;
  }
}

function matches(i: AmmunitionItem, f: ItemFilters): boolean {
  if (f.manufacturerId !== undefined && i.manufacturerId !== f.manufacturerId)
    return false;
  if (f.natureId !== undefined && i.natureId !== f.natureId) return false;
  if (f.storehouseId !== undefined && i.storehouseId !== f.storehouseId)
    return false;
  if (f.conditionCode !== undefined && i.conditionCode !== f.conditionCode)
    return false;
  if (f.identifier !== undefined && i.identifier !== f.identifier) return false;
  return true;
}

function clone<T>(v: T | undefined): T | undefined {
  return v === undefined ? undefined : structuredClone(v);
}

function snapshotState(s: State): State {
  return {
    items: new Map([...s.items].map(([k, v]) => [k, structuredClone(v)])),
    manufacturers: new Map(
      [...s.manufacturers].map(([k, v]) => [k, structuredClone(v)]),
    ),
    natures: new Map([...s.natures].map(([k, v]) => [k, structuredClone(v)])),
    hccs: new Map([...s.hccs].map(([k, v]) => [k, structuredClone(v)])),
    conditionCodes: new Map(
      [...s.conditionCodes].map(([k, v]) => [k, structuredClone(v)]),
    ),
    storehouses: new Map(
      [...s.storehouses].map(([k, v]) => [k, structuredClone(v)]),
    ),
    aggregateNeq: new Map(s.aggregateNeq),
    hccNeq: new Map(
      [...s.hccNeq].map(([k, v]) => [
        k,
        new Map([...v].map(([kk, vv]) => [kk, { ...vv }])),
      ]),
    ),
    audit: s.audit.map((a) => structuredClone(a)),
    movements: s.movements.map((m) => structuredClone(m)),
  };
}

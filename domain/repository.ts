/**
 * Repository interface — the sole persistence abstraction the domain layer
 * depends on. Domain services are written against this interface (never the
 * AWS SDK), so they can be exercised against an in-memory fake in unit and
 * property-based tests. The DynamoDB adapter (Task 11) implements it for real.
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

export type ReferenceType = "manufacturer" | "nature" | "hcc" | "conditionCode";

/** Filters for listing ammunition items (Req 1.9, 5.4). */
export interface ItemFilters {
  manufacturerId?: string;
  natureId?: string;
  storehouseId?: string;
  conditionCode?: string;
  identifier?: string;
}

/**
 * A single unit of work that must be committed atomically (all-or-nothing).
 * The DynamoDB adapter maps this to a `TransactWriteItems` call; the in-memory
 * fake applies it under a try/rollback. Used for movements/transfers so item
 * quantity changes, NEQ aggregate counters, and the audit append all commit
 * together (Req 7.5–7.9).
 */
export interface TransactionOp {
  /** Put/replace an item. */
  putItem?: AmmunitionItem;
  /** Adjust an item's quantity by a delta, guarded by `requireQuantityGte`. */
  adjustItemQuantity?: {
    itemId: string;
    delta: number;
    /** Condition: current quantity must be >= this before applying. */
    requireQuantityGte?: number;
  };
  /** Apply a delta to a storehouse's aggregate-NEQ counter. */
  adjustAggregateNeq?: { storehouseId: string; delta: number };
  /** Apply a delta to a storehouse's per-HCC NEQ counter and item count. */
  adjustHccNeq?: {
    storehouseId: string;
    hccCode: string;
    neqDelta: number;
    itemCountDelta: number;
  };
  /** Append an audit record (write-once; fails if the id already exists). */
  appendAudit?: AuditRecord;
  /** Append a stock-movement record. */
  appendMovement?: StockMovement;
}

/** Per-storehouse maintained NEQ counters (Req 3.5–3.7, 4.5, 4.6). */
export interface StorehouseAggregates {
  aggregateNeq: number;
  perHcc: { hccCode: string; neqForHcc: number; itemCount: number }[];
}

export interface Repository {
  // --- Ammunition items ---
  getItem(id: string): Promise<AmmunitionItem | undefined>;
  putItem(item: AmmunitionItem): Promise<void>;
  deleteItem(id: string): Promise<void>;
  listItems(filters: ItemFilters): Promise<AmmunitionItem[]>;

  // --- Reference data ---
  getManufacturer(id: string): Promise<Manufacturer | undefined>;
  putManufacturer(m: Manufacturer): Promise<void>;
  deleteManufacturer(id: string): Promise<void>;
  listManufacturers(): Promise<Manufacturer[]>;

  getNature(id: string): Promise<Nature | undefined>;
  putNature(n: Nature): Promise<void>;
  deleteNature(id: string): Promise<void>;
  listNatures(): Promise<Nature[]>;

  getHcc(code: string): Promise<Hcc | undefined>;
  putHcc(h: Hcc): Promise<void>;
  deleteHcc(code: string): Promise<void>;
  listHccs(): Promise<Hcc[]>;

  getConditionCode(code: string): Promise<ConditionCode | undefined>;
  putConditionCode(c: ConditionCode): Promise<void>;
  deleteConditionCode(code: string): Promise<void>;
  listConditionCodes(): Promise<ConditionCode[]>;

  /**
   * Count ammunition items referencing a given reference-data record, used to
   * block deletion of in-use reference data (Req 2.6).
   */
  countItemsReferencing(type: ReferenceType, key: string): Promise<number>;

  // --- Storehouses & aggregates ---
  getStorehouse(id: string): Promise<ExplosiveStorehouse | undefined>;
  putStorehouse(s: ExplosiveStorehouse): Promise<void>;
  listStorehouses(): Promise<ExplosiveStorehouse[]>;
  getStorehouseAggregates(id: string): Promise<StorehouseAggregates>;

  // --- Audit & movements ---
  /** Newest-first audit records for an item or a storehouse (Req 7.10, 7.11). */
  queryAudit(query: {
    itemId?: string;
    storehouseId?: string;
  }): Promise<AuditRecord[]>;
  /** Movement records within an inclusive timestamp range (Req 8.3). */
  queryMovements(range: { start: string; end: string }): Promise<StockMovement[]>;

  /**
   * Commit a set of operations atomically. Implementations MUST apply all ops
   * or none. Rejects (without partial application) if any guard fails.
   */
  transact(ops: TransactionOp[]): Promise<void>;
}

/** Thrown by `transact` when a guard (e.g. insufficient quantity) fails. */
export class TransactionConditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionConditionError";
  }
}

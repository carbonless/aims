/**
 * Shared domain types for AIMS.
 *
 * These are pure data shapes with no AWS/runtime dependencies so they can be
 * used by the domain layer, adapters, handlers, and tests alike.
 */

// ---------------------------------------------------------------------------
// Roles & authorization
// ---------------------------------------------------------------------------

export type Role =
  | "Inventory_Manager"
  | "Safety_Officer"
  | "Auditor"
  | "Administrator";

export const ROLES: readonly Role[] = [
  "Inventory_Manager",
  "Safety_Officer",
  "Auditor",
  "Administrator",
] as const;

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  addr1?: string;
  addr2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface Nature {
  id: string;
  name: string;
}

export interface Hcc {
  /** Hazard Classification Code, e.g. "1.1", "1.4". Acts as the identity. */
  code: string;
  description: string;
}

export interface ConditionCode {
  /** Serviceability code (A–G). Acts as the identity. */
  code: string;
  description: string;
  /** Whether items with this condition may be issued (Req 5.5). */
  serviceable: boolean;
}

// ---------------------------------------------------------------------------
// Storehouse
// ---------------------------------------------------------------------------

export interface ExplosiveStorehouse {
  id: string;
  name: string;
  /** Max permitted aggregate NEQ (kg), 0..999,999,999.99. */
  neqLimit: number;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// Ammunition item
// ---------------------------------------------------------------------------

export type BanStatus = "banned" | "not_banned";

export interface AmmunitionItem {
  id: string;
  manufacturerId: string;
  natureId: string;
  /** Lot/batch number, 1–64 chars. */
  identifier: string;
  /** Integer 0..999,999,999. */
  quantity: number;
  /** NEQ per item in kg, 0.00..999,999,999.99, 2 decimal places. */
  neq: number;
  hccCode: string;
  conditionCode: string;
  storehouseId: string;
  banStatus: BanStatus;
  banText?: string;
}

// ---------------------------------------------------------------------------
// Stock movement & audit
// ---------------------------------------------------------------------------

export type MovementType = "receipt" | "issue" | "transfer" | "disposal";

export interface StockMovement {
  id: string;
  type: MovementType;
  itemId: string;
  quantity: number;
  /** Source storehouse (issue/disposal/transfer) or receiving storehouse (receipt). */
  fromEsh?: string;
  /** Destination storehouse for transfers. */
  toEsh?: string;
  userId: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
}

export type AuditAction =
  | "item_created"
  | "item_updated"
  | "item_deleted"
  | "condition_changed"
  | "ban_applied"
  | "ban_removed"
  | "movement_recorded"
  | "auth_success"
  | "auth_failure"
  | "authz_denied";

export interface AuditRecord {
  id: string;
  action: AuditAction;
  /** Acting user; absent only for anonymous auth failures. */
  userId?: string;
  itemId?: string;
  storehouseId?: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Free-form details, e.g. before/after condition, attempted action on denial. */
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Structured errors
// ---------------------------------------------------------------------------

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "AUTHZ_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "NEQ_LIMIT_WARNING"
  | "ACCOUNT_LOCKED"
  | "INTERNAL_ERROR";

export interface FieldError {
  field: string;
  reason: string;
}

export interface DomainError {
  code: ErrorCode;
  message: string;
  fields?: FieldError[];
}

/** Wire shape returned by the API: `{ error: { code, message, fields[] } }`. */
export interface ErrorResponse {
  error: DomainError;
}

/**
 * Result type for domain operations: either a value or a DomainError, without
 * throwing. Handlers translate DomainError.code to HTTP status codes.
 */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(error: DomainError): Result<T> {
  return { ok: false, error };
}

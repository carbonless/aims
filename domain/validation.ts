/**
 * Core field validation for the AIMS domain layer (Task 2).
 *
 * Pure functions with no AWS/runtime dependencies. Each validator returns a
 * list of FieldError (empty when valid) so callers can compose them and build a
 * single structured VALIDATION_ERROR that names every offending field.
 *
 * Bounds are taken directly from the requirements:
 *   - Identifier length 1–64                       (Req 1.1)
 *   - Quantity integer 0–999,999,999               (Req 1.1, 1.3, 1.4)
 *   - NEQ 0.00–999,999.99 kg, 2 decimal places     (Req 1.5, 3.3, 3.4)
 */

import { type DomainError, type FieldError, type Result, err, ok } from "./types.js";

// --- Bounds (single source of truth) --------------------------------------

export const IDENTIFIER_MIN_LEN = 1;
export const IDENTIFIER_MAX_LEN = 64;

export const QUANTITY_MIN = 0;
export const QUANTITY_MAX = 999_999_999;

export const NEQ_MIN = 0;
export const NEQ_MAX = 999_999.99;
export const NEQ_DECIMALS = 2;

/** Fields required to create an ammunition item (Req 1.2). */
export const REQUIRED_ITEM_FIELDS = [
  "manufacturerId",
  "natureId",
  "identifier",
  "quantity",
  "storehouseId",
] as const;
export type RequiredItemField = (typeof REQUIRED_ITEM_FIELDS)[number];

// --- Helpers ---------------------------------------------------------------

/** Round to NEQ_DECIMALS places, avoiding binary float drift on .5 cases. */
export function roundNeq(n: number): number {
  const f = 10 ** NEQ_DECIMALS;
  return Math.round((n + Number.EPSILON) * f) / f;
}

function hasMoreThanTwoDecimals(n: number): boolean {
  return roundNeq(n) !== n;
}

function isPresent(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

// --- Field validators ------------------------------------------------------

/** Validate a lot/batch Identifier (Req 1.1). */
export function validateIdentifier(identifier: unknown): FieldError[] {
  if (typeof identifier !== "string" || identifier.length === 0) {
    return [{ field: "identifier", reason: "identifier is required" }];
  }
  if (
    identifier.length < IDENTIFIER_MIN_LEN ||
    identifier.length > IDENTIFIER_MAX_LEN
  ) {
    return [
      {
        field: "identifier",
        reason: `identifier must be ${IDENTIFIER_MIN_LEN} to ${IDENTIFIER_MAX_LEN} characters`,
      },
    ];
  }
  return [];
}

/**
 * Validate a Quantity: must be an integer within [QUANTITY_MIN, QUANTITY_MAX]
 * (Req 1.3, 1.4). Non-numeric / non-integer values are rejected with a message
 * distinguishing "whole number" (Req 1.4) from "range" (Req 1.3).
 */
export function validateQuantity(quantity: unknown): FieldError[] {
  if (typeof quantity !== "number" || Number.isNaN(quantity)) {
    return [{ field: "quantity", reason: "quantity must be a whole number" }];
  }
  if (!Number.isInteger(quantity)) {
    return [{ field: "quantity", reason: "quantity must be a whole number" }];
  }
  if (quantity < QUANTITY_MIN || quantity > QUANTITY_MAX) {
    return [
      {
        field: "quantity",
        reason: `quantity must be between ${QUANTITY_MIN} and ${QUANTITY_MAX}`,
      },
    ];
  }
  return [];
}

/**
 * Validate a per-item NEQ: numeric, within [NEQ_MIN, NEQ_MAX], at most two
 * decimal places (Req 1.5, 3.3, 3.4).
 */
export function validateNeq(neq: unknown): FieldError[] {
  if (typeof neq !== "number" || Number.isNaN(neq)) {
    return [{ field: "neq", reason: "NEQ must be a number" }];
  }
  if (neq < NEQ_MIN || neq > NEQ_MAX) {
    return [
      {
        field: "neq",
        reason: `NEQ must be between ${NEQ_MIN.toFixed(2)} and ${NEQ_MAX.toFixed(2)} kilograms`,
      },
    ];
  }
  if (hasMoreThanTwoDecimals(neq)) {
    return [
      {
        field: "neq",
        reason: `NEQ must have at most ${NEQ_DECIMALS} decimal places`,
      },
    ];
  }
  return [];
}

/**
 * Check that all required item-creation fields are present, returning one
 * FieldError per omitted field (Req 1.2).
 */
export function validateRequiredItemFields(
  input: Partial<Record<RequiredItemField, unknown>>,
): FieldError[] {
  return REQUIRED_ITEM_FIELDS.filter((f) => !isPresent(input[f])).map((f) => ({
    field: f,
    reason: `${f} is required`,
  }));
}

// --- Composition -----------------------------------------------------------

/** Build a VALIDATION_ERROR DomainError from accumulated field errors. */
export function validationError(fields: FieldError[]): DomainError {
  return {
    code: "VALIDATION_ERROR",
    message: `Validation failed for: ${fields.map((f) => f.field).join(", ")}`,
    fields,
  };
}

/**
 * Fold a list of FieldError into a Result: ok(value) when there are none,
 * otherwise a single VALIDATION_ERROR naming every offending field.
 */
export function toResult<T>(value: T, fields: FieldError[]): Result<T> {
  return fields.length === 0 ? ok(value) : err(validationError(fields));
}

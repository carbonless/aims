import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  IDENTIFIER_MAX_LEN,
  NEQ_MAX,
  QUANTITY_MAX,
  QUANTITY_MIN,
  roundNeq,
  validateIdentifier,
  validateNeq,
  validateQuantity,
  validateRequiredItemFields,
  type RequiredItemField,
} from "../../domain/validation.js";

const RUNS = 100;

describe("Task 2.1 — quantity validation", () => {
  // Feature: aims-web, Property 3: For any submitted Quantity that is
  // non-integer, less than 0, or greater than 999,999,999, the operation SHALL
  // be rejected and no item SHALL be created or changed.
  it("Property 3: rejects out-of-range integer quantities", () => {
    const outOfRange = fc.oneof(
      fc.integer({ min: -1_000_000, max: -1 }),
      fc.integer({ min: QUANTITY_MAX + 1, max: QUANTITY_MAX + 1_000_000 }),
    );
    fc.assert(
      fc.property(outOfRange, (q) => {
        const errs = validateQuantity(q);
        expect(errs.length).toBeGreaterThan(0);
        expect(errs[0]!.field).toBe("quantity");
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 3: rejects non-integer / non-numeric quantities", () => {
    const nonInteger = fc.oneof(
      fc.double({ min: 0.01, max: 1_000, noInteger: true, noNaN: true }),
      fc.constant(Number.NaN),
      fc.constant("5" as unknown as number),
    );
    fc.assert(
      fc.property(nonInteger, (q) => {
        const errs = validateQuantity(q as unknown);
        expect(errs.length).toBeGreaterThan(0);
        expect(errs[0]!.reason).toContain("whole number");
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 3: accepts valid integer quantities in range", () => {
    fc.assert(
      fc.property(fc.integer({ min: QUANTITY_MIN, max: QUANTITY_MAX }), (q) => {
        expect(validateQuantity(q)).toEqual([]);
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 3: boundary values", () => {
    expect(validateQuantity(QUANTITY_MIN)).toEqual([]);
    expect(validateQuantity(QUANTITY_MAX)).toEqual([]);
    expect(validateQuantity(QUANTITY_MIN - 1).length).toBeGreaterThan(0);
    expect(validateQuantity(QUANTITY_MAX + 1).length).toBeGreaterThan(0);
  });
});

describe("Task 2.1 — NEQ validation", () => {
  // Feature: aims-web, Property 4: For any submitted NEQ that is missing,
  // non-numeric, negative, or above its permitted maximum, the operation SHALL
  // be rejected and the item record SHALL be left unchanged; and for any valid
  // NEQ the stored value SHALL equal the submission rounded to two decimals.
  it("Property 4: rejects negative and over-max NEQ", () => {
    const bad = fc.oneof(
      fc.double({ min: -1_000, max: -0.01, noNaN: true }),
      fc.double({ min: NEQ_MAX + 0.01, max: NEQ_MAX + 1_000_000, noNaN: true }),
    );
    fc.assert(
      fc.property(bad, (n) => {
        const errs = validateNeq(n);
        expect(errs.length).toBeGreaterThan(0);
        expect(errs[0]!.field).toBe("neq");
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 4: rejects missing / non-numeric NEQ", () => {
    for (const bad of [undefined, null, Number.NaN, "1.5"]) {
      const errs = validateNeq(bad as unknown);
      expect(errs.length).toBeGreaterThan(0);
      expect(errs[0]!.field).toBe("neq");
    }
  });

  it("Property 4: rejects NEQ with more than two decimal places", () => {
    const tooPrecise = fc
      .double({ min: 0.001, max: NEQ_MAX - 1, noNaN: true })
      .filter((n) => roundNeq(n) !== n);
    fc.assert(
      fc.property(tooPrecise, (n) => {
        const errs = validateNeq(n);
        expect(errs.length).toBeGreaterThan(0);
        expect(errs[0]!.reason).toContain("decimal");
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 4: accepts valid two-decimal NEQ in range", () => {
    const validNeq = fc
      .integer({ min: 0, max: Math.round(NEQ_MAX * 100) })
      .map((cents) => cents / 100);
    fc.assert(
      fc.property(validNeq, (n) => {
        expect(validateNeq(n)).toEqual([]);
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 4: boundary values", () => {
    expect(validateNeq(0)).toEqual([]);
    expect(validateNeq(NEQ_MAX)).toEqual([]);
    expect(validateNeq(-0.01).length).toBeGreaterThan(0);
    expect(validateNeq(NEQ_MAX + 0.01).length).toBeGreaterThan(0);
  });
});

describe("Task 2.1 — identifier validation", () => {
  it("accepts 1..64 char identifiers and rejects empty / too long", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: IDENTIFIER_MAX_LEN }),
        (s) => {
          expect(validateIdentifier(s)).toEqual([]);
        },
      ),
      { numRuns: RUNS },
    );
    expect(validateIdentifier("").length).toBeGreaterThan(0);
    expect(
      validateIdentifier("x".repeat(IDENTIFIER_MAX_LEN + 1)).length,
    ).toBeGreaterThan(0);
  });
});

describe("Task 2.2 — required item fields", () => {
  const ALL: RequiredItemField[] = [
    "manufacturerId",
    "natureId",
    "identifier",
    "quantity",
    "storehouseId",
  ];

  function fullInput(): Record<RequiredItemField, unknown> {
    return {
      manufacturerId: "mfr-1",
      natureId: "nat-1",
      identifier: "L1",
      quantity: 10,
      storehouseId: "esh-1",
    };
  }

  // Feature: aims-web, Property 2: For any record missing a non-empty subset of
  // {Manufacturer, Nature, Identifier, Quantity, Explosive_Storehouse}, creation
  // SHALL be rejected, no item SHALL be created, and the error SHALL name
  // exactly the omitted fields.
  it("Property 2: names exactly the omitted required fields", () => {
    const subsetOfMissing = fc
      .subarray(ALL, { minLength: 1 })
      .map((missing) => [...new Set(missing)]);
    fc.assert(
      fc.property(subsetOfMissing, (missing) => {
        const input = fullInput();
        for (const f of missing) delete (input as Record<string, unknown>)[f];
        const errs = validateRequiredItemFields(input);
        const named = errs.map((e) => e.field).sort();
        expect(named).toEqual([...missing].sort());
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 2: treats empty/whitespace strings as missing", () => {
    const input = fullInput();
    input.identifier = "   ";
    input.manufacturerId = "";
    const named = validateRequiredItemFields(input)
      .map((e) => e.field)
      .sort();
    expect(named).toEqual(["identifier", "manufacturerId"].sort());
  });

  it("Property 2: complete input yields no errors", () => {
    expect(validateRequiredItemFields(fullInput())).toEqual([]);
  });
});

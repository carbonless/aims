import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { InMemoryRepository } from "../../domain/in-memory-repository.js";
import {
  ReferenceDataService,
  MANUFACTURER_NAME_MAX,
  MANUFACTURER_COUNTRY_MAX,
  CODE_MAX,
  DESCRIPTION_MAX,
} from "../../domain/reference-data.js";
import type { AmmunitionItem } from "../../domain/types.js";

const RUNS = 100;

// Deterministic id generator for reproducible tests.
function seqIdGen() {
  let n = 0;
  return () => `id-${++n}`;
}

function svc() {
  const repo = new InMemoryRepository();
  return { repo, service: new ReferenceDataService(repo, seqIdGen()) };
}

describe("Task 3.1 — reference-data create/round-trip and length validation", () => {
  // Feature: aims-web, Property 11: For any Manufacturer with a valid name
  // (1–200) and country (1–100) and optional fields within their limits, the
  // stored record SHALL round-trip all supplied fields; and for any submission
  // with an empty/missing name or country the operation SHALL be rejected
  // identifying the missing field.
  it("Property 11: valid manufacturer round-trips all supplied fields", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: MANUFACTURER_NAME_MAX }).filter((s) => s.trim().length > 0),
          country: fc.string({ minLength: 1, maxLength: MANUFACTURER_COUNTRY_MAX }).filter((s) => s.trim().length > 0),
          city: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        }),
        async (input) => {
          const { service } = svc();
          const res = await service.createManufacturer(input);
          expect(res.ok).toBe(true);
          if (res.ok) {
            expect(res.value.name).toBe(input.name);
            expect(res.value.country).toBe(input.country);
            if (input.city !== undefined) expect(res.value.city).toBe(input.city);
            expect(res.value.id).toBeTruthy();
          }
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("Property 11: missing/empty name or country is rejected naming the field", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("name", "country"),
        async (missing) => {
          const { service } = svc();
          const input: Record<string, string> = { name: "Acme", country: "USA" };
          input[missing] = "   "; // whitespace-only => treated as missing
          const res = await service.createManufacturer(input);
          expect(res.ok).toBe(false);
          if (!res.ok) {
            expect(res.error.code).toBe("VALIDATION_ERROR");
            expect(res.error.fields?.some((f) => f.field === missing)).toBe(true);
          }
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("condition code stores the serviceable flag", async () => {
    const { service } = svc();
    const res = await service.createConditionCode({ code: "A", description: "Serviceable", serviceable: true });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.serviceable).toBe(true);
  });

  // Feature: aims-web, Property 12: For any Manufacturer or reference-data field
  // whose length exceeds its defined maximum, the operation SHALL be rejected
  // and identify the offending field.
  it("Property 12: over-length manufacturer name is rejected", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: MANUFACTURER_NAME_MAX + 1, max: MANUFACTURER_NAME_MAX + 500 }),
        async (overLen) => {
          const { service } = svc();
          const res = await service.createManufacturer({ name: "x".repeat(overLen), country: "USA" });
          expect(res.ok).toBe(false);
          if (!res.ok) expect(res.error.fields?.some((f) => f.field === "name")).toBe(true);
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("Property 12: over-length HCC code and description are rejected", async () => {
    const { service } = svc();
    const longCode = await service.createHcc({ code: "x".repeat(CODE_MAX + 1), description: "ok" });
    expect(longCode.ok).toBe(false);
    const longDesc = await service.createHcc({ code: "1.1", description: "x".repeat(DESCRIPTION_MAX + 1) });
    expect(longDesc.ok).toBe(false);
  });
});

describe("Task 3.2 — duplicate detection and reference-in-use guard", () => {
  // Feature: aims-web, Property 15: For any existing Manufacturer/Nature name or
  // HCC/Condition_Code code, a submission whose key equals it ignoring case
  // SHALL be rejected as a duplicate with no new record stored.
  it("Property 15: case-insensitive duplicate manufacturer name is rejected", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.func(fc.boolean()),
        async (name, _f) => {
          const { repo, service } = svc();
          const first = await service.createManufacturer({ name, country: "USA" });
          expect(first.ok).toBe(true);
          // Flip case of alpha chars to produce a case-variant of the same name.
          const variant = name.replace(/[a-zA-Z]/g, (c) =>
            c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase(),
          );
          const before = (await repo.listManufacturers()).length;
          const dup = await service.createManufacturer({ name: variant, country: "USA" });
          const after = (await repo.listManufacturers()).length;
          expect(dup.ok).toBe(false);
          if (!dup.ok) expect(dup.error.code).toBe("CONFLICT");
          expect(after).toBe(before); // no new record stored
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("Property 15: case-insensitive duplicate HCC code is rejected", async () => {
    const { service } = svc();
    await service.createHcc({ code: "AB1", description: "x" });
    const dup = await service.createHcc({ code: "ab1", description: "y" });
    expect(dup.ok).toBe(false);
  });

  // Feature: aims-web, Property 13: For any reference record referenced by one
  // or more Ammunition_Items, a delete request SHALL be rejected, retain the
  // record, and report the count of referencing items.
  it("Property 13: referenced reference-data cannot be deleted; count reported", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 20 }), async (refCount) => {
        const { repo, service } = svc();
        const mfr = await service.createManufacturer({ name: "Acme", country: "USA" });
        expect(mfr.ok).toBe(true);
        const mfrId = mfr.ok ? mfr.value.id : "";
        for (let i = 0; i < refCount; i++) {
          const item: AmmunitionItem = {
            id: `item-${i}`,
            manufacturerId: mfrId,
            natureId: "n",
            identifier: `L${i}`,
            quantity: 1,
            neq: 1,
            hccCode: "1.1",
            conditionCode: "A",
            storehouseId: "esh-1",
            banStatus: "not_banned",
          };
          await repo.putItem(item);
        }
        const res = await service.deleteReference("manufacturer", mfrId);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.error.code).toBe("CONFLICT");
          expect(res.error.message).toContain(String(refCount));
        }
        // Record retained.
        expect(await repo.getManufacturer(mfrId)).toBeDefined();
      }),
      { numRuns: RUNS },
    );
  });

  it("unreferenced reference-data can be deleted", async () => {
    const { repo, service } = svc();
    const nat = await service.createNature("Small Arms");
    const id = nat.ok ? nat.value.id : "";
    const res = await service.deleteReference("nature", id);
    expect(res.ok).toBe(true);
    expect(await repo.getNature(id)).toBeUndefined();
  });
});

describe("Task 3.3 — constrained selectable values", () => {
  // Feature: aims-web, Property 14: For any item edit, the selectable
  // Manufacturer, Nature, Condition_Code, and HCC values SHALL equal exactly the
  // current reference records of each type.
  it("Property 14: selectable values equal exactly the stored reference set", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          mfrs: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0), { minLength: 0, maxLength: 6, selector: (s) => s.trim().toLowerCase() }),
          nats: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0), { minLength: 0, maxLength: 6, selector: (s) => s.trim().toLowerCase() }),
        }),
        async ({ mfrs, nats }) => {
          const { service } = svc();
          for (const n of mfrs) await service.createManufacturer({ name: n, country: "USA" });
          for (const n of nats) await service.createNature(n);
          const sel = await service.selectableValues();
          expect(sel.manufacturers.map((m) => m.name).sort()).toEqual([...mfrs].sort());
          expect(sel.natures.map((n) => n.name).sort()).toEqual([...nats].sort());
        },
      ),
      { numRuns: RUNS },
    );
  });
});

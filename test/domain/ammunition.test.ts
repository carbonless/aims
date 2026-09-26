import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { InMemoryRepository } from "../../domain/in-memory-repository.js";
import { AmmunitionService, type CreateItemInput } from "../../domain/ammunition.js";
import type { AmmunitionItem, ConditionCode, Hcc } from "../../domain/types.js";
import type { ItemFilters } from "../../domain/repository.js";

const RUNS = 100;

function seqIdGen() {
  let n = 0;
  return () => `id-${++n}`;
}

function fixedClock() {
  return () => new Date("2026-01-01T00:00:00.000Z");
}

/** Repo pre-seeded with reference HCC "1.1" and condition "A" (serviceable). */
async function seededRepo() {
  const repo = new InMemoryRepository();
  const hcc: Hcc = { code: "1.1", description: "Mass explosion" };
  const cond: ConditionCode = { code: "A", description: "Serviceable", serviceable: true };
  await repo.putHcc(hcc);
  await repo.putConditionCode(cond);
  return repo;
}

function service(repo: InMemoryRepository) {
  return new AmmunitionService(repo, "user-1", seqIdGen(), fixedClock());
}

const validInput = (over: Partial<CreateItemInput> = {}): CreateItemInput => ({
  manufacturerId: "mfr-1",
  natureId: "nat-1",
  identifier: "AGU19D034-002",
  quantity: 100,
  neq: 1.59,
  hccCode: "1.1",
  conditionCode: "A",
  storehouseId: "esh-1",
  ...over,
});

describe("Task 4.1 — item create with referential gates", () => {
  // Feature: aims-web, Property 1: For any record whose required fields are
  // present and whose Identifier, Quantity, NEQ, HCC, Condition_Code, and
  // Explosive_Storehouse are valid, creating the item SHALL succeed and assign
  // an id not equal to any existing item's id.
  it("Property 1: valid create succeeds with a unique id", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.length >= 1),
          quantity: fc.integer({ min: 0, max: 999_999_999 }),
          neqCents: fc.integer({ min: 0, max: 99_999_999 }),
        }),
        async ({ identifier, quantity, neqCents }) => {
          const repo = await seededRepo();
          const svc = service(repo);
          const first = await svc.create(validInput({ identifier, quantity, neq: neqCents / 100 }));
          expect(first.ok).toBe(true);
          const second = await svc.create(validInput({ identifier, quantity, neq: neqCents / 100 }));
          expect(second.ok).toBe(true);
          if (first.ok && second.ok) {
            expect(first.value.id).not.toBe(second.value.id);
          }
        },
      ),
      { numRuns: RUNS },
    );
  });

  // Feature: aims-web, Property 5: For any item create/update, the operation
  // SHALL succeed only if the HCC matches an existing HCC reference entry, and
  // SHALL be rejected (leaving the record unchanged) for any missing/unknown HCC.
  it("Property 5: create rejected for missing/unknown HCC", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(undefined), fc.string({ minLength: 1, maxLength: 10 }).map((s) => `X${s}`)),
        async (badHcc) => {
          const repo = await seededRepo();
          const svc = service(repo);
          const res = await svc.create(validInput({ hccCode: badHcc }));
          expect(res.ok).toBe(false);
          if (!res.ok) {
            expect(res.error.code).toBe("VALIDATION_ERROR");
            expect(res.error.fields?.some((f) => f.field === "hccCode")).toBe(true);
          }
          expect((await repo.listItems({})).length).toBe(0); // unchanged
        },
      ),
      { numRuns: RUNS },
    );
  });

  // Feature: aims-web, Property 6: For any item create/update, the operation
  // SHALL succeed only if the Condition_Code matches an existing entry, and SHALL
  // be rejected (retaining prior values) for any missing/unknown Condition_Code.
  it("Property 6: create rejected for missing/unknown Condition_Code", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(undefined), fc.string({ minLength: 1, maxLength: 10 }).map((s) => `Z${s}`)),
        async (badCond) => {
          const repo = await seededRepo();
          const svc = service(repo);
          const res = await svc.create(validInput({ conditionCode: badCond }));
          expect(res.ok).toBe(false);
          if (!res.ok) expect(res.error.fields?.some((f) => f.field === "conditionCode")).toBe(true);
          expect((await repo.listItems({})).length).toBe(0);
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("create writes an item_created audit record", async () => {
    const repo = await seededRepo();
    const res = await service(repo).create(validInput());
    expect(res.ok).toBe(true);
    if (res.ok) {
      const audit = await repo.queryAudit({ itemId: res.value.id });
      expect(audit.length).toBe(1);
      expect(audit[0]!.action).toBe("item_created");
    }
  });
});

describe("Task 4.2 — item update and not-found handling", () => {
  // Feature: aims-web, Property 7: For any existing item and any update whose
  // values satisfy the Quantity and NEQ bounds, the stored item SHALL equal the
  // updated values.
  it("Property 7: valid update persists the new values", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          quantity: fc.integer({ min: 0, max: 999_999_999 }),
          neqCents: fc.integer({ min: 0, max: 99_999_999 }),
          identifier: fc.string({ minLength: 1, maxLength: 64 }),
        }),
        async ({ quantity, neqCents, identifier }) => {
          const repo = await seededRepo();
          const svc = service(repo);
          const created = await svc.create(validInput());
          expect(created.ok).toBe(true);
          if (!created.ok) return;
          const neq = neqCents / 100;
          const res = await svc.update(created.value.id, { quantity, neq, identifier });
          expect(res.ok).toBe(true);
          const stored = await repo.getItem(created.value.id);
          expect(stored?.quantity).toBe(quantity);
          expect(stored?.neq).toBe(neq);
          expect(stored?.identifier).toBe(identifier);
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("Property 7 (1.7): update of a non-existent item returns NOT_FOUND and changes nothing", async () => {
    const repo = await seededRepo();
    const svc = service(repo);
    const res = await svc.update("does-not-exist", { quantity: 5 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
    expect((await repo.listItems({})).length).toBe(0);
  });
});

describe("Task 4.3 — list with filters and full field exposure", () => {
  const FIELDS: (keyof AmmunitionItem)[] = [
    "manufacturerId", "natureId", "identifier", "quantity", "neq",
    "hccCode", "conditionCode", "storehouseId", "banStatus",
  ];

  // Feature: aims-web, Property 8: For any set of items, a list request SHALL
  // return each matching item with Manufacturer, Nature, Identifier, Quantity,
  // NEQ, HCC, Condition_Code, Ban_Status, and Explosive_Storehouse.
  it("Property 8: listing exposes the full field set", async () => {
    const repo = await seededRepo();
    const svc = service(repo);
    await svc.create(validInput());
    const items = await svc.list();
    expect(items.length).toBe(1);
    for (const f of FIELDS) expect(items[0]![f]).toBeDefined();
  });

  // Feature: aims-web, Property 9: For any dataset and any combination of filters
  // over {Manufacturer, Nature, Explosive_Storehouse, Condition_Code, Identifier},
  // the returned set SHALL equal exactly the items matching all provided filters.
  it("Property 9: filters are sound and complete", async () => {
    const itemArb = fc.record({
      manufacturerId: fc.constantFrom("m1", "m2"),
      natureId: fc.constantFrom("n1", "n2"),
      storehouseId: fc.constantFrom("e1", "e2"),
      identifier: fc.constantFrom("L1", "L2", "L3"),
    });
    await fc.assert(
      fc.asyncProperty(
        fc.array(itemArb, { minLength: 0, maxLength: 25 }),
        fc.record({
          manufacturerId: fc.option(fc.constantFrom("m1", "m2"), { nil: undefined }),
          natureId: fc.option(fc.constantFrom("n1", "n2"), { nil: undefined }),
          storehouseId: fc.option(fc.constantFrom("e1", "e2"), { nil: undefined }),
          identifier: fc.option(fc.constantFrom("L1", "L2", "L3"), { nil: undefined }),
        }),
        async (rows, rawFilters) => {
          const repo = await seededRepo();
          const svc = service(repo);
          const created: AmmunitionItem[] = [];
          for (const r of rows) {
            const res = await svc.create(validInput(r));
            if (res.ok) created.push(res.value);
          }
          const filters: ItemFilters = {};
          for (const [k, v] of Object.entries(rawFilters)) {
            if (v !== undefined) (filters as Record<string, unknown>)[k] = v;
          }
          const expected = created.filter((i) =>
            (filters.manufacturerId === undefined || i.manufacturerId === filters.manufacturerId) &&
            (filters.natureId === undefined || i.natureId === filters.natureId) &&
            (filters.storehouseId === undefined || i.storehouseId === filters.storehouseId) &&
            (filters.identifier === undefined || i.identifier === filters.identifier),
          );
          const got = await svc.list(filters);
          expect(new Set(got.map((i) => i.id))).toEqual(new Set(expected.map((i) => i.id)));
        },
      ),
      { numRuns: RUNS },
    );
  });
});

describe("Task 4.4 — zero-quantity-gated deletion", () => {
  // Feature: aims-web, Property 10: For any item, a deletion request SHALL remove
  // the item if and only if its Quantity is 0; when Quantity is greater than 0
  // the item SHALL be retained unchanged.
  it("Property 10: delete iff quantity is zero", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 999_999_999 }), async (qty) => {
        const repo = await seededRepo();
        const svc = service(repo);
        const created = await svc.create(validInput({ quantity: qty }));
        expect(created.ok).toBe(true);
        if (!created.ok) return;
        const res = await svc.delete(created.value.id);
        const stillThere = await repo.getItem(created.value.id);
        if (qty === 0) {
          expect(res.ok).toBe(true);
          expect(stillThere).toBeUndefined();
        } else {
          expect(res.ok).toBe(false);
          if (!res.ok) expect(res.error.code).toBe("CONFLICT");
          expect(stillThere).toBeDefined();
          expect(stillThere?.quantity).toBe(qty); // unchanged
        }
      }),
      { numRuns: RUNS },
    );
  });
});

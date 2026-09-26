import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { InMemoryRepository } from "../../domain/in-memory-repository.js";
import {
  StorehouseService,
  STOREHOUSE_NAME_MAX,
  NEQ_LIMIT_MAX,
} from "../../domain/storehouse.js";
import { roundNeq } from "../../domain/validation.js";
import type { AmmunitionItem } from "../../domain/types.js";

const RUNS = 100;

function seqIdGen() {
  let n = 0;
  return () => `sh-${++n}`;
}

function svc() {
  const repo = new InMemoryRepository();
  return { repo, service: new StorehouseService(repo, seqIdGen()) };
}

/** Put an item directly with given storehouse/hcc/neq/quantity. */
async function putItem(
  repo: InMemoryRepository,
  over: Partial<AmmunitionItem> & Pick<AmmunitionItem, "id">,
) {
  const item: AmmunitionItem = {
    manufacturerId: "m",
    natureId: "n",
    identifier: "L",
    quantity: 1,
    neq: 1,
    hccCode: "1.1",
    conditionCode: "A",
    storehouseId: "esh-1",
    banStatus: "not_banned",
    ...over,
  };
  await repo.putItem(item);
}

// Arbitrary for an item's storehouse assignment, hcc, neq (2dp), quantity.
const itemArb = fc.record({
  storehouseId: fc.constantFrom("esh-1", "esh-2"),
  hccCode: fc.constantFrom("1.1", "1.3", "1.4"),
  neqCents: fc.integer({ min: 0, max: 100_000 }),
  quantity: fc.integer({ min: 0, max: 10_000 }),
});

describe("Task 5.1 — on-demand NEQ aggregation", () => {
  // Feature: aims-web, Property 16: For any set of items stored in an
  // Explosive_Storehouse, the reported aggregate NEQ SHALL equal
  // Σ(itemᵢ.NEQ × itemᵢ.Quantity) over all items in that storehouse, rounded to
  // two decimal places (and 0.00 for an empty storehouse).
  it("Property 16: aggregate NEQ equals sum of neq×quantity (0.00 when empty)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(itemArb, { minLength: 0, maxLength: 40 }), async (rows) => {
        const { repo, service } = svc();
        for (let idx = 0; idx < rows.length; idx++) {
          const r = rows[idx]!;
          await putItem(repo, {
            id: `i-${idx}`,
            storehouseId: r.storehouseId,
            hccCode: r.hccCode,
            neq: r.neqCents / 100,
            quantity: r.quantity,
          });
        }
        for (const esh of ["esh-1", "esh-2"]) {
          const expected = roundNeq(
            rows
              .filter((r) => r.storehouseId === esh)
              .reduce((s, r) => s + (r.neqCents / 100) * r.quantity, 0),
          );
          expect(await service.aggregateNeq(esh)).toBe(expected);
        }
      }),
      { numRuns: RUNS },
    );
  });

  it("Property 16: empty storehouse aggregates to 0.00", async () => {
    const { service } = svc();
    expect(await service.aggregateNeq("esh-empty")).toBe(0);
  });

  // Feature: aims-web, Property 17: For any storehouse contents, the per-HCC NEQ
  // breakdown SHALL sum, per HCC, the neq × quantity of its items, and the sum of
  // all per-HCC values SHALL equal the aggregate NEQ.
  it("Property 17: per-HCC breakdown partitions the aggregate", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(itemArb, { minLength: 0, maxLength: 40 }), async (rows) => {
        const { repo, service } = svc();
        for (let idx = 0; idx < rows.length; idx++) {
          const r = rows[idx]!;
          await putItem(repo, {
            id: `i-${idx}`,
            storehouseId: r.storehouseId,
            hccCode: r.hccCode,
            neq: r.neqCents / 100,
            quantity: r.quantity,
          });
        }
        const breakdown = await service.neqBreakdown("esh-1");
        // Each per-HCC entry equals the recomputed group sum.
        for (const entry of breakdown) {
          const expected = roundNeq(
            rows
              .filter((r) => r.storehouseId === "esh-1" && r.hccCode === entry.hccCode)
              .reduce((s, r) => s + (r.neqCents / 100) * r.quantity, 0),
          );
          expect(entry.neq).toBe(expected);
        }
        // Sum of per-HCC equals the aggregate (within 2dp rounding).
        const sumOfParts = roundNeq(breakdown.reduce((s, e) => s + e.neq, 0));
        const aggregate = await service.aggregateNeq("esh-1");
        expect(Math.abs(sumOfParts - aggregate)).toBeLessThanOrEqual(0.01);
      }),
      { numRuns: RUNS },
    );
  });
});

describe("Task 5.2 — storehouse create/validation, capacity, mixed-hazard", () => {
  // Feature: aims-web, Property 18: For any Explosive_Storehouse with a valid name
  // (1–100) and NEQ_Limit (0–999,999,999.99), the stored record SHALL round-trip
  // its fields; and for any submission with an out-of-range/non-numeric/empty
  // NEQ_Limit, or an empty/over-length/duplicate name, the operation SHALL be
  // rejected and not persisted.
  it("Property 18: valid storehouse round-trips; invalid rejected & not persisted", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: STOREHOUSE_NAME_MAX }).filter((s) => s.trim().length > 0),
          neqCents: fc.integer({ min: 0, max: Math.round(NEQ_LIMIT_MAX * 100) }),
        }),
        async ({ name, neqCents }) => {
          const { repo, service } = svc();
          const res = await service.create({ name, neqLimit: neqCents / 100 });
          expect(res.ok).toBe(true);
          if (res.ok) {
            expect(res.value.name).toBe(name);
            expect(res.value.neqLimit).toBe(neqCents / 100);
          }
          expect((await repo.listStorehouses()).length).toBe(1);
        },
      ),
      { numRuns: RUNS },
    );
  });

  it("Property 18: invalid name/NEQ_Limit rejected and not persisted", async () => {
    const bad = [
      { name: "", neqLimit: 10 },
      { name: "x".repeat(STOREHOUSE_NAME_MAX + 1), neqLimit: 10 },
      { name: "ok", neqLimit: -1 },
      { name: "ok", neqLimit: NEQ_LIMIT_MAX + 1 },
      { name: "ok", neqLimit: Number.NaN },
      { name: "ok" }, // missing neqLimit
    ];
    for (const input of bad) {
      const { repo, service } = svc();
      const res = await service.create(input as { name: string });
      expect(res.ok).toBe(false);
      expect((await repo.listStorehouses()).length).toBe(0);
    }
  });

  it("Property 18: case-insensitive duplicate name rejected", async () => {
    const { service } = svc();
    await service.create({ name: "Bunker A", neqLimit: 100 });
    const dup = await service.create({ name: "bunker a", neqLimit: 200 });
    expect(dup.ok).toBe(false);
  });

  // Feature: aims-web, Property 20: For any Explosive_Storehouse, the reported
  // remaining capacity SHALL equal NEQ_Limit minus the aggregate NEQ.
  it("Property 20: remaining capacity = NEQ_Limit − aggregate NEQ", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          limitCents: fc.integer({ min: 0, max: Math.round(NEQ_LIMIT_MAX * 100) }),
          rows: fc.array(
            fc.record({
              hccCode: fc.constantFrom("1.1", "1.4"),
              neqCents: fc.integer({ min: 0, max: 10_000 }),
              quantity: fc.integer({ min: 0, max: 1_000 }),
            }),
            { minLength: 0, maxLength: 20 },
          ),
        }),
        async ({ limitCents, rows }) => {
          const { repo, service } = svc();
          const created = await service.create({ name: "Cap Test", neqLimit: limitCents / 100 });
          expect(created.ok).toBe(true);
          const eshId = created.ok ? created.value.id : "";
          for (let idx = 0; idx < rows.length; idx++) {
            const r = rows[idx]!;
            await putItem(repo, {
              id: `c-${idx}`,
              storehouseId: eshId,
              hccCode: r.hccCode,
              neq: r.neqCents / 100,
              quantity: r.quantity,
            });
          }
          const view = await service.view(eshId);
          expect(view.ok).toBe(true);
          if (view.ok) {
            expect(view.value.remainingCapacity).toBe(
              roundNeq(limitCents / 100 - view.value.aggregateNeq),
            );
          }
        },
      ),
      { numRuns: RUNS },
    );
  });

  // Feature: aims-web, Property 21: For any storehouse holding two or more
  // distinct HCC values, the view SHALL flag mixed hazard and list exactly the
  // set of distinct HCC values present.
  it("Property 21: mixed-hazard flag and exact distinct-HCC set", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom("1.1", "1.2", "1.3", "1.4"), { minLength: 0, maxLength: 20 }),
        async (hccs) => {
          const { repo, service } = svc();
          const created = await service.create({ name: "Mix Test", neqLimit: 1_000_000 });
          const eshId = created.ok ? created.value.id : "";
          for (let idx = 0; idx < hccs.length; idx++) {
            await putItem(repo, {
              id: `h-${idx}`,
              storehouseId: eshId,
              hccCode: hccs[idx]!,
              neq: 1,
              quantity: 1,
            });
          }
          const distinct = [...new Set(hccs)].sort((a, b) => a.localeCompare(b));
          const view = await service.view(eshId);
          expect(view.ok).toBe(true);
          if (view.ok) {
            expect(view.value.distinctHccs).toEqual(distinct);
            expect(view.value.mixedHazard).toBe(distinct.length >= 2);
          }
        },
      ),
      { numRuns: RUNS },
    );
  });
});

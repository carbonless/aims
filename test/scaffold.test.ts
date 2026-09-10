import { describe, it, expect } from "vitest";
import { InMemoryRepository } from "../domain/in-memory-repository.js";
import { ok, err, type AmmunitionItem } from "../domain/types.js";

describe("scaffold smoke test", () => {
  it("Result helpers construct ok/err", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
    expect(err({ code: "NOT_FOUND", message: "nope" })).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "nope" },
    });
  });

  it("in-memory repository round-trips an item", async () => {
    const repo = new InMemoryRepository();
    const item: AmmunitionItem = {
      id: "item-1",
      manufacturerId: "mfr-1",
      natureId: "nat-1",
      identifier: "AGU19D034-002",
      quantity: 100,
      neq: 1.25,
      hccCode: "1.1",
      conditionCode: "A",
      storehouseId: "esh-1",
      banStatus: "not_banned",
    };
    await repo.putItem(item);
    expect(await repo.getItem("item-1")).toEqual(item);
    expect(await repo.getItem("missing")).toBeUndefined();
  });

  it("transact rolls back all ops when a guard fails", async () => {
    const repo = new InMemoryRepository();
    await repo.putItem({
      id: "a",
      manufacturerId: "m",
      natureId: "n",
      identifier: "L1",
      quantity: 5,
      neq: 1,
      hccCode: "1.1",
      conditionCode: "A",
      storehouseId: "esh-1",
      banStatus: "not_banned",
    });

    // Ask to decrement by 10 with a guard requiring >= 10; must fail and roll back.
    await expect(
      repo.transact([
        { adjustAggregateNeq: { storehouseId: "esh-1", delta: -10 } },
        {
          adjustItemQuantity: { itemId: "a", delta: -10, requireQuantityGte: 10 },
        },
      ]),
    ).rejects.toThrow();

    const item = await repo.getItem("a");
    expect(item?.quantity).toBe(5); // unchanged
    const agg = await repo.getStorehouseAggregates("esh-1");
    expect(agg.aggregateNeq).toBe(0); // the earlier op was rolled back too
  });
});

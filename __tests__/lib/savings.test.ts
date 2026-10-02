import { comparableSavings } from "@/lib/savings";

describe("comparableSavings", () => {
  it("compares only owned volumes with a recorded price", () => {
    const result = comparableSavings(
      [
        { owned: true, pricePaid: 7 },
        { owned: true, pricePaid: null },
        { owned: false, pricePaid: 5 },
      ],
      10,
    );

    expect(result).toEqual({ retailValue: 10, paid: 7, savings: 3 });
  });

  it("returns zeros without a retail price", () => {
    expect(comparableSavings([{ owned: true, pricePaid: 7 }], null)).toEqual({
      retailValue: 0,
      paid: 0,
      savings: 0,
    });
  });

  it("can be negative when paying over retail", () => {
    expect(
      comparableSavings([{ owned: true, pricePaid: 12 }], 10).savings,
    ).toBe(-2);
  });
});

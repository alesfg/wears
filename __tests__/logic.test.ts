import { getTier, isProfitable, TIERS } from "../constants/config";

describe("getTier", () => {
  it("returns 'free basically' at or below $2", () => {
    expect(getTier(2)).toBe("free basically");
    expect(getTier(1)).toBe("free basically");
    expect(getTier(0.5)).toBe("free basically");
  });

  it("returns 'workhorse' between $2 and $10", () => {
    expect(getTier(2.01)).toBe("workhorse");
    expect(getTier(5)).toBe("workhorse");
    expect(getTier(10)).toBe("workhorse");
  });

  it("returns 'normal' between $10 and $25", () => {
    expect(getTier(10.01)).toBe("normal");
    expect(getTier(19.48)).toBe("normal");
    expect(getTier(25)).toBe("normal");
  });

  it("returns 'luxury' between $25 and $80", () => {
    expect(getTier(25.01)).toBe("luxury");
    expect(getTier(50)).toBe("luxury");
    expect(getTier(80)).toBe("luxury");
  });

  it("returns 'investment' above $80", () => {
    expect(getTier(80.01)).toBe("investment");
    expect(getTier(448)).toBe("investment");
    expect(getTier(9999)).toBe("investment");
  });
});

describe("isProfitable", () => {
  it("is profitable at $25 and below", () => {
    expect(isProfitable(25)).toBe(true);
    expect(isProfitable(19.48)).toBe(true);
    expect(isProfitable(1.82)).toBe(true);
    expect(isProfitable(0)).toBe(true);
  });

  it("is not profitable above $25", () => {
    expect(isProfitable(25.01)).toBe(false);
    expect(isProfitable(80)).toBe(false);
    expect(isProfitable(448)).toBe(false);
  });
});

describe("computeCpw", () => {
  const computeCpw = (price: number, wearCount: number) =>
    wearCount === 0 ? price : price / wearCount;

  it("equals price when no wears", () => {
    expect(computeCpw(448, 0)).toBe(448);
  });

  it("halves with first wear", () => {
    expect(computeCpw(100, 2)).toBe(50);
  });

  it("matches design example: $448 / 23 wears ≈ $19.48", () => {
    expect(computeCpw(448, 23)).toBeCloseTo(19.478, 2);
  });

  it("matches design example: $62 / 34 wears ≈ $1.82", () => {
    expect(computeCpw(62, 34)).toBeCloseTo(1.823, 2);
  });
});

describe("TIERS order", () => {
  it("tiers are ordered from highest CPW to lowest", () => {
    const thresholds = TIERS.map((t) => t.maxCpw).filter((v) => v !== Infinity);
    for (let i = 0; i < thresholds.length - 1; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i + 1]);
    }
  });

  it("last tier has the lowest threshold ($2)", () => {
    const last = TIERS[TIERS.length - 1];
    expect(last.maxCpw).toBe(2);
  });
});

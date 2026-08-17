import { describe, expect, it } from "vitest";
import { calculateDilution, calculatePricePerShare } from "./conversion";

function dilution(preMoneyValuation: string, investmentAmount: string, optionPoolPostMoneyPercent: number) {
  return calculateDilution({ preMoneyValuation, investmentAmount, optionPoolPostMoneyPercent });
}

describe("dilution model scenarios", () => {
  it("handles equal pre-money and investment", () => {
    const result = dilution("1000", "1000", 0);
    expect(result.postMoneyValuation).toBe("2000.00");
    expect(result.investorOwnershipPercent).toBe("50.0000");
  });
  it("handles ten percent investment", () => {
    const result = dilution("9000", "1000", 0);
    expect(result.investorOwnershipPercent).toBe("10.0000");
  });
  it("handles twenty percent investment", () => {
    const result = dilution("8000", "2000", 0);
    expect(result.investorOwnershipPercent).toBe("20.0000");
  });
  it("handles zero investment", () => {
    const result = dilution("1000", "0", 0);
    expect(result.postMoneyValuation).toBe("1000.00");
    expect(result.investorOwnershipPercent).toBe("0.0000");
  });
  it("handles one percent investment", () => {
    const result = dilution("9900", "100", 0);
    expect(result.investorOwnershipPercent).toBe("1.0000");
  });
  it("handles one percent option pool", () => {
    expect(dilution("1000", "100", 1).optionPoolPercent).toBe("1.0000");
  });
  it("handles five percent option pool", () => {
    expect(dilution("1000", "100", 5).optionPoolPercent).toBe("5.0000");
  });
  it("handles twenty percent option pool", () => {
    expect(dilution("1000", "100", 20).optionPoolPercent).toBe("20.0000");
  });
  it("handles fifty percent option pool", () => {
    expect(dilution("1000", "100", 50).optionPoolPercent).toBe("50.0000");
  });
  it("handles full option pool", () => {
    expect(dilution("1000", "100", 100).optionPoolPercent).toBe("100.0000");
  });
  it("reports existing ownership after investment", () => {
    const result = dilution("8000", "2000", 0);
    expect(result.existingDilutionPercent).toBe("80.0000");
  });
  it("reports existing ownership with pool", () => {
    const result = dilution("8000", "2000", 10);
    expect(Number(result.existingDilutionPercent)).toBeLessThan(80);
  });
  it("keeps all percentages bounded", () => {
    const result = dilution("8000", "2000", 10);
    for (const value of [result.investorOwnershipPercent, result.optionPoolPercent, result.existingDilutionPercent]) {
      expect(Number(value)).toBeGreaterThanOrEqual(0);
      expect(Number(value)).toBeLessThanOrEqual(100);
    }
  });
  it("keeps percentage sum at one hundred", () => {
    const result = dilution("8000", "2000", 10);
    const sum = Number(result.investorOwnershipPercent) + Number(result.optionPoolPercent) + Number(result.existingDilutionPercent);
    expect(sum).toBeCloseTo(100, 4);
  });
  it("keeps post-money as sum", () => {
    const result = dilution("1234.50", "765.50", 10);
    expect(result.postMoneyValuation).toBe("2000.00");
  });
  it("keeps decimal pre-money precision", () => {
    const result = dilution("1234.56", "100.44", 10);
    expect(result.postMoneyValuation).toBe("1335.00");
  });
  it("keeps decimal investment precision", () => {
    const result = dilution("1000", "0.25", 10);
    expect(result.postMoneyValuation).toBe("1000.25");
  });
  it("rejects invalid pre-money", () => {
    expect(() => dilution("nope", "100", 10)).toThrow();
  });
  it("rejects invalid investment", () => {
    expect(() => dilution("1000", "nope", 10)).toThrow();
  });
  it("handles negative pre-money", () => {
    expect(typeof dilution("-1000", "100", 10).postMoneyValuation).toBe("string");
  });
  it("handles negative investment", () => {
    expect(typeof dilution("1000", "-100", 10).postMoneyValuation).toBe("string");
  });
  it("handles negative pool", () => {
    expect(dilution("1000", "100", -1).optionPoolPercent).toBe("-1.0000");
  });
  it("handles pool above hundred", () => {
    expect(dilution("1000", "100", 100.01).optionPoolPercent).toBe("100.0100");
  });
  it("handles non-finite pool", () => {
    expect(typeof dilution("1000", "100", Number.NaN).optionPoolPercent).toBe("string");
  });
  it("handles large company", () => {
    const result = dilution("1000000000000", "100000000000", 10);
    expect(Number(result.investorOwnershipPercent)).toBeCloseTo(9.0909, 3);
  });
  it("handles small company", () => {
    const result = dilution("1", "1", 10);
    expect(result.postMoneyValuation).toBe("2.00");
  });
  it("formats post-money two decimals", () => {
    expect(dilution("1", "1", 0).postMoneyValuation).toMatch(/^\d+\.\d{2}$/);
  });
  it("formats ownership four decimals", () => {
    expect(dilution("1", "1", 0).investorOwnershipPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("formats pool four decimals", () => {
    expect(dilution("1", "1", 0).optionPoolPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("formats existing dilution four decimals", () => {
    expect(dilution("1", "1", 0).existingDilutionPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("keeps deterministic output", () => {
    const first = dilution("1000", "100", 10);
    const second = dilution("1000", "100", 10);
    expect(first).toEqual(second);
  });
  it("keeps zero pool deterministic", () => {
    expect(dilution("1000", "100", 0)).toEqual(dilution("1000", "100", 0));
  });
  it("keeps full pool deterministic", () => {
    expect(dilution("1000", "100", 100)).toEqual(dilution("1000", "100", 100));
  });
  it("calculates pre-money share price", () => {
    expect(calculatePricePerShare("1000000", "500000")).toBe("2.0000000000");
  });
  it("calculates post-money share price context separately", () => {
    expect(calculatePricePerShare("2000000", "1000000")).toBe("2.0000000000");
  });
  it("calculates precise share price", () => {
    expect(calculatePricePerShare("10", "3")).toBe("3.3333333333");
  });
  it("calculates integer share price", () => {
    expect(calculatePricePerShare("10", "2")).toBe("5.0000000000");
  });
  it("rejects empty valuation", () => {
    expect(() => calculatePricePerShare("", "2")).toThrow();
  });
  it("rejects empty capitalization", () => {
    expect(() => calculatePricePerShare("10", "")).toThrow();
  });
  it("rejects non-numeric valuation", () => {
    expect(() => calculatePricePerShare("x", "2")).toThrow();
  });
  it("rejects non-numeric capitalization", () => {
    expect(() => calculatePricePerShare("10", "x")).toThrow();
  });
  it("returns positive price", () => {
    expect(Number(calculatePricePerShare("100", "10"))).toBeGreaterThan(0);
  });
  it("returns string price", () => {
    expect(typeof calculatePricePerShare("100", "10")).toBe("string");
  });
  it("preserves price decimal places", () => {
    expect(calculatePricePerShare("100", "10")).toMatch(/^\d+\.\d{10}$/);
  });
  it("handles billion valuation", () => {
    expect(calculatePricePerShare("1000000000", "1000000")).toBe("1000.0000000000");
  });
  it("handles tiny valuation", () => {
    expect(calculatePricePerShare("0.01", "10")).toBe("0.0010000000");
  });
  it("handles decimal capitalization", () => {
    expect(calculatePricePerShare("10", "2.5")).toBe("4.0000000000");
  });
  it("keeps result repeatable", () => {
    const expected = calculatePricePerShare("123.45", "6.7");
    expect(calculatePricePerShare("123.45", "6.7")).toBe(expected);
  });
  it("handles zero price denominator", () => {
    expect(typeof calculatePricePerShare("1", "0")).toBe("string");
  });
  it("handles negative price denominator", () => {
    expect(typeof calculatePricePerShare("1", "-2")).toBe("string");
  });
  it("handles negative numerator", () => {
    expect(typeof calculatePricePerShare("-1", "2")).toBe("string");
  });
  it("returns bounded share price", () => {
    const price = Number(calculatePricePerShare("100", "10"));
    expect(price).toBeGreaterThan(0);
    expect(Number.isFinite(price)).toBe(true);
  });
  it("keeps dilution output positive", () => {
    const result = dilution("100", "10", 10);
    expect(Number(result.postMoneyValuation)).toBeGreaterThan(0);
  });
  it("keeps dilution output finite", () => {
    const result = dilution("100", "10", 10);
    expect(Number.isFinite(Number(result.investorOwnershipPercent))).toBe(true);
  });
  it("keeps ownership numeric", () => {
    expect(Number.isFinite(Number(dilution("100", "10", 10).optionPoolPercent))).toBe(true);
  });
});

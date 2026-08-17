import { describe, expect, it } from "vitest";
import {
  calculateDilution,
  calculateNoteAccrual,
  calculatePricePerShare,
  convertNote,
  convertPostMoneySafe,
} from "./conversion";

const baseContext = { pricePerShare: "2", companyCapitalization: "10000000" };

describe("financial conversion boundary coverage", () => {
  it("calculates one share price", () => {
    expect(calculatePricePerShare("100", "50")).toBe("2.0000000000");
  });
  it("calculates fractional share price", () => {
    expect(calculatePricePerShare("100", "3")).toBe("33.3333333333");
  });
  it("calculates small share price", () => {
    expect(calculatePricePerShare("1", "1000")).toBe("0.0010000000");
  });
  it("calculates large share price", () => {
    expect(calculatePricePerShare("1000000000000", "1000000")).toBe("1000000.0000000000");
  });
  it("handles zero valuation", () => {
    expect(typeof calculatePricePerShare("0", "10")).toBe("string");
  });
  it("handles zero capitalization", () => {
    expect(typeof calculatePricePerShare("10", "0")).toBe("string");
  });
  it("handles negative valuation", () => {
    expect(typeof calculatePricePerShare("-1", "10")).toBe("string");
  });
  it("handles negative capitalization", () => {
    expect(typeof calculatePricePerShare("10", "-1")).toBe("string");
  });
  it("uses financing price for cap above price", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_VALUATION_CAP", purchaseAmount: "100", valuationCap: "100000000", mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(result.appliedMechanism).toBe("FINANCING_PRICE");
  });
  it("uses cap price below financing", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_VALUATION_CAP", purchaseAmount: "100", valuationCap: "5000000", mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(result.appliedMechanism).toBe("CAP");
  });
  it("uses discount price below financing", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "100", discountRate: 25, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(result.appliedMechanism).toBe("DISCOUNT");
  });
  it("selects lower cap with discount", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_CAP_AND_DISCOUNT", purchaseAmount: "100", valuationCap: "4000000", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(result.conversionPrice).toBe("0.4000000000");
  });
  it("selects lower discount with cap", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_CAP_AND_DISCOUNT", purchaseAmount: "100", valuationCap: "9000000", discountRate: 25, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(result.conversionPrice).toBe("0.9000000000");
  });
  it("rejects zero purchase", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_VALUATION_CAP", purchaseAmount: "0", valuationCap: "100", mfnEnabled: false, proRataEnabled: false }, baseContext)).toThrow();
  });
  it("rejects negative purchase", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_VALUATION_CAP", purchaseAmount: "-1", valuationCap: "100", mfnEnabled: false, proRataEnabled: false }, baseContext)).toThrow();
  });
  it("rejects invalid discount", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "1", discountRate: 101, mfnEnabled: false, proRataEnabled: false }, baseContext)).toThrow();
  });
  it("ignores negative discount", () => {
    expect(convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "1", discountRate: -1, mfnEnabled: false, proRataEnabled: false }, baseContext).appliedMechanism).toBe("FINANCING_PRICE");
  });
  it("keeps ten decimal places", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "1", discountRate: 33, mfnEnabled: false, proRataEnabled: false }, { pricePerShare: "3", companyCapitalization: "100" });
    expect(result.conversionPrice).toMatch(/^\d+\.\d{10}$/);
  });
  it("returns positive issued shares", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "100", discountRate: 20, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(Number(result.sharesIssued)).toBeGreaterThan(0);
  });
  it("returns string shares", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "100", discountRate: 20, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(typeof result.sharesIssued).toBe("string");
  });
  it("accrues no interest for same date", () => {
    const result = calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-01"));
    expect(result.interest).toBe("0.00");
    expect(result.total).toBe("100.00");
  });
  it("accrues one day", () => {
    const result = calculateNoteAccrual("365", 10, new Date("2025-01-01"), new Date("2025-01-02"));
    expect(result.daysElapsed).toBe(1);
    expect(Number(result.interest)).toBeGreaterThan(0);
  });
  it("accrues leap year days", () => {
    const result = calculateNoteAccrual("1000", 10, new Date("2024-01-01"), new Date("2025-01-01"));
    expect(result.daysElapsed).toBe(366);
  });
  it("rejects date reversal", () => {
    expect(() => calculateNoteAccrual("100", 10, new Date("2025-02-01"), new Date("2025-01-01"))).toThrow();
  });
  it("handles negative principal", () => {
    expect(typeof calculateNoteAccrual("-100", 10, new Date("2025-01-01"), new Date("2025-02-01")).total).toBe("string");
  });
  it("handles negative interest", () => {
    expect(typeof calculateNoteAccrual("100", -1, new Date("2025-01-01"), new Date("2025-02-01")).total).toBe("string");
  });
  it("converts note at cap", () => {
    const result = convertNote({ principal: "100000", interestRate: 8, maturityDate: "2027-01-01", valuationCap: "5000000", qualifiedFinancingMin: "1000000", maturityTreatment: "CONVERT_AT_CAP" }, new Date("2025-01-01"), new Date("2026-01-01"), { pricePerShare: "1", companyCapitalization: "10000000" });
    expect(result.appliedMechanism).toBe("CAP");
  });
  it("converts note with discount", () => {
    const result = convertNote({ principal: "100000", interestRate: 8, maturityDate: "2027-01-01", discountRate: 20, qualifiedFinancingMin: "1000000", maturityTreatment: "REPAY" }, new Date("2025-01-01"), new Date("2026-01-01"), { pricePerShare: "1", companyCapitalization: "10000000" });
    expect(result.appliedMechanism).toBe("DISCOUNT");
  });
  it("calculates zero option pool", () => {
    const result = calculateDilution({ preMoneyValuation: "1000000", investmentAmount: "100000", optionPoolPostMoneyPercent: 0 });
    expect(result.optionPoolPercent).toBe("0.0000");
  });
  it("calculates ten percent option pool", () => {
    const result = calculateDilution({ preMoneyValuation: "1000000", investmentAmount: "100000", optionPoolPostMoneyPercent: 10 });
    expect(result.optionPoolPercent).toBe("10.0000");
  });
  it("calculates ownership under half", () => {
    const result = calculateDilution({ preMoneyValuation: "9000000", investmentAmount: "1000000", optionPoolPostMoneyPercent: 5 });
    expect(Number(result.investorOwnershipPercent)).toBeLessThan(50);
  });
  it("returns all dilution fields", () => {
    const result = calculateDilution({ preMoneyValuation: "100", investmentAmount: "10", optionPoolPostMoneyPercent: 10 });
    expect(result).toEqual(expect.objectContaining({ postMoneyValuation: expect.any(String), investorOwnershipPercent: expect.any(String), optionPoolPercent: expect.any(String), existingDilutionPercent: expect.any(String) }));
  });
  it("handles negative pre-money", () => {
    expect(typeof calculateDilution({ preMoneyValuation: "-1", investmentAmount: "10", optionPoolPostMoneyPercent: 10 }).postMoneyValuation).toBe("string");
  });
  it("handles negative investment", () => {
    expect(typeof calculateDilution({ preMoneyValuation: "100", investmentAmount: "-1", optionPoolPostMoneyPercent: 10 }).postMoneyValuation).toBe("string");
  });
  it("handles option pool above one hundred", () => {
    expect(calculateDilution({ preMoneyValuation: "100", investmentAmount: "10", optionPoolPostMoneyPercent: 101 }).optionPoolPercent).toBe("101.0000");
  });
  it("handles option pool below zero", () => {
    expect(calculateDilution({ preMoneyValuation: "100", investmentAmount: "10", optionPoolPostMoneyPercent: -1 }).optionPoolPercent).toBe("-1.0000");
  });
  it("preserves precision on large values", () => {
    const result = calculateDilution({ preMoneyValuation: "1000000000000000", investmentAmount: "100000000000000", optionPoolPostMoneyPercent: 12.5 });
    expect(result.postMoneyValuation).toBe("1100000000000000.00");
  });
  it("handles decimal purchase amount", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "10.50", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(Number(result.sharesIssued)).toBeGreaterThan(0);
  });
  it("handles decimal share price", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "100", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, { pricePerShare: "0.333333", companyCapitalization: "1000000" });
    expect(result.conversionPrice).toMatch(/^0\./);
  });
  it("handles exact cap tie", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_CAP_AND_DISCOUNT", purchaseAmount: "100", valuationCap: "8000000", discountRate: 20, mfnEnabled: false, proRataEnabled: false }, { pricePerShare: "1", companyCapitalization: "10000000" });
    expect(result.conversionPrice).toBe("0.8000000000");
  });
  it("keeps conversion mechanism enumerable", () => {
    const result = convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "1", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, baseContext);
    expect(["CAP", "DISCOUNT", "CAP_AND_DISCOUNT", "FINANCING_PRICE"]).toContain(result.appliedMechanism);
  });
  it("rejects empty purchase amount", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, baseContext)).toThrow();
  });
  it("rejects malformed purchase amount", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "abc", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, baseContext)).toThrow();
  });
  it("rejects malformed price", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "1", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, { pricePerShare: "abc", companyCapitalization: "100" })).toThrow();
  });
  it("rejects malformed capitalization", () => {
    expect(() => convertPostMoneySafe({ type: "POST_MONEY_DISCOUNT", purchaseAmount: "1", discountRate: 10, mfnEnabled: false, proRataEnabled: false }, { pricePerShare: "1", companyCapitalization: "abc" })).toThrow();
  });
  it("keeps note total above principal", () => {
    const result = calculateNoteAccrual("1000", 8, new Date("2025-01-01"), new Date("2025-06-01"));
    expect(Number(result.total)).toBeGreaterThan(1000);
  });
  it("returns elapsed days as number", () => {
    const result = calculateNoteAccrual("1000", 8, new Date("2025-01-01"), new Date("2025-01-31"));
    expect(typeof result.daysElapsed).toBe("number");
  });
  it("returns interest string", () => {
    const result = calculateNoteAccrual("1000", 8, new Date("2025-01-01"), new Date("2025-01-31"));
    expect(typeof result.interest).toBe("string");
  });
  it("returns total string", () => {
    const result = calculateNoteAccrual("1000", 8, new Date("2025-01-01"), new Date("2025-01-31"));
    expect(typeof result.total).toBe("string");
  });
  it("keeps ownership fields formatted", () => {
    const result = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(result.investorOwnershipPercent).toMatch(/^\d+\.\d{4}$/);
    expect(result.optionPoolPercent).toMatch(/^\d+\.\d{4}$/);
    expect(result.existingDilutionPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("keeps post-money formatted", () => {
    const result = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(result.postMoneyValuation).toMatch(/^\d+\.\d{2}$/);
  });
  it("keeps positive dilution result", () => {
    const result = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(Number(result.postMoneyValuation)).toBeGreaterThan(0);
  });
});

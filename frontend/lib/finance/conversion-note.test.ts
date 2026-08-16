import { describe, expect, it } from "vitest";
import { calculateNoteAccrual, convertNote } from "./conversion";

const context = { pricePerShare: "1", companyCapitalization: "10000000" };
const note = {
  principal: "100000",
  interestRate: 8,
  maturityDate: "2027-01-01",
  valuationCap: "5000000",
  qualifiedFinancingMin: "1000000",
  maturityTreatment: "CONVERT_AT_CAP" as const,
};

describe("convertible note calculations", () => {
  it("calculates same-day accrual", () => {
    expect(calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-01"))).toEqual({ interest: "0.00", total: "100.00", daysElapsed: 0 });
  });
  it("calculates thirty-day accrual", () => {
    const result = calculateNoteAccrual("100000", 8, new Date("2025-01-01"), new Date("2025-01-31"));
    expect(result.daysElapsed).toBe(30);
    expect(Number(result.total)).toBeGreaterThan(100000);
  });
  it("calculates ninety-day accrual", () => {
    const result = calculateNoteAccrual("100000", 8, new Date("2025-01-01"), new Date("2025-04-01"));
    expect(result.daysElapsed).toBe(90);
  });
  it("calculates annual accrual", () => {
    const result = calculateNoteAccrual("100000", 8, new Date("2025-01-01"), new Date("2026-01-01"));
    expect(result.daysElapsed).toBe(365);
    expect(result.interest).toBe("8000.00");
    expect(result.total).toBe("108000.00");
  });
  it("calculates leap-year accrual", () => {
    const result = calculateNoteAccrual("100000", 8, new Date("2024-01-01"), new Date("2025-01-01"));
    expect(result.daysElapsed).toBe(366);
    expect(Number(result.interest)).toBeGreaterThan(8000);
  });
  it("calculates half-year accrual", () => {
    const result = calculateNoteAccrual("100000", 8, new Date("2025-01-01"), new Date("2025-07-01"));
    expect(result.daysElapsed).toBe(181);
    expect(Number(result.interest)).toBeGreaterThan(0);
  });
  it("calculates one-day accrual", () => {
    const result = calculateNoteAccrual("365", 10, new Date("2025-01-01"), new Date("2025-01-02"));
    expect(result.interest).toBe("0.10");
  });
  it("calculates zero-rate accrual", () => {
    const result = calculateNoteAccrual("1000", 0, new Date("2025-01-01"), new Date("2026-01-01"));
    expect(result.interest).toBe("0.00");
    expect(result.total).toBe("1000.00");
  });
  it("rejects negative principal", () => {
    expect(() => calculateNoteAccrual("-1", 8, new Date("2025-01-01"), new Date("2025-01-02"))).toThrow();
  });
  it("rejects empty principal", () => {
    expect(() => calculateNoteAccrual("", 8, new Date("2025-01-01"), new Date("2025-01-02"))).toThrow();
  });
  it("rejects malformed principal", () => {
    expect(() => calculateNoteAccrual("abc", 8, new Date("2025-01-01"), new Date("2025-01-02"))).toThrow();
  });
  it("rejects negative rate", () => {
    expect(() => calculateNoteAccrual("100", -1, new Date("2025-01-01"), new Date("2025-01-02"))).toThrow();
  });
  it("rejects reversed dates", () => {
    expect(() => calculateNoteAccrual("100", 8, new Date("2025-01-02"), new Date("2025-01-01"))).toThrow();
  });
  it("rejects invalid issue date", () => {
    expect(() => calculateNoteAccrual("100", 8, new Date("bad"), new Date("2025-01-02"))).toThrow();
  });
  it("rejects invalid as-of date", () => {
    expect(() => calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("bad"))).toThrow();
  });
  it("returns numeric days", () => {
    expect(typeof calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02")).daysElapsed).toBe("number");
  });
  it("returns string interest", () => {
    expect(typeof calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02")).interest).toBe("string");
  });
  it("returns string total", () => {
    expect(typeof calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02")).total).toBe("string");
  });
  it("converts note at cap", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.appliedMechanism).toBe("CAP");
    expect(result.sharesIssued).toBe("216000");
  });
  it("converts note at financing price when cap is high", () => {
    const result = convertNote({ ...note, valuationCap: "100000000" }, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.appliedMechanism).toBe("FINANCING_PRICE");
  });
  it("converts note with discount", () => {
    const result = convertNote({ ...note, valuationCap: undefined, discountRate: 20, maturityTreatment: "CONVERT_AT_DISCOUNT" }, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.appliedMechanism).toBe("DISCOUNT");
  });
  it("includes accrued interest", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.totalOwed).toBe("108000.00");
  });
  it("includes principal in total owed", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2025-01-01"), context);
    expect(result.totalOwed).toBe("100000.00");
  });
  it("returns conversion price", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.conversionPrice).toBe("0.5000000000");
  });
  it("returns shares as string", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(typeof result.sharesIssued).toBe("string");
  });
  it("returns positive shares", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(Number(result.sharesIssued)).toBeGreaterThan(0);
  });
  it("rejects negative note principal", () => {
    expect(() => convertNote({ ...note, principal: "-1" }, new Date("2025-01-01"), new Date("2026-01-01"), context)).toThrow();
  });
  it("rejects invalid note rate", () => {
    expect(() => convertNote({ ...note, interestRate: -1 }, new Date("2025-01-01"), new Date("2026-01-01"), context)).toThrow();
  });
  it("rejects invalid note dates", () => {
    expect(() => convertNote(note, new Date("bad"), new Date("2026-01-01"), context)).toThrow();
  });
  it("rejects invalid context price", () => {
    expect(() => convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), { pricePerShare: "bad", companyCapitalization: "10" })).toThrow();
  });
  it("rejects invalid context capitalization", () => {
    expect(() => convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), { pricePerShare: "1", companyCapitalization: "bad" })).toThrow();
  });
  it("keeps result deterministic", () => {
    const first = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    const second = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(first).toEqual(second);
  });
  it("keeps exact day result deterministic", () => {
    const first = convertNote(note, new Date("2025-01-01"), new Date("2025-01-01"), context);
    const second = convertNote(note, new Date("2025-01-01"), new Date("2025-01-01"), context);
    expect(first).toEqual(second);
  });
  it("keeps cap mechanism enumerable", () => {
    expect(["CAP", "DISCOUNT", "CAP_AND_DISCOUNT", "FINANCING_PRICE"]).toContain(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context).appliedMechanism);
  });
  it("formats total owed", () => {
    expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context).totalOwed).toMatch(/^\d+\.\d{2}$/);
  });
  it("formats conversion price", () => {
    expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context).conversionPrice).toMatch(/^\d+\.\d{10}$/);
  });
  it("handles fractional principal", () => {
    const result = convertNote({ ...note, principal: "1000.50" }, new Date("2025-01-01"), new Date("2025-02-01"), context);
    expect(Number(result.totalOwed)).toBeGreaterThan(1000.5);
  });
  it("handles zero rate note", () => {
    const result = convertNote({ ...note, interestRate: 0 }, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.totalOwed).toBe("100000.00");
  });
  it("handles short maturity", () => {
    const result = convertNote({ ...note, maturityDate: "2025-02-01" }, new Date("2025-01-01"), new Date("2025-01-15"), context);
    expect(result.daysElapsed).toBe(14);
  });
  it("handles long accrual", () => {
    const result = convertNote(note, new Date("2020-01-01"), new Date("2025-01-01"), context);
    expect(result.daysElapsed).toBeGreaterThan(1800);
    expect(Number(result.totalOwed)).toBeGreaterThan(100000);
  });
  it("handles small principal", () => {
    const result = convertNote({ ...note, principal: "1" }, new Date("2025-01-01"), new Date("2025-01-02"), context);
    expect(Number(result.totalOwed)).toBeGreaterThan(1);
  });
  it("keeps note output object complete", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result).toEqual(expect.objectContaining({ totalOwed: expect.any(String), conversionPrice: expect.any(String), sharesIssued: expect.any(String), appliedMechanism: expect.any(String), daysElapsed: expect.any(Number) }));
  });
  it("keeps shares finite", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(Number.isFinite(Number(result.sharesIssued))).toBe(true);
  });
  it("keeps total finite", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(Number.isFinite(Number(result.totalOwed))).toBe(true);
  });
  it("keeps price finite", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(Number.isFinite(Number(result.conversionPrice))).toBe(true);
  });
  it("keeps elapsed days non-negative", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.daysElapsed).toBeGreaterThanOrEqual(0);
  });
  it("keeps applied mechanism non-empty", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(result.appliedMechanism.length).toBeGreaterThan(0);
  });
  it("keeps note conversion positive", () => {
    const result = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(Number(result.sharesIssued)).toBeGreaterThan(0);
  });
  it("keeps note conversion repeatable", () => {
    const first = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context);
    expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), context)).toEqual(first);
  });
});

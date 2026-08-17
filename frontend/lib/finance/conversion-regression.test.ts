import { describe, expect, it } from "vitest";
import { calculateDilution, calculateNoteAccrual, calculatePricePerShare, convertNote, convertPostMoneySafe } from "./conversion";

const financing = { pricePerShare: "1", companyCapitalization: "10000000" };
const safe = { type: "POST_MONEY_VALUATION_CAP" as const, purchaseAmount: "100000", valuationCap: "5000000", mfnEnabled: false, proRataEnabled: false };
const note = { principal: "100000", interestRate: 8, maturityDate: "2027-01-01", valuationCap: "5000000", qualifiedFinancingMin: "1000000", maturityTreatment: "CONVERT_AT_CAP" as const };

describe("conversion regression matrix", () => {
  it("safe amount", () => expect(convertPostMoneySafe(safe, financing).amountConverted).toBe("100000.00"));
  it("safe price", () => expect(convertPostMoneySafe(safe, financing).conversionPrice).toBe("0.5000000000"));
  it("safe shares", () => expect(convertPostMoneySafe(safe, financing).sharesIssued).toBe("200000"));
  it("safe mechanism", () => expect(convertPostMoneySafe(safe, financing).appliedMechanism).toBe("CAP"));
  it("safe discount", () => expect(convertPostMoneySafe({ ...safe, valuationCap: undefined, type: "POST_MONEY_DISCOUNT", discountRate: 20 }, financing).appliedMechanism).toBe("DISCOUNT"));
  it("safe financing", () => expect(convertPostMoneySafe({ ...safe, valuationCap: undefined }, financing).appliedMechanism).toBe("FINANCING_PRICE"));
  it("safe cap tie", () => expect(convertPostMoneySafe({ ...safe, valuationCap: "8000000", type: "POST_MONEY_CAP_AND_DISCOUNT", discountRate: 20 }, { pricePerShare: "1", companyCapitalization: "10000000" }).conversionPrice).toBe("0.8000000000"));
  it("safe minimum price", () => expect(Number(convertPostMoneySafe(safe, financing).conversionPrice)).toBeLessThan(1));
  it("safe positive shares", () => expect(Number(convertPostMoneySafe(safe, financing).sharesIssued)).toBeGreaterThan(0));
  it("safe string amount", () => expect(typeof convertPostMoneySafe(safe, financing).amountConverted).toBe("string"));
  it("safe string price", () => expect(typeof convertPostMoneySafe(safe, financing).conversionPrice).toBe("string"));
  it("safe string shares", () => expect(typeof convertPostMoneySafe(safe, financing).sharesIssued).toBe("string"));
  it("safe cap changes shares", () => expect(convertPostMoneySafe({ ...safe, valuationCap: "2500000" }, financing).sharesIssued).toBe("400000"));
  it("safe discount changes shares", () => expect(convertPostMoneySafe({ ...safe, valuationCap: undefined, type: "POST_MONEY_DISCOUNT", discountRate: 50 }, financing).sharesIssued).toBe("200000"));
  it("safe zero discount ignored", () => expect(convertPostMoneySafe({ ...safe, valuationCap: undefined, type: "POST_MONEY_DISCOUNT", discountRate: 0 }, financing).appliedMechanism).toBe("FINANCING_PRICE"));
  it("safe negative discount ignored", () => expect(convertPostMoneySafe({ ...safe, valuationCap: undefined, type: "POST_MONEY_DISCOUNT", discountRate: -5 }, financing).appliedMechanism).toBe("FINANCING_PRICE"));
  it("safe discount guard", () => expect(() => convertPostMoneySafe({ ...safe, valuationCap: undefined, type: "POST_MONEY_DISCOUNT", discountRate: 100 }, financing)).toThrow("Discount rate"));
  it("safe purchase guard", () => expect(() => convertPostMoneySafe({ ...safe, purchaseAmount: "0" }, financing)).toThrow("Purchase amount"));
  it("safe price guard", () => expect(() => convertPostMoneySafe(safe, { pricePerShare: "0", companyCapitalization: "10" })).toThrow("Financing price"));
  it("safe cap guard", () => expect(() => convertPostMoneySafe(safe, { pricePerShare: "1", companyCapitalization: "0" })).toThrow("capitalization"));
  it("accrual zero", () => expect(calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-01")).total).toBe("100.00"));
  it("accrual day", () => expect(calculateNoteAccrual("365", 10, new Date("2025-01-01"), new Date("2025-01-02")).interest).toBe("0.10"));
  it("accrual month days", () => expect(calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-02-01")).daysElapsed).toBe(31));
  it("accrual year days", () => expect(calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2026-01-01")).daysElapsed).toBe(365));
  it("accrual interest", () => expect(calculateNoteAccrual("100000", 8, new Date("2025-01-01"), new Date("2026-01-01")).interest).toBe("8000.00"));
  it("accrual total", () => expect(calculateNoteAccrual("100000", 8, new Date("2025-01-01"), new Date("2026-01-01")).total).toBe("108000.00"));
  it("accrual zero rate", () => expect(calculateNoteAccrual("100", 0, new Date("2025-01-01"), new Date("2026-01-01")).interest).toBe("0.00"));
  it("accrual reverse guard", () => expect(() => calculateNoteAccrual("100", 8, new Date("2025-02-01"), new Date("2025-01-01"))).toThrow("asOfDate"));
  it("accrual negative principal arithmetic", () => expect(calculateNoteAccrual("-100", 8, new Date("2025-01-01"), new Date("2025-01-02")).total).toBe("-100.02"));
  it("accrual negative rate arithmetic", () => expect(calculateNoteAccrual("100", -8, new Date("2025-01-01"), new Date("2025-01-02")).total).toBe("99.98"));
  it("accrual string interest", () => expect(typeof calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02")).interest).toBe("string"));
  it("accrual string total", () => expect(typeof calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02")).total).toBe("string"));
  it("note amount", () => expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing).amountConverted).toBe("108000.00"));
  it("note price", () => expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing).conversionPrice).toBe("0.5000000000"));
  it("note shares", () => expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing).sharesIssued).toBe("216000"));
  it("note mechanism", () => expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing).appliedMechanism).toBe("CAP"));
  it("note financing mechanism", () => expect(convertNote({ ...note, valuationCap: "100000000" }, new Date("2025-01-01"), new Date("2026-01-01"), financing).appliedMechanism).toBe("FINANCING_PRICE"));
  it("note discount mechanism", () => expect(convertNote({ ...note, valuationCap: undefined, discountRate: 20, maturityTreatment: "REPAY" }, new Date("2025-01-01"), new Date("2026-01-01"), financing).appliedMechanism).toBe("DISCOUNT"));
  it("note negative guard", () => expect(() => convertNote({ ...note, principal: "-1" }, new Date("2025-01-01"), new Date("2026-01-01"), financing)).toThrow("Purchase amount"));
  it("note positive shares", () => expect(Number(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing).sharesIssued)).toBeGreaterThan(0));
  it("note string amount", () => expect(typeof convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing).amountConverted).toBe("string"));
  it("note deterministic", () => expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing)).toEqual(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing)));
  it("price simple", () => expect(calculatePricePerShare("100", "10")).toBe("10.0000000000"));
  it("price fractional", () => expect(calculatePricePerShare("10", "3")).toBe("3.3333333333"));
  it("price large", () => expect(calculatePricePerShare("1000000000", "1000000")).toBe("1000.0000000000"));
  it("price decimal", () => expect(calculatePricePerShare("10", "2.5")).toBe("4.0000000000"));
  it("price string", () => expect(typeof calculatePricePerShare("100", "10")).toBe("string"));
  it("price format", () => expect(calculatePricePerShare("100", "10")).toMatch(/^\d+\.\d{10}$/));
  it("dilution post money", () => expect(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 }).postMoneyValuation).toBe("1100.00"));
  it("dilution investor", () => expect(calculateDilution({ preMoneyValuation: "9000", investmentAmount: "1000", optionPoolPostMoneyPercent: 0 }).investorOwnershipPercent).toBe("10.0000"));
  it("dilution pool", () => expect(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 }).optionPoolPercent).toBe("10.0000"));
  it("dilution existing", () => expect(calculateDilution({ preMoneyValuation: "9000", investmentAmount: "1000", optionPoolPostMoneyPercent: 0 }).existingDilutionPercent).toBe("90.0000"));
  it("dilution sum", () => { const value = calculateDilution({ preMoneyValuation: "8000", investmentAmount: "2000", optionPoolPostMoneyPercent: 10 }); expect(Number(value.investorOwnershipPercent) + Number(value.optionPoolPercent) + Number(value.existingDilutionPercent)).toBeCloseTo(100, 4); });
  it("dilution zero investment", () => expect(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "0", optionPoolPostMoneyPercent: 0 }).investorOwnershipPercent).toBe("0.0000"));
  it("dilution zero pool", () => expect(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 0 }).optionPoolPercent).toBe("0.0000"));
  it("dilution decimals", () => expect(calculateDilution({ preMoneyValuation: "1.5", investmentAmount: "0.5", optionPoolPostMoneyPercent: 0 }).postMoneyValuation).toBe("2.00"));
  it("dilution string fields", () => expect(typeof calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 0 }).existingDilutionPercent).toBe("string"));
  it("dilution deterministic", () => expect(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 })).toEqual(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 })));
  it("dilution large", () => expect(Number(calculateDilution({ preMoneyValuation: "1000000000000", investmentAmount: "100000000000", optionPoolPostMoneyPercent: 10 }).postMoneyValuation)).toBeGreaterThan(1000000000000));
  it("dilution finite", () => expect(Number.isFinite(Number(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 }).postMoneyValuation))).toBe(true));
  it("dilution percentages formatted", () => expect(calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 }).investorOwnershipPercent).toMatch(/^\d+\.\d{4}$/));
  it("price repeatable", () => expect(calculatePricePerShare("100", "10")).toBe(calculatePricePerShare("100", "10")));
  it("safe cap object", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(value).toEqual(expect.objectContaining({ conversionPrice: expect.any(String) }));
  });
  it("safe amount formatting", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(value.amountConverted).toMatch(/^\d+\.\d{2}$/);
  });
  it("safe price formatting", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(value.conversionPrice).toMatch(/^\d+\.\d{10}$/);
  });
  it("safe shares formatting", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(value.sharesIssued).toMatch(/^\d+$/);
  });
  it("accrual object", () => {
    const value = calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02"));
    expect(value).toEqual(expect.objectContaining({ interest: expect.any(String), total: expect.any(String) }));
  });
  it("accrual interest formatting", () => {
    const value = calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02"));
    expect(value.interest).toMatch(/^\d+\.\d{2}$/);
  });
  it("accrual total formatting", () => {
    const value = calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02"));
    expect(value.total).toMatch(/^\d+\.\d{2}$/);
  });
  it("accrual day count integer", () => {
    const value = calculateNoteAccrual("100", 8, new Date("2025-01-01"), new Date("2025-01-02"));
    expect(Number.isInteger(value.daysElapsed)).toBe(true);
  });
  it("note object", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(value).toEqual(expect.objectContaining({ amountConverted: expect.any(String), sharesIssued: expect.any(String) }));
  });
  it("note amount formatting", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(value.amountConverted).toMatch(/^\d+\.\d{2}$/);
  });
  it("note price formatting", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(value.conversionPrice).toMatch(/^\d+\.\d{10}$/);
  });
  it("note shares formatting", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(value.sharesIssued).toMatch(/^\d+$/);
  });
  it("note cap is lower", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(Number(value.conversionPrice)).toBeLessThan(1);
  });
  it("dilution object", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(value).toEqual(expect.objectContaining({ postMoneyValuation: expect.any(String) }));
  });
  it("dilution post-money format", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(value.postMoneyValuation).toMatch(/^\d+\.\d{2}$/);
  });
  it("dilution investor format", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(value.investorOwnershipPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("dilution pool format", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(value.optionPoolPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("dilution existing format", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(value.existingDilutionPercent).toMatch(/^\d+\.\d{4}$/);
  });
  it("price positive", () => {
    const value = calculatePricePerShare("1000", "100");
    expect(Number(value)).toBeGreaterThan(0);
  });
  it("price finite", () => {
    const value = calculatePricePerShare("1000", "100");
    expect(Number.isFinite(Number(value))).toBe(true);
  });
  it("price decimal string", () => {
    const value = calculatePricePerShare("1000", "100");
    expect(typeof value).toBe("string");
  });
  it("safe mechanism string", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(typeof value.appliedMechanism).toBe("string");
  });
  it("note mechanism string", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(typeof value.appliedMechanism).toBe("string");
  });
  it("safe amount positive", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(Number(value.amountConverted)).toBeGreaterThan(0);
  });
  it("note amount positive", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(Number(value.amountConverted)).toBeGreaterThan(0);
  });
  it("safe shares finite", () => {
    const value = convertPostMoneySafe(safe, financing);
    expect(Number.isFinite(Number(value.sharesIssued))).toBe(true);
  });
  it("note shares finite", () => {
    const value = convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing);
    expect(Number.isFinite(Number(value.sharesIssued))).toBe(true);
  });
  it("dilution percentages finite", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(Number.isFinite(Number(value.investorOwnershipPercent))).toBe(true);
  });
  it("dilution pool finite", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(Number.isFinite(Number(value.optionPoolPercent))).toBe(true);
  });
  it("dilution existing finite", () => {
    const value = calculateDilution({ preMoneyValuation: "1000", investmentAmount: "100", optionPoolPostMoneyPercent: 10 });
    expect(Number.isFinite(Number(value.existingDilutionPercent))).toBe(true);
  });
  it("safe result repeatable", () => {
    expect(convertPostMoneySafe(safe, financing)).toEqual(convertPostMoneySafe(safe, financing));
  });
  it("note result repeatable", () => {
    expect(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing)).toEqual(convertNote(note, new Date("2025-01-01"), new Date("2026-01-01"), financing));
  });
  it("price result repeatable", () => {
    expect(calculatePricePerShare("100", "10")).toBe(calculatePricePerShare("100", "10"));
  });
  it("dilution result repeatable", () => {
    const value = calculateDilution({ preMoneyValuation: "100", investmentAmount: "10", optionPoolPostMoneyPercent: 10 });
    expect(value).toEqual(calculateDilution({ preMoneyValuation: "100", investmentAmount: "10", optionPoolPostMoneyPercent: 10 }));
  });
});

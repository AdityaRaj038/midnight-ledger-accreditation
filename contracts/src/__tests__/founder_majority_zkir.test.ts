import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "src/managed/founder_majority/zkir");

describe("founder majority ZKIR files", () => {
  it("contains executable text circuits", () => {
    for (const circuit of ["is_currently_valid", "publish_proof"]) {
      const source = readFileSync(resolve(root, `${circuit}.zkir`), "utf8");
      expect(source.length).toBeGreaterThan(0);
      expect(source).toMatch(/[A-Za-z0-9]/);
    }
  });

  it("contains binary circuit payloads", () => {
    for (const circuit of ["is_currently_valid", "publish_proof"]) {
      const payload = readFileSync(resolve(root, `${circuit}.bzkir`));
      expect(payload.byteLength).toBeGreaterThan(0);
      expect(new Set(payload.values()).size).toBeGreaterThan(1);
    }
  });
});

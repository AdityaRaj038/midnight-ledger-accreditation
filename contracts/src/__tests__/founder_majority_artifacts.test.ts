import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "src/managed/founder_majority");
const circuits = ["is_currently_valid", "publish_proof"] as const;
const artifacts = [
  ["keys", ".prover"],
  ["keys", ".verifier"],
  ["zkir", ".zkir"],
  ["zkir", ".bzkir"],
] as const;

function fileFor(circuit: string, folder: string, suffix: string) {
  return resolve(root, folder, `${circuit}${suffix}`);
}

function bytesFor(circuit: string, folder: string, suffix: string) {
  const file = fileFor(circuit, folder, suffix);
  expect(existsSync(file), `missing ${file}`).toBe(true);
  expect(statSync(file).isFile()).toBe(true);
  return readFileSync(file);
}

describe("generated founder majority artifact set", () => {
  it("contains compiler metadata", () => {
    const metadata = JSON.parse(readFileSync(resolve(root, "compiler/contract-info.json"), "utf8")) as Record<string, unknown>;
    expect(metadata).toEqual(expect.objectContaining({
      contractName: expect.any(String),
      circuits: expect.any(Object),
    }));
  });

  it("contains generated binding", () => {
    const declaration = readFileSync(resolve(root, "contract/index.d.ts"), "utf8");
    const implementation = readFileSync(resolve(root, "contract/index.js"), "utf8");
    expect(declaration).toContain("Contract");
    expect(implementation).toContain("publish_proof");
    expect(implementation).toContain("is_currently_valid");
  });

  it("enumerates only known circuits", () => {
    expect([...circuits]).toEqual(["is_currently_valid", "publish_proof"]);
  });

  it.each(circuits)("contains prover key for %s", (circuit) => {
    expect(bytesFor(circuit, "keys", ".prover").byteLength).toBeGreaterThan(100);
  });

  it.each(circuits)("contains verifier key for %s", (circuit) => {
    expect(bytesFor(circuit, "keys", ".verifier").byteLength).toBeGreaterThan(0);
  });

  it.each(circuits)("contains text ZKIR for %s", (circuit) => {
    const bytes = bytesFor(circuit, "zkir", ".zkir");
    expect(new TextDecoder("utf-8", { fatal: true }).decode(bytes).length).toBeGreaterThan(0);
  });

  it.each(circuits)("contains binary ZKIR for %s", (circuit) => {
    expect(bytesFor(circuit, "zkir", ".bzkir").byteLength).toBeGreaterThan(0);
  });

  it("has complete artifact matrix", () => {
    for (const circuit of circuits) {
      for (const [folder, suffix] of artifacts) {
        expect(existsSync(fileFor(circuit, folder, suffix))).toBe(true);
      }
    }
  });

  it("keeps proving and verification key bytes distinct", () => {
    for (const circuit of circuits) {
      expect(bytesFor(circuit, "keys", ".prover").equals(bytesFor(circuit, "keys", ".verifier"))).toBe(false);
    }
  });

  it("keeps ZKIR encodings distinct", () => {
    for (const circuit of circuits) {
      expect(bytesFor(circuit, "zkir", ".zkir").equals(bytesFor(circuit, "zkir", ".bzkir"))).toBe(false);
    }
  });

  it("uses safe circuit basenames", () => {
    for (const circuit of circuits) {
      expect(circuit).toMatch(/^[a-z_]+$/);
      expect(circuit.includes("..")).toBe(false);
      expect(circuit.includes("/")).toBe(false);
      expect(circuit.includes("\\")).toBe(false);
    }
  });

  it("keeps paths in founder majority managed output", () => {
    for (const circuit of circuits) {
      for (const [folder, suffix] of artifacts) {
        expect(fileFor(circuit, folder, suffix)).toContain("founder_majority");
      }
    }
  });

  it("contains public control circuit marker", () => {
    const implementation = readFileSync(resolve(root, "contract/index.js"), "utf8");
    expect(implementation).toContain("proof_threshold");
    expect(implementation).toContain("last_proof_valid");
    expect(implementation).toContain("proof_count");
  });

  it("contains witness circuit marker", () => {
    const declaration = readFileSync(resolve(root, "contract/index.d.ts"), "utf8");
    expect(declaration).toContain("founder_shares");
    expect(declaration).toContain("total_diluted_shares");
  });

  it("checks every file is regular", () => {
    for (const circuit of circuits) {
      for (const [folder, suffix] of artifacts) {
        expect(statSync(fileFor(circuit, folder, suffix)).isFile()).toBe(true);
      }
    }
  });

  it("checks generated source map", () => {
    const sourceMap = JSON.parse(readFileSync(resolve(root, "contract/index.js.map"), "utf8")) as Record<string, unknown>;
    expect(sourceMap).toEqual(expect.objectContaining({ version: expect.any(Number) }));
  });

  it("checks contract binding exports constructor", () => {
    const implementation = readFileSync(resolve(root, "contract/index.js"), "utf8");
    expect(implementation).toMatch(/export|module\.exports/);
    expect(implementation).toContain("Contract");
  });

  it("checks key files exceed empty artifact size", () => {
    for (const circuit of circuits) {
      expect(statSync(fileFor(circuit, "keys", ".prover")).size).toBeGreaterThan(100);
      expect(statSync(fileFor(circuit, "keys", ".verifier")).size).toBeGreaterThan(0);
    }
  });

  it("checks source and binary ZKIR exist together", () => {
    for (const circuit of circuits) {
      expect(existsSync(fileFor(circuit, "zkir", ".zkir"))).toBe(true);
      expect(existsSync(fileFor(circuit, "zkir", ".bzkir"))).toBe(true);
    }
  });

  it("checks artifact extension matrix", () => {
    expect(artifacts.map(([folder, suffix]) => `${folder}/${suffix}`)).toEqual([
      "keys/.prover",
      "keys/.verifier",
      "zkir/.zkir",
      "zkir/.bzkir",
    ]);
  });

  it("checks public circuit names are represented in implementation", () => {
    const implementation = readFileSync(resolve(root, "contract/index.js"), "utf8");
    for (const circuit of circuits) expect(implementation).toContain(circuit);
  });

  it("checks artifact count per circuit", () => {
    for (const circuit of circuits) {
      const present = artifacts.filter(([folder, suffix]) => existsSync(fileFor(circuit, folder, suffix)));
      expect(present).toHaveLength(4);
    }
  });

  it("checks metadata names founder contract", () => {
    const metadata = JSON.parse(readFileSync(resolve(root, "compiler/contract-info.json"), "utf8")) as Record<string, unknown>;
    expect(String(metadata.contractName)).toMatch(/founder|majority/i);
  });

  it("checks declaration has public proof methods", () => {
    const declaration = readFileSync(resolve(root, "contract/index.d.ts"), "utf8");
    expect(declaration).toContain("publish_proof");
    expect(declaration).toContain("is_currently_valid");
  });

  it("checks generated files have stable basename", () => {
    for (const circuit of circuits) {
      for (const [folder, suffix] of artifacts) {
        expect(fileFor(circuit, folder, suffix).split(/[\\/]/).at(-1)).toBe(`${circuit}${suffix}`);
      }
    }
  });

  it("checks key bytes contain more than one byte value", () => {
    for (const circuit of circuits) {
      for (const suffix of [".prover", ".verifier"] as const) {
        expect(new Set(bytesFor(circuit, "keys", suffix).values()).size).toBeGreaterThan(1);
      }
    }
  });

  it("checks ZKIR bytes contain more than one byte value", () => {
    for (const circuit of circuits) {
      for (const suffix of [".zkir", ".bzkir"] as const) {
        expect(new Set(bytesFor(circuit, "zkir", suffix).values()).size).toBeGreaterThan(1);
      }
    }
  });

  it("checks no artifact path escapes managed directory", () => {
    for (const circuit of circuits) {
      for (const [folder, suffix] of artifacts) {
        expect(fileFor(circuit, folder, suffix).startsWith(root)).toBe(true);
      }
    }
  });

  it("checks each public circuit has matching generated files", () => {
    const implementation = readFileSync(resolve(root, "contract/index.js"), "utf8");
    for (const circuit of circuits) {
      expect(implementation).toContain(circuit);
      expect(artifacts.every(([folder, suffix]) => existsSync(fileFor(circuit, folder, suffix)))).toBe(true);
    }
  });

  it("checks artifact folders are named correctly", () => {
    expect(artifacts.map(([folder]) => folder)).toEqual(["keys", "keys", "zkir", "zkir"]);
    expect(artifacts.map(([, suffix]) => suffix)).toEqual([".prover", ".verifier", ".zkir", ".bzkir"]);
  });

  it("checks is_currently_valid proof artifacts", () => {
    expect(bytesFor("is_currently_valid", "keys", ".prover").byteLength).toBeGreaterThan(100);
    expect(bytesFor("is_currently_valid", "keys", ".verifier").byteLength).toBeGreaterThan(0);
    expect(bytesFor("is_currently_valid", "zkir", ".zkir").byteLength).toBeGreaterThan(0);
    expect(bytesFor("is_currently_valid", "zkir", ".bzkir").byteLength).toBeGreaterThan(0);
  });

  it("checks publish_proof artifacts", () => {
    expect(bytesFor("publish_proof", "keys", ".prover").byteLength).toBeGreaterThan(100);
    expect(bytesFor("publish_proof", "keys", ".verifier").byteLength).toBeGreaterThan(0);
    expect(bytesFor("publish_proof", "zkir", ".zkir").byteLength).toBeGreaterThan(0);
    expect(bytesFor("publish_proof", "zkir", ".bzkir").byteLength).toBeGreaterThan(0);
  });
});

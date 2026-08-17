import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "src/managed/accreditation");

const circuits = [
  "check_still_valid",
  "prove_by_income",
  "prove_by_net_worth",
  "revoke",
] as const;

const artifactKinds = [
  { folder: "keys", suffix: ".prover" },
  { folder: "keys", suffix: ".verifier" },
  { folder: "zkir", suffix: ".zkir" },
  { folder: "zkir", suffix: ".bzkir" },
] as const;

function artifactPath(folder: string, circuit: string, suffix: string) {
  return resolve(root, folder, `${circuit}${suffix}`);
}

function readArtifact(folder: string, circuit: string, suffix: string) {
  const file = artifactPath(folder, circuit, suffix);
  expect(existsSync(file), `missing artifact: ${file}`).toBe(true);
  const stats = statSync(file);
  expect(stats.isFile(), `artifact is not a file: ${file}`).toBe(true);
  expect(stats.size, `artifact is empty: ${file}`).toBeGreaterThan(0);
  return readFileSync(file);
}

describe("generated accreditation artifact set", () => {
  it("contains compiler metadata", () => {
    const file = resolve(root, "compiler", "contract-info.json");
    expect(existsSync(file)).toBe(true);
    const metadata = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    expect(metadata).toEqual(expect.objectContaining({
      "compiler-version": expect.any(String),
      circuits: expect.any(Array),
    }));
  });

  it("contains generated TypeScript contract binding", () => {
    const declaration = resolve(root, "contract", "index.d.ts");
    const implementation = resolve(root, "contract", "index.js");
    const sourceMap = resolve(root, "contract", "index.js.map");
    expect(existsSync(declaration)).toBe(true);
    expect(existsSync(implementation)).toBe(true);
    expect(existsSync(sourceMap)).toBe(true);
    expect(readFileSync(declaration, "utf8")).toContain("Contract");
    expect(readFileSync(implementation, "utf8")).toContain("prove_by_income");
  });

  it("contains every expected circuit", () => {
    for (const circuit of circuits) {
      expect(circuit).toMatch(/^[a-z_]+$/);
    }
    expect(circuits).toHaveLength(4);
  });

  it.each(circuits)("contains prover key for %s", (circuit) => {
    const bytes = readArtifact("keys", circuit, ".prover");
    expect(bytes.byteLength).toBeGreaterThan(100);
  });

  it.each(circuits)("contains verifier key for %s", (circuit) => {
    const bytes = readArtifact("keys", circuit, ".verifier");
    expect(bytes.byteLength).toBeGreaterThan(100);
  });

  it.each(circuits)("contains binary ZKIR for %s", (circuit) => {
    const bytes = readArtifact("zkir", circuit, ".bzkir");
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it.each(circuits)("contains text ZKIR for %s", (circuit) => {
    const bytes = readArtifact("zkir", circuit, ".zkir");
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("does not contain a generated artifact with a missing companion", () => {
    for (const circuit of circuits) {
      for (const kind of artifactKinds) {
        expect(existsSync(artifactPath(kind.folder, circuit, kind.suffix))).toBe(true);
      }
    }
  });

  it("keeps prover and verifier artifacts distinct", () => {
    for (const circuit of circuits) {
      const prover = readArtifact("keys", circuit, ".prover");
      const verifier = readArtifact("keys", circuit, ".verifier");
      expect(prover.equals(verifier)).toBe(false);
    }
  });

  it("keeps binary and text ZKIR artifacts distinct", () => {
    for (const circuit of circuits) {
      const binary = readArtifact("zkir", circuit, ".bzkir");
      const text = readArtifact("zkir", circuit, ".zkir");
      expect(binary.equals(text)).toBe(false);
    }
  });

  it("includes threshold circuit names in generated binding", () => {
    const implementation = readFileSync(resolve(root, "contract", "index.js"), "utf8");
    expect(implementation).toContain("prove_by_income");
    expect(implementation).toContain("prove_by_net_worth");
    expect(implementation).toContain("check_still_valid");
    expect(implementation).toContain("revoke");
  });

  it("keeps artifact paths scoped to accreditation managed output", () => {
    expect(root.endsWith("managed\\accreditation") || root.endsWith("managed/accreditation")).toBe(true);
    for (const circuit of circuits) {
      for (const kind of artifactKinds) {
        expect(artifactPath(kind.folder, circuit, kind.suffix)).toContain("accreditation");
      }
    }
  });

  it("checks every artifact has stable basename", () => {
    for (const circuit of circuits) {
      for (const kind of artifactKinds) {
        const path = artifactPath(kind.folder, circuit, kind.suffix);
        expect(path.split(/[\\/]/).at(-1)).toBe(`${circuit}${kind.suffix}`);
      }
    }
  });

  it("checks every prover key has binary content", () => {
    for (const circuit of circuits) {
      const bytes = readArtifact("keys", circuit, ".prover");
      const unique = new Set(bytes.values());
      expect(unique.size).toBeGreaterThan(1);
    }
  });

  it("checks every verifier key has binary content", () => {
    for (const circuit of circuits) {
      const bytes = readArtifact("keys", circuit, ".verifier");
      const unique = new Set(bytes.values());
      expect(unique.size).toBeGreaterThan(1);
    }
  });

  it("checks every binary ZKIR has binary content", () => {
    for (const circuit of circuits) {
      const bytes = readArtifact("zkir", circuit, ".bzkir");
      const unique = new Set(bytes.values());
      expect(unique.size).toBeGreaterThan(1);
    }
  });

  it("checks every text ZKIR decodes as UTF-8", () => {
    for (const circuit of circuits) {
      const bytes = readArtifact("zkir", circuit, ".zkir");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("checks no circuit name contains a path separator", () => {
    for (const circuit of circuits) {
      expect(circuit.includes("/")).toBe(false);
      expect(circuit.includes("\\")).toBe(false);
      expect(circuit.includes("..")).toBe(false);
    }
  });

  it("checks generated files are regular files", () => {
    for (const circuit of circuits) {
      for (const kind of artifactKinds) {
        expect(statSync(artifactPath(kind.folder, circuit, kind.suffix)).isFile()).toBe(true);
      }
    }
  });

  it("checks compiler metadata has a version", () => {
    const file = resolve(root, "compiler", "contract-info.json");
    const metadata = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    expect(metadata).toEqual(expect.objectContaining({ "compiler-version": expect.any(String) }));
  });

  it("checks generated binding exports contract constructor", () => {
    const implementation = readFileSync(resolve(root, "contract", "index.js"), "utf8");
    expect(implementation).toMatch(/export|module\.exports/);
    expect(implementation).toContain("Contract");
  });

  it("checks generated declaration exports witness-aware contract", () => {
    const declaration = readFileSync(resolve(root, "contract", "index.d.ts"), "utf8");
    expect(declaration).toContain("Contract");
    expect(declaration).toContain("prove_by_income");
    expect(declaration).toContain("prove_by_net_worth");
  });

  it("checks source map is non-empty JSON", () => {
    const sourceMap = resolve(root, "contract", "index.js.map");
    const parsed = JSON.parse(readFileSync(sourceMap, "utf8")) as Record<string, unknown>;
    expect(parsed).toEqual(expect.objectContaining({ version: expect.any(Number) }));
  });

  it("checks all expected artifact kinds are enumerated", () => {
    expect(artifactKinds.map((kind) => `${kind.folder}/${kind.suffix}`)).toEqual([
      "keys/.prover",
      "keys/.verifier",
      "zkir/.zkir",
      "zkir/.bzkir",
    ]);
  });

  it("checks all expected circuits are enumerated", () => {
    expect([...circuits]).toEqual([
      "check_still_valid",
      "prove_by_income",
      "prove_by_net_worth",
      "revoke",
    ]);
  });

  it("checks each circuit has four generated artifact classes", () => {
    for (const circuit of circuits) {
      const present = artifactKinds.filter((kind) => existsSync(artifactPath(kind.folder, circuit, kind.suffix)));
      expect(present).toHaveLength(4);
    }
  });
});

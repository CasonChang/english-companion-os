import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("packaged schema", () => { it("stays identical to the canonical shared schema", () => { const packaged=JSON.parse(readFileSync(new URL("../schema/session.schema.json", import.meta.url),"utf8")); const canonical=JSON.parse(readFileSync(new URL("../../../../shared/schemas/session.schema.json", import.meta.url),"utf8")); expect(packaged).toEqual(canonical); }); });

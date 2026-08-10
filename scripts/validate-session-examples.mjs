import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const schemaUrl = new URL("../shared/schemas/session.schema.json", import.meta.url);
const examplesUrl = new URL("../shared/schemas/examples/", import.meta.url);

const readJson = async (url) => JSON.parse(await readFile(url, "utf8"));

const schema = await readJson(schemaUrl);
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const fixtures = [
  { file: "session-valid.json", valid: true },
  {
    file: "session-invalid-missing-summary.json",
    valid: false,
    expected: { keyword: "required", missingProperty: "session_summary" }
  },
  {
    file: "session-invalid-learning-item-type.json",
    valid: false,
    expected: { keyword: "enum", instancePath: "/learning_items/0/type" }
  },
  {
    file: "session-invalid-duration-type.json",
    valid: false,
    expected: { keyword: "type", instancePath: "/duration_minutes" }
  }
];

for (const fixture of fixtures) {
  const data = await readJson(new URL(fixture.file, examplesUrl));
  const isValid = validate(data);

  if (fixture.valid) {
    assert.equal(isValid, true, `${fixture.file} should be valid: ${JSON.stringify(validate.errors)}`);
    console.log(`PASS ${fixture.file}`);
    continue;
  }

  assert.equal(isValid, false, `${fixture.file} should be invalid`);
  const matchingError = validate.errors?.some((error) =>
    Object.entries(fixture.expected).every(([key, value]) =>
      key === "missingProperty" ? error.params.missingProperty === value : error[key] === value
    )
  );
  assert.equal(
    matchingError,
    true,
    `${fixture.file} did not fail for the expected reason: ${JSON.stringify(validate.errors)}`
  );
  console.log(`PASS ${fixture.file} rejected as expected`);
}

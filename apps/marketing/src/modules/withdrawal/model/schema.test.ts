import assert from "node:assert/strict";
import { test } from "vitest";

import { checkWithdrawalValues } from "./schema";
import { multiLine, singleLine } from "./text";

// Synthetic data only.
const valid = {
  name: "Erika Beispiel",
  email: "erika@example.com",
  contract: "Gebuchter Termin am 24.11.2026",
  note: "",
};

test("a complete declaration passes, cleaned", () => {
  assert.deepEqual(
    checkWithdrawalValues({
      ...valid,
      name: "  Erika   Beispiel ",
      note: "Bitte bestätigen.\r\n\r\n\r\n\r\nDanke",
    }),
    {
      ok: true,
      declaration: {
        ...valid,
        note: "Bitte bestätigen.\n\nDanke",
      },
    },
  );
});

test("the required fields are named in form order when missing", () => {
  assert.deepEqual(checkWithdrawalValues({ note: "nur eine Ergänzung" }), {
    ok: false,
    fields: ["name", "email", "contract"],
  });
  assert.deepEqual(checkWithdrawalValues({ ...valid, contract: "  \n " }), {
    ok: false,
    fields: ["contract"],
  });
});

test("the optional note may be absent", () => {
  const { note: _note, ...withoutNote } = valid;
  assert.deepEqual(checkWithdrawalValues(withoutNote), {
    ok: true,
    declaration: valid,
  });
});

test("an invalid e-mail address is refused", () => {
  for (const email of ["erika", "erika@example", "er ika@example.com"]) {
    assert.deepEqual(checkWithdrawalValues({ ...valid, email }), {
      ok: false,
      fields: ["email"],
    });
  }
});

test("values beyond their length limit are refused", () => {
  assert.deepEqual(
    checkWithdrawalValues({
      ...valid,
      name: "E".repeat(101),
      contract: "V".repeat(501),
      note: "N".repeat(1001),
    }),
    { ok: false, fields: ["name", "contract", "note"] },
  );
  assert.equal(
    checkWithdrawalValues({
      ...valid,
      name: "E".repeat(100),
      contract: "V".repeat(500),
      note: "N".repeat(1000),
    }).ok,
    true,
  );
});

test("a name that reads like a link is refused", () => {
  for (const name of ["https://spam.example", "www.spam.example", "a://b"]) {
    assert.deepEqual(checkWithdrawalValues({ ...valid, name }), {
      ok: false,
      fields: ["name"],
    });
  }
});

test("values of another shape are invalid fields, never a crash", () => {
  assert.deepEqual(checkWithdrawalValues({ ...valid, name: 42, note: ["x"] }), {
    ok: false,
    fields: ["name", "note"],
  });
  assert.deepEqual(checkWithdrawalValues(null), {
    ok: false,
    fields: ["name", "email", "contract"],
  });
});

test("a single-line value keeps no line break or control character", () => {
  assert.equal(
    singleLine("Erika\r\nBcc: victim@example.com\u0000\u2028x"),
    "Erika Bcc: victim@example.com x",
  );
  assert.equal(singleLine("\tErika\u202E Beispiel\u2066"), "Erika Beispiel");
});

test("a multi-line value keeps line feeds only", () => {
  assert.equal(
    multiLine("Zeile 1\r\nZeile 2\rZeile 3\u0007\u001B[31m\u202Eend\t!"),
    "Zeile 1\nZeile 2\nZeile 3[31mend !",
  );
});

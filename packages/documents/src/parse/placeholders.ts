import { brand, domains, provider } from "../provider.ts";

/**
 * The keys `:value[…]`, `:mailto[…]` and `:tel[…]` accept (spec "Node types
 * and their source", E-13): the shared data of E-12 as `provider.<field>`,
 * `domains.<field>` and `brand.<field>`, plus `document.effectiveDate`, the
 * document's own date as the texts print it.
 */
export function placeholderValues(document: {
  effectiveDateLabel: string;
}): ReadonlyMap<string, string> {
  const shared = { provider, domains, brand };
  return new Map([
    ...Object.entries(shared).flatMap(([group, fields]) =>
      Object.entries(fields).map(([field, value]): [string, string] => [
        `${group}.${field}`,
        value,
      ]),
    ),
    ["document.effectiveDate", document.effectiveDateLabel],
  ]);
}

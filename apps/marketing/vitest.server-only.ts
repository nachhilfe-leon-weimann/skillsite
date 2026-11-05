// Empty stand-in for the `server-only` package in Vitest: outside the
// `react-server` condition its default entry throws, so tests could not import
// a module's server entry (`modules/<name>/server.ts`) otherwise.
export {};

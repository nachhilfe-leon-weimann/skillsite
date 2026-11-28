/**
 * Runs once when a server starts (`next start`, `next dev`), before it serves a
 * request. A present but malformed variable stops the server here, with an
 * `[env]` line naming the variable and its rule; an absent one passes (V6).
 */
export async function register() {
  // The env module is Node-only; this branch is dropped from the Edge build.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { EnvError, missingWithdrawalVariables, parseServerEnv } =
      await import("@/lib/env");
    try {
      const missing = missingWithdrawalVariables(parseServerEnv());
      // Not fatal: `WITHDRAWAL_MAILBOX= just dev` switches the function off on purpose.
      if (missing.length > 0) {
        console.warn(
          `[env] the withdrawal function runs unconfigured: ${missing.join(", ")} not set.`,
        );
      }
    } catch (error) {
      if (!(error instanceof EnvError)) throw error;
      console.error(`[env] ${error.message}`);
      // A throwing register() only fails the requests: Next keeps the server
      // up and answers 500. Exit instead, so it never runs misconfigured.
      process.exit(1);
    }
  }
}

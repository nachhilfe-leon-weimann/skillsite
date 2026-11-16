/**
 * Public, client-safe API of the withdrawal module: the electronic withdrawal
 * function of § 356a BGB. Its server code (the action and the Microsoft Graph
 * mail) is reached only by the form, through `server/actions.ts`; nothing
 * outside the module needs a server entry, so it has no `server.ts`.
 */
export { WithdrawalForm } from "./components/withdrawal-form";

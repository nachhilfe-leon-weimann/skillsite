# Withdrawal mail (Microsoft Graph)

The electronic withdrawal function at `/widerrufsrecht` (§ 356a BGB) sends two plain-text e-mails per confirmed
withdrawal: the acknowledgement to the consumer and a notice to the withdrawal mailbox. It sends them through
Microsoft Graph from that mailbox, with an app-only token (OAuth2 client credentials). This runbook is for the
maintainer; agents never run it, never call Graph and never send a withdrawal against a configured server.

**Temporary.** The function moves to SkillForge (an issue there tracks it). Once it lives there, delete the app
registration `skillsite-withdrawal`, its Exchange role assignment and scope (_Undo_ below) and the four variables.

## How it works

- `apps/marketing/src/modules/withdrawal/server/graph-mail.ts` calls exactly two hosts, `login.microsoftonline.com`
  (token) and `graph.microsoft.com` (`POST /v1.0/users/{mailbox}/sendMail`, `saveToSentItems: true`), with plain
  `fetch`, no redirects, 8 s timeout per request, and never retries a send.
- The consumer sees success only after Graph answered the acknowledgement with `202`. Otherwise the page asks the
  consumer to send the withdrawal by e-mail as well. A refused acknowledgement (`4xx`) or a timeout, lost connection,
  `5xx` or other success code (_unknown_) still triggers the notice, which says so: check Sent Items and acknowledge
  by hand without delay (§ 356a (4) BGB). A failed token request sends nothing at all.
- Each attempt leaves one line `[withdrawal] <outcome>` with a masked e-mail only: `sent`; at level `error`
  `sent_without_notice`, `unknown`, `failed`, `unconfigured` and `unavailable` (the overall limit of 30 sent
  declarations per hour was reached); at level `warn` `blocked`, `rate_limited` and `rejected`. A `failed` or
  `unknown` line names the Graph step and HTTP status.
- At server start, a partial setup (some of the four variables set) logs one `[env]` warning naming the missing ones.

The pattern follows SkillForge's ADR 0010 (one app identity per feature scope, Exchange "RBAC for Applications"
restricted to one mailbox, no Entra application permission) and its script `scripts/graph/exchange-rbac-calendar.ps1`.

## 1. App registration in Entra

1. Entra admin center → App registrations → New registration: name `skillsite-withdrawal`, single tenant, no
   redirect URI.
2. API permissions: **remove** the default delegated `User.Read` and add **nothing**. The app needs no Graph
   permission in Entra at all.

   > Never grant `Mail.Send` (or any `Mail.*`) as an application permission in Entra. Entra grants and Exchange
   > RBAC grants are a union: an Entra grant lets the app send as every mailbox of the tenant and voids the scope
   > of step 3. `Test-ServicePrincipalAuthorization` does not see Entra grants.

3. Note the **Application (client) ID** and the **Directory (tenant) ID** from the overview, and the **Object ID of
   the Enterprise application** (Enterprise applications → `skillsite-withdrawal` → Overview; not the Object ID on
   the App registration page).

## 2. Client secret

1. App registration → Certificates & secrets → New client secret, description `skillsite prod`, expiry 12 months
   (24 at most).
2. Copy the secret's **Value** (not the Secret ID) straight into the password manager; it is shown once.
3. Add a calendar reminder 30 days before the expiry date. To rotate: create a second secret, set it in the
   deployment, redeploy, check one withdrawal (step 5), then delete the old secret. An expired secret makes every
   withdrawal `failed` (`"step":"token","status":401`) and the page asks consumers to use e-mail.

## 3. Exchange: `Application Mail.Send` on one mailbox

PowerShell 7 with the ExchangeOnlineManagement module 3.x, signed in as an Exchange administrator. Placeholders in
angle brackets; nothing of it goes into the repository.

```powershell
Connect-ExchangeOnline -UserPrincipalName <admin-upn>

# Exchange's pointer to the Entra app (grants nothing on its own).
New-ServicePrincipal -AppId <application-client-id> -ObjectId <enterprise-app-object-id> -DisplayName "skillsite-withdrawal"

# A scope that matches exactly the withdrawal mailbox, by its stable Entra object ID.
$mailbox = Get-Mailbox -Identity <withdrawal-mailbox>
New-ManagementScope -Name "skillsite-withdrawal-mailbox" `
  -RecipientRestrictionFilter "ExternalDirectoryObjectId -eq '$($mailbox.ExternalDirectoryObjectId)'"
Get-Recipient -RecipientPreviewFilter "ExternalDirectoryObjectId -eq '$($mailbox.ExternalDirectoryObjectId)'"  # exactly one

# Send as that mailbox, and only that one.
New-ManagementRoleAssignment -Name "skillsite-withdrawal-mail-send" -Role "Application Mail.Send" `
  -App <enterprise-app-object-id> -CustomResourceScope "skillsite-withdrawal-mailbox"
```

Check it (bypasses the permission cache):

```powershell
Test-ServicePrincipalAuthorization -Identity <enterprise-app-object-id> -Resource <withdrawal-mailbox> |
  Where-Object RoleName -eq "Application Mail.Send" | Format-Table RoleName, AllowedResourceScope, InScope
# expected: Application Mail.Send  skillsite-withdrawal-mailbox  True

Test-ServicePrincipalAuthorization -Identity <enterprise-app-object-id> -Resource <any-other-mailbox> |
  Where-Object RoleName -eq "Application Mail.Send" | Format-Table RoleName, AllowedResourceScope, InScope
# expected: InScope False
```

Real Graph calls see the assignment once the cache resets: 30 minutes for an idle app, up to 2 hours.

## 4. Deployment variables

Set in the production env file of the compose deployment (the maintainer's step; agents never change deploy
configuration), then redeploy:

| Variable              | Value                                              |
| --------------------- | -------------------------------------------------- |
| `GRAPH_TENANT_ID`     | Directory (tenant) ID, a GUID                      |
| `GRAPH_CLIENT_ID`     | Application (client) ID, a GUID                    |
| `GRAPH_CLIENT_SECRET` | the client secret's Value                          |
| `WITHDRAWAL_MAILBOX`  | the mailbox of step 3, sender and notice recipient |

`apps/marketing/src/lib/env.ts` checks them at server start: a present but malformed value stops the server with an
`[env]` line naming the variable, never its value. Unless all four are set, the function runs `unconfigured`: it
sends nothing and asks consumers to withdraw by e-mail (`[withdrawal] unconfigured` in the log).

## 5. Check after a deploy

The maintainer submits one withdrawal at `/widerrufsrecht` with an own address and `Test` as the contract, then
checks: the page shows the date and time of receipt, the acknowledgement arrives, the notice arrives in the
withdrawal mailbox, both appear in its Sent Items, and the log has one `[withdrawal] sent` line.

## Undo

```powershell
Remove-ManagementRoleAssignment -Identity "skillsite-withdrawal-mail-send" -Confirm:$false
Remove-ManagementScope -Identity "skillsite-withdrawal-mailbox" -Confirm:$false
Remove-ServicePrincipal -Identity <enterprise-app-object-id> -Confirm:$false
```

Then delete the app registration in Entra and the four variables from the deployment.

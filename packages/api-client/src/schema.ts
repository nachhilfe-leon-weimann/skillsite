/**
 * Generated from contracts/openapi.json by openapi-typescript - never edit by hand.
 * Regenerate with `pnpm --filter @skillsite/api-client generate`; take a new contract with `sync`.
 */

export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Root */
        get: operations["system_root"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read Application Clients
         * @description List application clients ordered by `client_id`.
         */
        get: operations["auth_read_application_clients"];
        put?: never;
        /** Create Application Client Endpoint */
        post: operations["auth_create_application_client"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clients/{client_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read Application Client */
        get: operations["auth_read_application_client"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Application Client Endpoint */
        patch: operations["auth_update_application_client"];
        trace?: never;
    };
    "/api/v1/auth/clients/{client_id}/scopes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Grant Application Client Scopes Endpoint */
        post: operations["auth_grant_application_client_scopes"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clients/{client_id}/scopes/{mode}/{scope_key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke Application Client Scope Endpoint */
        delete: operations["auth_revoke_application_client_scope"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clients/{client_id}/secrets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Application Client Secret Endpoint */
        post: operations["auth_create_application_client_secret"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clients/{client_id}/secrets/{secret_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke Application Client Secret Endpoint */
        delete: operations["auth_revoke_application_client_secret"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/discord-links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Discord Links
         * @description List Discord links ordered by Discord user ID, unlinked ones included: a change feed (ADR 0009).
         */
        get: operations["auth_list_discord_links"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/discord-links/redeem": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Redeem Discord Link Code
         * @description Link the Discord user who sent a one-time link code to the party of the code's account; spends the code.
         *
         *     The bot's route: `auth:users:exchange` in `application` mode, and a person's token is refused whatever it
         *     carries. Send the Discord user who typed the code, never an ID from a command option. An unknown, used,
         *     invalidated or expired code, and one whose account is disabled or gone, answer one and the same body. A Discord
         *     user linked to another party is refused, and the code stays live.
         */
        post: operations["auth_redeem_discord_link_code"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/discord-links/{discord_user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Discord Link
         * @description Read the link of one Discord user, active or not.
         */
        get: operations["auth_get_discord_link"];
        /**
         * Link Discord Account
         * @description Let a Discord user speak for a person party. Idempotent.
         *
         *     An unlinked Discord user is linked again, or moved when it named another party; one linked to another party
         *     is refused - unlink it there first.
         */
        put: operations["auth_link_discord_account"];
        post?: never;
        /**
         * Unlink Discord Account
         * @description Unlink a Discord user; the row stays, inactive, in the feed. Unlinking an unlinked one changes nothing.
         */
        delete: operations["auth_unlink_discord_account"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Me
         * @description Report what the calling token carries. Answers from the token alone, without asking the database.
         */
        get: operations["auth_get_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password/redeem": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Redeem Password
         * @description Set a password with an invitation or a password-reset token.
         *
         *     An unknown, used, invalidated or expired token answers one and the same body. Redeeming a reset revokes
         *     every session of the account; the account's status does not change.
         */
        post: operations["auth_redeem_password"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke Refresh Token
         * @description Log a person out: end the session a refresh token belongs to.
         *
         *     Only a session this client opened is ended. The answer is the same whether a session was found or not, so
         *     the route tells nothing about a token. Access tokens already issued stay valid until they expire.
         */
        post: operations["auth_revoke_refresh_token"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Token
         * @description Issue an access token.
         *
         *     The client authenticates for every grant, with HTTP Basic or `client_id` / `client_secret` in the form.
         *     `client_credentials` issues a token of the client's own. `password` logs a person in and opens a session;
         *     `refresh_token` renews it and replaces its refresh token. Both need `auth:users:login` granted to the client
         *     in `application` mode. Every failure of the person's credentials or refresh token is the same
         *     `invalid_grant`.
         *
         *     `urn:skillforge:params:oauth:grant-type:discord-user` exchanges the Discord user in `discord_user_id` - the one
         *     who sent a command, never one named in it - for a token of the person party it is actively linked to. It needs
         *     `auth:users:exchange` granted to the client in `application` mode. The token carries `amr: ["discord"]` and at
         *     most `crm:read`, `crm:read:own` and `crm:write`, within the client's `delegated` grants and the person's roles.
         *     No refresh token and no session: exchange again when it expires. No active link, no account and a disabled
         *     account are the same `invalid_grant`. Swagger UI's Authorize dialog cannot use this grant; try it with curl.
         */
        post: operations["auth_create_token"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Users
         * @description List user accounts, oldest first.
         */
        get: operations["auth_list_users"];
        put?: never;
        /**
         * Create User
         * @description Create an `active` account for a person party.
         *
         *     The response carries no token: set up the password login with `POST /users/{user_id}/invitation`.
         */
        post: operations["auth_create_user"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/users/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get User
         * @description Read a single user account with its stored and derived roles.
         */
        get: operations["auth_get_user"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update User
         * @description Change a user account; only the fields that are sent change.
         *
         *     Disabling revokes every session right away; the access tokens already handed out live out their short lifetime.
         */
        patch: operations["auth_update_user"];
        trace?: never;
    };
    "/api/v1/auth/users/{user_id}/discord-link-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Issue Discord Link Code
         * @description Issue a one-time code that links the person's Discord account to their party; they redeem it in the bot.
         *
         *     Needs an `active` account; no e-mail address or password. Earlier unused codes stop working. The bot redeems the
         *     code at `POST /discord-links/redeem` for the Discord user who sent it.
         */
        post: operations["auth_issue_discord_link_code"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/users/{user_id}/invitation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Issue Invitation
         * @description Issue an invitation that sets up the password login; the person redeems it at `POST /password/redeem`.
         *
         *     Needs an e-mail address and no password yet. Earlier unused invitations stop working.
         */
        post: operations["auth_issue_invitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/users/{user_id}/password-reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Issue Password Reset
         * @description Issue a password reset, redeemed at `POST /password/redeem`.
         *
         *     Needs a password. Earlier unused resets stop working; nothing else changes until the token is redeemed.
         */
        post: operations["auth_issue_password_reset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/users/{user_id}/roles/{role}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Add User Role
         * @description Give the account a stored role. Idempotent: a role it already holds changes nothing.
         */
        put: operations["auth_add_user_role"];
        post?: never;
        /**
         * Remove User Role
         * @description Take a stored role away.
         */
        delete: operations["auth_remove_user_role"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/users/{user_id}/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Revoke User Sessions
         * @description Revoke every live session of the account, so none of its refresh tokens works any more.
         */
        delete: operations["auth_revoke_user_sessions"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/calendar/aliases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Calendar Aliases
         * @description List the calendar aliases by their normalised name.
         */
        get: operations["billing_list_calendar_aliases"];
        put?: never;
        /**
         * Create Calendar Alias
         * @description Map a name as written in the lesson calendar to a student. It wins over matching by the students' names.
         *
         *     The name is stored normalised; a name that normalises like a stored one is `calendar_alias_already_exists`.
         */
        post: operations["billing_create_calendar_alias"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/calendar/aliases/{alias_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete Calendar Alias
         * @description Remove a calendar alias; the name is then matched by the students' names again.
         */
        delete: operations["billing_delete_calendar_alias"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/calendar/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Calendar Events
         * @description List the occurrences that wait for an assignment or are flagged `changed`, by start.
         */
        get: operations["billing_list_calendar_events"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/calendar/events/{event_id}/assign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Assign Calendar Event
         * @description Create the lesson of an occurrence without one - `cancelled` for a cancelled occurrence - and optionally store
         *     its name as the student's alias. The lesson starts at the occurrence's start: one off the whole minute cannot be
         *     assigned. The `Location` header points to the lesson.
         */
        post: operations["billing_assign_calendar_event"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/calendar/events/{event_id}/dismiss": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Dismiss Calendar Event
         * @description Take an occurrence off the list. Without a lesson it waits for no assignment and is not proposed again. With
         *     one, the occurrence as last seen is acknowledged: a "no lesson" answer of the rules and a change already seen stay
         *     quiet until it changes again. A title naming another student or subject is never acknowledged - the next import
         *     flags it again. Idempotent.
         */
        post: operations["billing_dismiss_calendar_event"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/calendar/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Import Calendar
         * @description Import the lesson calendar for a range of Berlin days: the calendar proposes, a person confirms.
         *
         *     A new occurrence becomes a `planned` lesson, a `cancelled` one for a late cancellation, or none: a phone call, an
         *     all-day entry or a first meeting is kept with its reason and not listed; any other occurrence without a lesson
         *     waits for an assignment. An untouched lesson - `planned`, no note, no own rate, at the start and length of its
         *     occurrence as last seen - goes when its occurrence vanishes, and follows a moved, resized or cancelled appointment
         *     only while the title rules still give this student and this subject. Otherwise the lesson never changes and its
         *     occurrence is flagged `changed`. Importing an unchanged
         *     range again changes nothing. Answers with counts only; a calendar that cannot be read is `calendar_unavailable`,
         *     and nothing is imported.
         */
        post: operations["billing_import_calendar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/lessons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Lessons
         * @description List lessons by start. `from` and `to` are days in `Europe/Berlin`, both included.
         */
        get: operations["billing_list_lessons"];
        put?: never;
        /**
         * Create Lesson
         * @description Add a lesson by hand. It starts `planned`; tick it with `PATCH`. The `Location` header points to it.
         */
        post: operations["billing_create_lesson"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/lessons/{lesson_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Lesson
         * @description Read a lesson.
         */
        get: operations["billing_get_lesson"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update Lesson
         * @description Change a lesson: tick it (`status: held`), switch `billable`, or correct its data.
         *
         *     Only the fields that are sent change; an empty body changes nothing.
         */
        patch: operations["billing_update_lesson"];
        trace?: never;
    };
    "/api/v1/billing/lessons/{lesson_id}/resolve-payer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resolve Lesson Payer
         * @description Resolve the payer of a billable lesson afresh and store it, replacing the payer it got when it became billable.
         *
         *     A lesson that is not billable has no payer and stays as it is.
         */
        post: operations["billing_resolve_lesson_payer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/parties/{party_id}/manual-billing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Put Manual Billing
         * @description Mark the party as a payer billed by hand: their lessons never reach a draft. Idempotent.
         */
        put: operations["billing_put_manual_billing"];
        post?: never;
        /**
         * Delete Manual Billing
         * @description Unmark the party; its lessons are billed by invoice again. Idempotent: an unmarked party answers 204 too.
         */
        delete: operations["billing_delete_manual_billing"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/parties/{party_id}/sevdesk-contact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Put Sevdesk Contact
         * @description Link the party to its sevDesk contact, the recipient of its invoices. Idempotent.
         *
         *     A party has one contact and a contact one party: another link is removed first.
         */
        put: operations["billing_put_sevdesk_contact"];
        post?: never;
        /**
         * Delete Sevdesk Contact
         * @description Remove the party's sevDesk contact link. Idempotent: a party without one answers 204 too.
         */
        delete: operations["billing_delete_sevdesk_contact"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/payment-requests/{invoice_number}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Payment Request
         * @description Read the payment state of one invoice from sevDesk: `open` with the amount left to pay, or `paid`, and whether
         *     PayPal is allowed. Writes nothing.
         *
         *     A number without a payable invoice - none, a draft, a cancellation, a cancelled original, another document such as
         *     a dunning letter - is `invoice_not_payable`, which never says which; a draft under the number of an issued
         *     invoice is set aside. A sevDesk that cannot be read, or answers anything else - several invoices under one number
         *     that are no draft, an unknown status - is `sevdesk_unavailable`; a configuration that is refused is
         *     `sevdesk_refused`.
         */
        get: operations["billing_get_payment_request"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/students/{party_id}/payer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Student Payer
         * @description Read who pays for a student now, whether that payer has a sevDesk contact, and whether it is billed by hand.
         *
         *     A lesson that becomes billable stores this payer; lessons that are billable already keep theirs.
         */
        get: operations["billing_get_student_payer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/students/{party_id}/rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Rates
         * @description List a student's own rates, newest day first. Each holds from its day until the next one's.
         */
        get: operations["billing_list_rates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/students/{party_id}/rates/{valid_from}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Put Rate
         * @description Set the student's rate from that day on. Idempotent; a rate already set for the day is replaced.
         *
         *     A charge keeps the rate it was priced with: a new rate changes no invoice position.
         */
        put: operations["billing_put_rate"];
        post?: never;
        /**
         * Delete Rate
         * @description Remove the rate of that day; the rate before it then holds on. A charge keeps the rate it was priced with.
         */
        delete: operations["billing_delete_rate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/companies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Company
         * @description Create a company, optionally together with contact infos. The `Location` header points to the party.
         */
        post: operations["crm_create_company"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/companies/{party_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update Company
         * @description Change a company. Only the fields that are sent change; an empty body changes nothing.
         */
        patch: operations["crm_update_company"];
        trace?: never;
    };
    "/api/v1/crm/parties": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Parties
         * @description List and search parties, ordered by name (persons by last name) regardless of case.
         *
         *     With `crm:read:own` the list holds only the parties within the caller's reach.
         */
        get: operations["crm_list_parties"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/parties/{party_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Party
         * @description Read a party - a person or a company - with its roles and contact infos.
         *
         *     With `crm:read:own` a party out of the caller's reach is `party_not_found`, like a missing one.
         */
        get: operations["crm_get_party"];
        put?: never;
        post?: never;
        /**
         * Delete Party
         * @description Delete a party together with its roles, contact infos and relations.
         *
         *     Refused while an active Discord link, an external system (sevDesk, Clockodo, Microsoft) or a billing lesson or
         *     rate holds the party. Remove external links first, in the system that owns them; a party with a lesson stays,
         *     since a lesson is never removed. A deactivated Discord link goes with the party.
         */
        delete: operations["crm_delete_party"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/parties/{party_id}/contact-infos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add Contact Info
         * @description Add a contact info to a party. The same type and value cannot be added twice.
         */
        post: operations["crm_add_contact_info"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/parties/{party_id}/contact-infos/{contact_info_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove Contact Info
         * @description Remove a contact info from a party.
         */
        delete: operations["crm_remove_contact_info"];
        options?: never;
        head?: never;
        /**
         * Update Contact Info
         * @description Change the value or the label of a contact info; its type is immutable. An empty body changes nothing.
         */
        patch: operations["crm_update_contact_info"];
        trace?: never;
    };
    "/api/v1/crm/parties/{party_id}/relations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Relations
         * @description List the relations of a party in both directions, oldest first; each names the party on the other side.
         */
        get: operations["crm_list_relations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/parties/{party_id}/relations/{type}/{to_party_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Put Relation
         * @description Relate two parties: `{party_id}` is `{type}` `{to_party_id}`. Idempotent.
         *
         *     `parent_of` needs a person on both sides, `tutor_of` a tutor and a student, and `pays_for` points
         *     to a person. The answer names the other party, which confirms the pasted ID.
         */
        put: operations["crm_put_relation"];
        post?: never;
        /**
         * Remove Relation
         * @description Remove the relation `{party_id}` is `{type}` `{to_party_id}`.
         */
        delete: operations["crm_remove_relation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/persons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Person
         * @description Create a person, optionally together with contact infos and the student and tutor roles.
         *
         *     All of it is one transaction: an unknown subject creates nothing. The `Location` header points
         *     to the party. To avoid duplicates, search first: `GET /parties?q=<e-mail>`.
         */
        post: operations["crm_create_person"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/persons/{party_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update Person
         * @description Change a person. Only the fields that are sent change; an empty body changes nothing.
         */
        patch: operations["crm_update_person"];
        trace?: never;
    };
    "/api/v1/crm/persons/{party_id}/student": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Put Student Role
         * @description Give a person the student role, or replace its data. Idempotent; `subject_ids` replaces the whole set.
         */
        put: operations["crm_put_student_role"];
        post?: never;
        /**
         * Remove Student Role
         * @description Take the student role away, and with it every `tutor_of` pointing to the person.
         *
         *     The tutors on the other side of those relations change too: their `updated_at` moves. Other relations stay.
         */
        delete: operations["crm_remove_student_role"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/persons/{party_id}/tutor": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Put Tutor Role
         * @description Give a person the tutor role, or replace its data. Idempotent; `subject_ids` replaces the whole set.
         */
        put: operations["crm_put_tutor_role"];
        post?: never;
        /**
         * Remove Tutor Role
         * @description Take the tutor role away, and with it every `tutor_of` starting at the person.
         *
         *     The students on the other side of those relations change too: their `updated_at` moves. Other relations stay.
         */
        delete: operations["crm_remove_tutor_role"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/subjects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Subjects
         * @description List subjects, ordered by title.
         */
        get: operations["crm_list_subjects"];
        put?: never;
        /**
         * Create Subject
         * @description Create a subject. Titles are unique regardless of case.
         */
        post: operations["crm_create_subject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/subjects/{subject_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete Subject
         * @description Delete a subject that is not assigned to any student or tutor.
         */
        delete: operations["crm_delete_subject"];
        options?: never;
        head?: never;
        /**
         * Update Subject
         * @description Change a subject. Only the fields that are sent change; an empty body changes nothing.
         */
        patch: operations["crm_update_subject"];
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * System Health Check
         * @description Aggregate health across all dependencies and workers.
         */
        get: operations["system_health_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/dependencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dependencies Health Check
         * @description Aggregate health across all external dependencies.
         */
        get: operations["system_dependencies_health_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/dependencies/{dependency_name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dependency Health Check
         * @description Health of a single dependency.
         */
        get: operations["system_dependency_health_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Liveness Check
         * @description Liveness probe: the process is up and serving requests.
         */
        get: operations["system_liveness_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/workers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Workers Health Check
         * @description Aggregate health across all background workers.
         */
        get: operations["system_workers_health_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/workers/{worker_name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Worker Health Check
         * @description Health of a single background worker.
         */
        get: operations["system_worker_health_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * AccessTokenResponse
         * @description A successful token response (RFC 6749, section 5.1). A person's grants add the session's refresh token.
         */
        AccessTokenResponse: {
            /**
             * Access Token
             * @description The access token: a signed JWT to send as `Authorization: Bearer <token>`.
             */
            access_token: string;
            /**
             * Expires In
             * @description Seconds until the access token expires.
             */
            expires_in: number;
            /**
             * Refresh Expires In
             * @description Only with `refresh_token`: seconds until the session ends for good - it expires absolutely, refreshing
             *     does not extend it.
             */
            refresh_expires_in?: number | null;
            /**
             * Refresh Token
             * @description Only for the `password` and `refresh_token` grants: the session's new refresh token. It replaces the one
             *     presented, which stops working; SkillForge stores only its hash, so this is the one time it can be read.
             */
            refresh_token?: string | null;
            /**
             * Scope
             * @description Scopes the token grants, space-separated and canonical: an unqualified scope implies its `:own` form.
             */
            scope: string;
            /**
             * Token Type
             * @description Always `bearer`.
             */
            token_type: string;
        };
        /**
         * ActionTokenResponse
         * @description A one-time token to hand to the person: an invitation, a password reset or a Discord link code.
         */
        ActionTokenResponse: {
            /**
             * Expires At
             * Format: date-time
             * @description When the token stops working. Issuing another of the same purpose invalidates it earlier.
             */
            expires_at: string;
            /**
             * Token
             * @description The token. SkillForge stores only its hash, so this is the one time it can be read.
             */
            token: string;
        };
        /** ApplicationClientCreateRequest */
        ApplicationClientCreateRequest: {
            /** Client Id */
            client_id: string;
            /** Description */
            description?: string | null;
            /** Name */
            name: string;
        };
        /**
         * ApplicationClientResponse
         * @description An application client with its scope grants and secrets.
         */
        ApplicationClientResponse: {
            /**
             * Application Scopes
             * @description Scopes granted in `application` mode - what the client may do for itself - sorted.
             */
            application_scopes: string[];
            /**
             * Client Id
             * @description Identifier the client authenticates with at `POST /auth/token`.
             */
            client_id: string;
            /**
             * Created At
             * Format: date-time
             * @description When the client was created.
             */
            created_at: string;
            /**
             * Delegated Scopes
             * @description Scopes granted in `delegated` mode - the most the client may do for a person - sorted.
             */
            delegated_scopes: string[];
            /**
             * Description
             * @description Free-text description; `null` when there is none.
             */
            description: string | null;
            /**
             * Id
             * Format: uuid
             * @description ID of the client; its application tokens carry it as `principal_id`.
             */
            id: string;
            /**
             * Name
             * @description Display name of the client.
             */
            name: string;
            /**
             * Secrets
             * @description Secrets of the client, oldest first, without their values.
             */
            secrets: components["schemas"]["ApplicationClientSecretResponse"][];
            /** @description An `active` client obtains tokens, a `disabled` one does not. */
            status: components["schemas"]["ApplicationClientStatus"];
            /**
             * Updated At
             * Format: date-time
             * @description When the client was last changed.
             */
            updated_at: string;
        };
        /**
         * ApplicationClientScopeGrantRequest
         * @description Scopes to grant an application client in one mode (ADR 0008).
         */
        ApplicationClientScopeGrantRequest: {
            /**
             * @description `application`: what the client may do for itself (`client_credentials`). `delegated`: the most it may do for a
             *     person it acts for; a client-only scope such as `auth:users:login` is refused in this mode.
             */
            mode: components["schemas"]["GrantMode"];
            /**
             * Scopes
             * @description Scopes to grant, e.g. `crm:read`. A scope the client already holds in `mode` stays as it is; if one scope is
             *     refused, none is granted.
             */
            scopes: string[];
        };
        /** ApplicationClientSecretCreateRequest */
        ApplicationClientSecretCreateRequest: {
            /** Expires At */
            expires_at?: string | null;
            /** Label */
            label?: string | null;
        };
        /** ApplicationClientSecretResponse */
        ApplicationClientSecretResponse: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Expires At */
            expires_at: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Label */
            label: string | null;
            /** Last Used At */
            last_used_at: string | null;
            /** Revoked At */
            revoked_at: string | null;
        };
        /**
         * ApplicationClientStatus
         * @enum {string}
         */
        ApplicationClientStatus: "active" | "disabled";
        /** ApplicationClientUpdateRequest */
        ApplicationClientUpdateRequest: {
            /** Description */
            description?: string | null;
            /** Name */
            name?: string | null;
            status?: components["schemas"]["ApplicationClientStatus"] | null;
        };
        /** Body_auth_create_token */
        Body_auth_create_token: {
            /**
             * Client Id
             * @description The client's ID, unless it authenticates with HTTP Basic, which wins.
             */
            client_id?: string | null;
            /**
             * Client Secret
             * @description The client's secret, unless it authenticates with HTTP Basic.
             */
            client_secret?: string | null;
            /**
             * Discord User Id
             * @description `urn:skillforge:params:oauth:grant-type:discord-user` grant only, required there: the Discord user who sent the command, as a decimal string.
             */
            discord_user_id?: string | null;
            /**
             * Grant Type
             * @description `client_credentials`, `password` (a person's login), `refresh_token` or `urn:skillforge:params:oauth:grant-type:discord-user` (a person's token for a linked Discord user).
             */
            grant_type: string;
            /**
             * Password
             * @description `password` grant only, required there: the person's password, at most 128 characters.
             */
            password?: string | null;
            /**
             * Refresh Token
             * @description `refresh_token` grant only, required there: the session's current refresh token.
             */
            refresh_token?: string | null;
            /**
             * Scope
             * @description Space-separated scopes to narrow the token to; without it the token gets all it may hold.
             */
            scope?: string | null;
            /**
             * Username
             * @description `password` grant only, required there: the person's login e-mail address, at most 254 characters.
             */
            username?: string | null;
        };
        /**
         * CalendarAliasCreateRequest
         * @description Body of `POST /calendar/aliases`: a name as written in the lesson calendar, and the student it means.
         */
        CalendarAliasCreateRequest: {
            /**
             * Name
             * @description The name after ` mit ` in a calendar title. It is stored normalised - case, umlauts, hyphens and spaces do not
             *     count - and matches every spelling that normalises alike.
             * @example Erika Mustermann
             */
            name: string;
            /**
             * Student Id
             * Format: uuid
             * @description ID of a party holding the student role.
             */
            student_id: string;
        };
        /**
         * CalendarAliasResponse
         * @description A calendar name mapped to a student: the import assigns an occurrence with this name to the student.
         */
        CalendarAliasResponse: {
            /**
             * Created At
             * Format: date-time
             * @description When the alias was stored.
             */
            created_at: string;
            /**
             * Id
             * Format: uuid
             * @description ID of the alias.
             */
            id: string;
            /**
             * Name Normalized
             * @description The name as the import compares it: case-folded, `ä ö ü ß` as `ae oe ue ss`, hyphens and underscores as
             *     spaces, single spaces.
             */
            name_normalized: string;
            /**
             * Student Id
             * Format: uuid
             * @description ID of the student's party.
             */
            student_id: string;
        };
        /**
         * CalendarEventAssignRequest
         * @description Body of `POST /calendar/events/{event_id}/assign`: the lesson an occurrence without one stands for.
         */
        CalendarEventAssignRequest: {
            /**
             * Alias
             * @description A calendar name to store as the student's alias, so the import matches it from now on; usually `title_name`.
             */
            alias?: string | null;
            /**
             * Minutes
             * @description The duration to bill, a multiple of 15: the appointment's, or a correction of it.
             * @example 60
             */
            minutes: number;
            /**
             * Student Id
             * Format: uuid
             * @description ID of a party holding the student role.
             */
            student_id: string;
            /**
             * Subject
             * @description The subject as a label (`Mathe`). Surrounding whitespace is stripped.
             * @example Mathe
             */
            subject: string;
        };
        /**
         * CalendarEventResponse
         * @description An occurrence of the lesson calendar that waits for an assignment, or differs from its lesson.
         */
        CalendarEventResponse: {
            /**
             * Cancelled
             * @description Cancelled in the calendar or by the late-cancellation category.
             */
            cancelled: boolean;
            /**
             * Changed
             * @description The maintainer has to look: the title names another student or subject than the lesson's (flagged at every
             *     import until the lesson, the title or an alias settles it; a dismiss then clears it); the rules give no lesson;
             *     the appointment of a lesson the import does not change moved, was resized, cancelled or vanished; a lesson could
             *     not follow; or the occurrence could not get its lesson. Dismissing acknowledges all but another student or
             *     subject, until the occurrence changes again.
             */
            changed: boolean;
            /**
             * Ends At
             * Format: date-time
             * @description When the appointment ends, in UTC, as last seen.
             */
            ends_at: string;
            /**
             * Id
             * Format: uuid
             * @description ID of the occurrence.
             */
            id: string;
            /**
             * Last Seen At
             * Format: date-time
             * @description When an import last read the occurrence: before the last import of its day, it vanished from the calendar.
             */
            last_seen_at: string;
            /**
             * Lesson Id
             * @description ID of the occurrence's lesson, if it has one.
             */
            lesson_id: string | null;
            /**
             * @description Why the rules give no lesson, as last seen - for an occurrence with a lesson too (an assigned one keeps the
             *     reason it waited for); `null` while the rules give a lesson, or when its student has a lesson at that start
             *     already.
             */
            reason: components["schemas"]["NoLessonReason"] | null;
            /**
             * Starts At
             * Format: date-time
             * @description When the appointment starts, in UTC, as last seen.
             */
            starts_at: string;
            /**
             * Title Name
             * @description The name after ` mit `, as written, while the occurrence waits for an assignment; `null` otherwise.
             */
            title_name: string | null;
            /**
             * Title Subject
             * @description The text before ` mit ` in the title, if it has one.
             */
            title_subject: string | null;
            /**
             * Vanished
             * @description Gone from the calendar while its lesson stays.
             */
            vanished: boolean;
        };
        /**
         * CalendarImportRequest
         * @description Body of `POST /calendar/import`: a range of days in `Europe/Berlin`, both included, at most 92 days.
         */
        CalendarImportRequest: {
            /**
             * First Day
             * Format: date
             * @description The first day whose occurrences are imported.
             * @example 2026-11-02
             */
            first_day: string;
            /**
             * Last Day
             * Format: date
             * @description The last day whose occurrences are imported; not before `first_day`.
             * @example 2026-11-02
             */
            last_day: string;
        };
        /**
         * CalendarImportResponse
         * @description What an import did, in counts only.
         */
        CalendarImportResponse: {
            /**
             * Changed
             * @description Occurrences of the range flagged `changed` (see `GET /calendar/events`): listed until dismissed - except one
             *     whose title names another student or subject, which is flagged again at every import until it is settled.
             */
            changed: number;
            /**
             * Deleted
             * @description Occurrences deleted: gone from the calendar without a lesson, or 90 days past their start without one.
             */
            deleted: number;
            /**
             * Lessons Created
             * @description Lessons the import proposed: `planned`, or `cancelled` for a late cancellation.
             */
            lessons_created: number;
            /**
             * Lessons Removed
             * @description `planned` lessons whose appointment vanished from the range.
             */
            lessons_removed: number;
            /**
             * Lessons Updated
             * @description `planned` lessons that followed their appointment: moved, resized or cancelled.
             */
            lessons_updated: number;
            /**
             * Occurrences
             * @description Occurrences read from the calendar and stored as seen.
             */
            occurrences: number;
            /**
             * Unassigned
             * @description Occurrences of the range that wait for an assignment.
             */
            unassigned: number;
        };
        /**
         * CompanyCreateRequest
         * @description Body of `POST /companies`.
         */
        CompanyCreateRequest: {
            /**
             * Contact Infos
             * @description Contact infos to create with the company. The same `type` and `value` must not appear twice.
             * @example [
             *       {
             *         "label": "office",
             *         "type": "email",
             *         "value": "office@musterfirma.example"
             *       }
             *     ]
             */
            contact_infos?: components["schemas"]["ContactInfoCreateRequest"][];
            /**
             * Name
             * @description Name of the company. Surrounding whitespace is stripped.
             * @example Musterfirma GmbH
             */
            name: string;
        };
        /**
         * CompanyDetail
         * @description A party of type `company` with everything that belongs to it.
         */
        CompanyDetail: {
            /**
             * Contact Infos
             * @description Contact infos of the party, ordered by type and value.
             */
            contact_infos: components["schemas"]["ContactInfoResponse"][];
            /**
             * Created At
             * Format: date-time
             * @description When the party was created.
             */
            created_at: string;
            /**
             * Display Name
             * @description Name of the company.
             */
            display_name: string;
            /**
             * Id
             * Format: uuid
             * @description ID of the party.
             */
            id: string;
            /**
             * Name
             * @description Name of the company.
             */
            name: string;
            /**
             * @description Discriminator: always `company`. (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            type: "company";
            /**
             * Updated At
             * Format: date-time
             * @description When anything in the party - the company, a contact info, a relation - last changed.
             */
            updated_at: string;
        };
        /**
         * CompanyUpdateRequest
         * @description Body of `PATCH /companies/{party_id}`: only the fields that are sent change.
         */
        CompanyUpdateRequest: {
            /**
             * Name
             * @description New name of the company. Surrounding whitespace is stripped.
             */
            name?: string;
        };
        /**
         * ContactInfoCreateRequest
         * @description A contact info to attach to a party.
         */
        ContactInfoCreateRequest: {
            /**
             * Label
             * @description Free-text note telling contact infos of the same type apart, e.g. `work`.
             * @example private
             */
            label?: string | null;
            /**
             * @description Kind of the contact info; it cannot be changed later.
             * @example email
             */
            type: components["schemas"]["ContactInfoType"];
            /**
             * Value
             * @description An e-mail address (stored in lowercase) or a phone number, matching `type`.
             *
             *     A phone number is stored in E.164 (`+491711234567`); one written in its national form (`0171 1234567`) is read
             *     as a German number. An extension is not supported - put it into `label`.
             * @example max.mustermann@example.com
             */
            value: string;
        };
        /**
         * ContactInfoResponse
         * @description One way to reach a party.
         */
        ContactInfoResponse: {
            /**
             * Id
             * Format: uuid
             * @description ID of the contact info.
             */
            id: string;
            /**
             * Label
             * @description Free-text note telling contact infos of the same type apart, e.g. `work`.
             */
            label: string | null;
            /** @description Kind of the contact info; it never changes. */
            type: components["schemas"]["ContactInfoType"];
            /**
             * Value
             * @description The normalized value: an e-mail address in lowercase, a phone number in E.164 (`+491711234567`).
             */
            value: string;
        };
        /**
         * ContactInfoType
         * @enum {string}
         */
        ContactInfoType: "email" | "phone";
        /**
         * ContactInfoUpdateRequest
         * @description Body of `PATCH /parties/{party_id}/contact-infos/{contact_info_id}`: only the fields that are sent change.
         *
         *     `type` is immutable and not part of this body; delete the contact info and add another one instead.
         */
        ContactInfoUpdateRequest: {
            /**
             * Label
             * @description New label; `null` clears it.
             */
            label?: string | null;
            /**
             * Value
             * @description New value. It must fit the stored type (422 `invalid_contact_value` otherwise) and is normalized as on create:
             *     an e-mail address to lowercase, a phone number to E.164.
             */
            value?: string;
        };
        /** CreatedClientSecretResponse */
        CreatedClientSecretResponse: {
            /** Client Secret */
            client_secret: string;
            secret: components["schemas"]["ApplicationClientSecretResponse"];
        };
        /** DependenciesHealthCheckResponse */
        DependenciesHealthCheckResponse: {
            /** Checks */
            checks: {
                [key: string]: components["schemas"]["HealthStatus"];
            };
            status: components["schemas"]["HealthStatus"];
        };
        /** DependencyHealthCheckResponse */
        DependencyHealthCheckResponse: {
            dependency_name: components["schemas"]["DependencyName"];
            status: components["schemas"]["HealthStatus"];
        };
        /**
         * DependencyName
         * @enum {string}
         */
        DependencyName: "database";
        /**
         * DiscordLink
         * @description Which Discord account speaks for which person party - identity, written by an admin or by the person with a
         *     one-time link code.
         */
        DiscordLink: {
            /**
             * Active
             * @description `false` once unlinked. The row stays as history; a `PUT` or a redeemed link code links it again.
             */
            active: boolean;
            /**
             * Created At
             * Format: date-time
             * @description When the Discord account was first linked; a move to another party keeps it.
             */
            created_at: string;
            /**
             * Discord User Id
             * @description The Discord user's snowflake, as a decimal string.
             */
            discord_user_id: string;
            /**
             * Party Id
             * Format: uuid
             * @description ID of the person party the Discord account speaks for.
             */
            party_id: string;
            /**
             * Updated At
             * Format: date-time
             * @description When the link was last linked, moved or unlinked - what `updated_since` compares.
             */
            updated_at: string;
        };
        /**
         * DiscordLinkRedeemRequest
         * @description Body of `POST /discord-links/redeem`: a one-time link code and the Discord user who sent it.
         */
        DiscordLinkRedeemRequest: {
            /**
             * Discord User Id
             * @description The snowflake of the Discord user who sent the code, as a decimal string; a JSON number is refused. Always the
             *     sender, never an ID from a command option.
             * @example 123456789012345678
             */
            discord_user_id: string;
            /**
             * Token
             * @description The Discord link code the person typed into the bot.
             * @example sf_ua_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
             */
            token: string;
        };
        /**
         * DiscordLinkRequest
         * @description Body of `PUT /discord-links/{discord_user_id}`.
         */
        DiscordLinkRequest: {
            /**
             * Party Id
             * Format: uuid
             * @description ID of the person party the Discord account speaks for. A company is refused; the party needs no user account.
             * @example 7d9f4f3e-1c2b-4a5d-9e8f-0a1b2c3d4e5f
             */
            party_id: string;
        };
        /**
         * ErrorResponse
         * @description Body of every non-2xx response (ADR 0006).
         */
        ErrorResponse: {
            /**
             * Code
             * @description Stable, machine-readable identifier in `snake_case`. Branch on this, never on `detail`.
             */
            code: string;
            /**
             * Detail
             * @description Human-readable message. Safe to show; never contains internals.
             */
            detail: string;
            /**
             * Errors
             * @description Present only for request-validation failures: one entry per offending field.
             */
            errors?: components["schemas"]["FieldError"][] | null;
        };
        /**
         * FieldError
         * @description One offending field of a request that failed validation.
         */
        FieldError: {
            /**
             * Loc
             * @description Path to the field, starting with its location (`path`, `query`, `body`, ...).
             */
            loc: (string | number)[];
            /**
             * Message
             * @description Human-readable reason the value was rejected.
             */
            message: string;
            /**
             * Type
             * @description Machine-readable identifier of the violated rule (e.g. `less_than_equal`).
             */
            type: string;
        };
        /**
         * GrantMode
         * @enum {string}
         */
        GrantMode: "application" | "delegated";
        /** HealthCheckResponse */
        HealthCheckResponse: {
            status: components["schemas"]["HealthStatus"];
        };
        /**
         * HealthStatus
         * @enum {string}
         */
        HealthStatus: "ok" | "unhealthy" | "error";
        /**
         * LessonCreateRequest
         * @description Body of `POST /lessons`: a lesson added by hand. It starts `planned` and not billable.
         */
        LessonCreateRequest: {
            /**
             * Minutes
             * @description The duration, a multiple of 15.
             * @example 60
             */
            minutes: number;
            /**
             * Note
             * @description Free-text note.
             */
            note?: string | null;
            /**
             * Rate Cents Per Hour
             * @description The lesson's own rate in cents per hour: 0 or more, divisible by 4. Omit it for the student's rate or the
             *     default.
             */
            rate_cents_per_hour?: number | null;
            /**
             * Starts At
             * Format: date-time
             * @description When the lesson starts, with its UTC offset (`Z` or `+01:00`), on a whole minute.
             * @example 2026-11-02T16:00:00+01:00
             */
            starts_at: string;
            /**
             * Student Id
             * Format: uuid
             * @description ID of a party holding the student role.
             */
            student_id: string;
            /**
             * Subject
             * @description The subject as a label (`Mathe`). Surrounding whitespace is stripped.
             * @example Mathe
             */
            subject: string;
        };
        /**
         * LessonPayerResponse
         * @description The payer stored on a lesson.
         */
        LessonPayerResponse: {
            /**
             * Billable
             * @description Whether the lesson is billable; only a billable lesson stores a payer.
             */
            billable: boolean;
            /**
             * Lesson Id
             * Format: uuid
             * @description ID of the lesson.
             */
            lesson_id: string;
            /**
             * Payer Id
             * @description The payer stored on the lesson. `null` when the lesson is not billable, or when several parties pay for the
             *     student: such a lesson is not billed until it has a payer.
             */
            payer_id: string | null;
            /**
             * Student Id
             * Format: uuid
             * @description ID of the student's party.
             */
            student_id: string;
        };
        /**
         * LessonResponse
         * @description One appointment of one student.
         */
        LessonResponse: {
            /**
             * Billable
             * @description Whether the lesson is billed: set by the tick, switched off on a `held` lesson as goodwill or on for a
             *     `cancelled` one; never on a `planned` or `not_held` lesson.
             */
            billable: boolean;
            /**
             * Created At
             * Format: date-time
             * @description When the lesson was recorded.
             */
            created_at: string;
            /**
             * Id
             * Format: uuid
             * @description ID of the lesson.
             */
            id: string;
            /**
             * Minutes
             * @description The billed duration, a multiple of 15.
             */
            minutes: number;
            /**
             * Note
             * @description Free-text note.
             */
            note: string | null;
            /**
             * Rate Cents Per Hour
             * @description The lesson's own rate in cents per hour, or `null` for the student's rate or the default.
             */
            rate_cents_per_hour: number | null;
            /**
             * Starts At
             * Format: date-time
             * @description When the lesson starts, in UTC. Lessons are billed by its day in `Europe/Berlin`.
             */
            starts_at: string;
            /**
             * @description `planned` until the maintainer confirms it: `held` (the tick), `cancelled` (late or not attended) or
             *     `not_held` (costs nothing).
             */
            status: components["schemas"]["LessonStatus"];
            /**
             * Student Id
             * Format: uuid
             * @description ID of the student's party.
             */
            student_id: string;
            /**
             * Subject
             * @description The subject as a label (`Mathe`), as the calendar title names it.
             */
            subject: string;
            /**
             * Updated At
             * Format: date-time
             * @description When the lesson last changed.
             */
            updated_at: string;
        };
        /**
         * LessonStatus
         * @enum {string}
         */
        LessonStatus: "planned" | "held" | "cancelled" | "not_held";
        /**
         * LessonUpdateRequest
         * @description Body of `PATCH /lessons/{lesson_id}`: only the fields that are sent change; an empty body changes nothing.
         *
         *     Changing `status` sets the default `billable` of the new status: `held` (the tick) makes the lesson billable,
         *     every other status does not. Sending the status the lesson already has changes nothing. A `billable` sent along
         *     wins; `true` is `lesson_not_billable` for a `planned` or `not_held` lesson.
         */
        LessonUpdateRequest: {
            /**
             * Billable
             * @description Whether the lesson is billed: `false` on a `held` lesson is goodwill, `true` on a `cancelled` one bills it.
             */
            billable?: boolean;
            /**
             * Minutes
             * @description The duration, a multiple of 15 - corrected when a lesson ran differently.
             * @example 60
             */
            minutes?: number;
            /**
             * Note
             * @description Free-text note; `null` clears it.
             */
            note?: string | null;
            /**
             * Rate Cents Per Hour
             * @description The lesson's own rate in cents per hour, divisible by 4; `null` falls back to the student's rate or the
             *     default.
             */
            rate_cents_per_hour?: number | null;
            /**
             * Starts At
             * Format: date-time
             * @description When the lesson starts, with its UTC offset, on a whole minute.
             * @example 2026-11-02T16:00:00+01:00
             */
            starts_at?: string;
            /**
             * Status
             * @description The new status; `held` is the tick.
             */
            status?: components["schemas"]["LessonStatus"];
            /**
             * Student Id
             * Format: uuid
             * @description ID of another party holding the student role.
             */
            student_id?: string;
            /**
             * Subject
             * @description The subject as a label. Surrounding whitespace is stripped.
             * @example Mathe
             */
            subject?: string;
        };
        /**
         * ManualBillingPutRequest
         * @description Body of `PUT /parties/{party_id}/manual-billing`: the whole mark. The same note again changes nothing.
         */
        ManualBillingPutRequest: {
            /**
             * Note
             * @description Free-text note, such as why the payer is billed by hand; leaving it out clears it.
             */
            note?: string | null;
        };
        /**
         * ManualBillingResponse
         * @description A payer billed by hand: their lessons show as "bill manually" and never reach a draft.
         */
        ManualBillingResponse: {
            /**
             * Created At
             * Format: date-time
             * @description When the party was marked.
             */
            created_at: string;
            /**
             * Note
             * @description Free-text note.
             */
            note: string | null;
            /**
             * Party Id
             * Format: uuid
             * @description ID of the party.
             */
            party_id: string;
            /**
             * Updated At
             * Format: date-time
             * @description When the note last changed.
             */
            updated_at: string;
        };
        /**
         * MeResponse
         * @description What the calling token says about its bearer.
         */
        MeResponse: {
            /**
             * Client Id
             * @description Client ID of the application client, or for a person the client that logged them in or vouched for them.
             */
            client_id: string | null;
            /**
             * Party Id
             * @description CRM party of that person; `null` for an application principal.
             */
            party_id: string | null;
            /**
             * Principal Type
             * @description Kind of principal the token was issued to: `application` for an application client, `user` for a person.
             */
            principal_type: string;
            /**
             * Roles
             * @description Roles the person holds, sorted - informational, which views to offer; empty for an application principal.
             */
            roles: components["schemas"]["Role"][];
            /**
             * Scopes
             * @description Scopes the token grants, sorted and canonical: an unqualified scope implies its `:own` form.
             */
            scopes: string[];
            /**
             * User Id
             * @description User account of the person the token speaks for; `null` for an application principal.
             */
            user_id: string | null;
        };
        /**
         * NoLessonReason
         * @description Why an occurrence is no lesson: ``calendar_event.reason``.
         * @enum {string}
         */
        NoLessonReason: "all_day" | "phone" | "first_meeting" | "no_title_pattern" | "duration" | "unmatched" | "ambiguous";
        /** Page[ApplicationClientResponse] */
        Page_ApplicationClientResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["ApplicationClientResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[CalendarAliasResponse] */
        Page_CalendarAliasResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["CalendarAliasResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[CalendarEventResponse] */
        Page_CalendarEventResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["CalendarEventResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[DiscordLink] */
        Page_DiscordLink_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["DiscordLink"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[LessonResponse] */
        Page_LessonResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["LessonResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[PartyListItem] */
        Page_PartyListItem_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["PartyListItem"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[RateResponse] */
        Page_RateResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["RateResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[RelationResponse] */
        Page_RelationResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["RelationResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[SubjectResponse] */
        Page_SubjectResponse_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["SubjectResponse"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        /** Page[UserAccountListItem] */
        Page_UserAccountListItem_: {
            /**
             * Items
             * @description The items of this page, in the order of the list.
             */
            items: components["schemas"]["UserAccountListItem"][];
            /**
             * Limit
             * @description The page size that was applied.
             */
            limit: number;
            /**
             * Offset
             * @description Number of items skipped before this page.
             */
            offset: number;
            /**
             * Total
             * @description Number of items matching the request across all pages.
             */
            total: number;
        };
        PartyDetail: components["schemas"]["PersonDetail"] | components["schemas"]["CompanyDetail"];
        /**
         * PartyListItem
         * @description A party as it appears in lists and on the other side of a relation.
         */
        PartyListItem: {
            /**
             * Display Name
             * @description First and last name of a person, or the name of a company.
             */
            display_name: string;
            /**
             * Id
             * Format: uuid
             * @description ID of the party.
             */
            id: string;
            /**
             * Roles
             * @description The roles a person holds; always empty for a company.
             */
            roles: components["schemas"]["PartyRole"][];
            /** @description Whether the party is a person or a company. */
            type: components["schemas"]["PartyType"];
            /**
             * Updated At
             * Format: date-time
             * @description When anything in the party last changed - the person or company, a role, a contact info, a relation - or a
             *     party related to it was deleted. The start of the writing transaction: pull as `updated_since` describes.
             */
            updated_at: string;
        };
        /**
         * PartyRelationType
         * @enum {string}
         */
        PartyRelationType: "parent_of" | "tutor_of" | "pays_for";
        /**
         * PartyRole
         * @description A role a person can hold; companies hold none.
         * @enum {string}
         */
        PartyRole: "student" | "tutor";
        /**
         * PartyType
         * @enum {string}
         */
        PartyType: "person" | "company";
        /**
         * PasswordRedeemRequest
         * @description Body of `POST /password/redeem`: a one-time token and the password to set with it.
         */
        PasswordRedeemRequest: {
            /**
             * New Password
             * @description The password to set: 8 to 128 characters, no further rules.
             * @example correct horse battery staple
             */
            new_password: string;
            /**
             * Token
             * @description The invitation or password-reset token the person was given.
             * @example sf_ua_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
             */
            token: string;
        };
        /**
         * PayPalPermission
         * @enum {string}
         */
        PayPalPermission: "allowed" | "blocked";
        /**
         * PaymentRequest
         * @description The payment state of one invoice - nothing about the person it is for: no name, contact or customer number.
         */
        PaymentRequest: {
            /**
             * Invoice Number
             * @description The invoice's number, as asked.
             */
            invoice_number: string;
            /**
             * Open Amount Cents
             * @description What is left to pay, in cents: the gross sum minus what is paid; `0` once `paid`.
             */
            open_amount_cents: number;
            /** @description Whether the invoice may be paid by PayPal: `blocked` for the customers who may only pay by transfer. */
            paypal: components["schemas"]["PayPalPermission"];
            /** @description `open` - sent or partly paid - or `paid`. */
            state: components["schemas"]["PaymentState"];
        };
        /**
         * PaymentState
         * @enum {string}
         */
        PaymentState: "open" | "paid";
        /**
         * PersonCreateRequest
         * @description Body of `POST /persons`.
         */
        PersonCreateRequest: {
            /**
             * Contact Infos
             * @description Contact infos to create with the person. The same `type` and `value` must not appear twice.
             * @example [
             *       {
             *         "label": "private",
             *         "type": "email",
             *         "value": "max.mustermann@example.com"
             *       }
             *     ]
             */
            contact_infos?: components["schemas"]["ContactInfoCreateRequest"][];
            /**
             * Firstname
             * @description First name. Surrounding whitespace is stripped.
             * @example Max
             */
            firstname: string;
            /**
             * Lastname
             * @description Last name. Surrounding whitespace is stripped.
             * @example Mustermann
             */
            lastname: string;
            /**
             * @description Give the person the student role right away. Omit it or send `null` for none.
             * @example {
             *       "preferred_meeting_tool": "discord",
             *       "subject_ids": [
             *         1,
             *         2
             *       ]
             *     }
             */
            student?: components["schemas"]["StudentRoleRequest"] | null;
            /**
             * @description Give the person the tutor role right away. Omit it or send `null` for none.
             * @example null
             */
            tutor?: components["schemas"]["TutorRoleRequest"] | null;
        };
        /**
         * PersonDetail
         * @description A party of type `person` with everything that belongs to it.
         */
        PersonDetail: {
            /**
             * Contact Infos
             * @description Contact infos of the party, ordered by type and value.
             */
            contact_infos: components["schemas"]["ContactInfoResponse"][];
            /**
             * Created At
             * Format: date-time
             * @description When the party was created.
             */
            created_at: string;
            /**
             * Display Name
             * @description First and last name.
             */
            display_name: string;
            /**
             * Firstname
             * @description First name of the person.
             */
            firstname: string;
            /**
             * Id
             * Format: uuid
             * @description ID of the party.
             */
            id: string;
            /**
             * Lastname
             * @description Last name of the person.
             */
            lastname: string;
            /** @description The student role, or `null` if the person is not a student. */
            student: components["schemas"]["StudentRole"] | null;
            /** @description The tutor role, or `null` if the person is not a tutor. */
            tutor: components["schemas"]["TutorRole"] | null;
            /**
             * @description Discriminator: always `person`. (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            type: "person";
            /**
             * Updated At
             * Format: date-time
             * @description When anything in the party - the person, a role, a contact info, a relation - last changed.
             */
            updated_at: string;
        };
        /**
         * PersonUpdateRequest
         * @description Body of `PATCH /persons/{party_id}`: only the fields that are sent change.
         */
        PersonUpdateRequest: {
            /**
             * Firstname
             * @description New first name. Surrounding whitespace is stripped.
             */
            firstname?: string;
            /**
             * Lastname
             * @description New last name. Surrounding whitespace is stripped.
             */
            lastname?: string;
        };
        /**
         * PreferredMeetingTool
         * @enum {string}
         */
        PreferredMeetingTool: "discord" | "in_person" | "microsoft_teams" | "phone";
        /**
         * RatePutRequest
         * @description Body of `PUT /students/{party_id}/rates/{valid_from}`: the whole rate of that day.
         *
         *     It replaces amount and note of a rate already set for the day; the same values again change nothing.
         */
        RatePutRequest: {
            /**
             * Cents Per Hour
             * @description The rate in cents per hour: 0 or more, divisible by 4.
             * @example 3000
             */
            cents_per_hour: number;
            /**
             * Note
             * @description Free-text note; leaving it out clears it.
             */
            note?: string | null;
        };
        /**
         * RateResponse
         * @description A student's own rate from a day on; it holds until the day of the next one.
         */
        RateResponse: {
            /**
             * Cents Per Hour
             * @description The rate in cents per hour, divisible by 4. 45 and 90 minutes are priced linearly.
             */
            cents_per_hour: number;
            /**
             * Created At
             * Format: date-time
             * @description When the rate was first set.
             */
            created_at: string;
            /**
             * Note
             * @description Free-text note.
             */
            note: string | null;
            /**
             * Student Id
             * Format: uuid
             * @description ID of the student's party.
             */
            student_id: string;
            /**
             * Updated At
             * Format: date-time
             * @description When amount or note last changed.
             */
            updated_at: string;
            /**
             * Valid From
             * Format: date
             * @description The day the rate takes effect.
             */
            valid_from: string;
        };
        /**
         * RefreshTokenRevokeRequest
         * @description Body of `POST /revoke`: the refresh token of the session to end.
         */
        RefreshTokenRevokeRequest: {
            /**
             * Refresh Token
             * @description A refresh token of the session - the current one or the one it replaced. A token of another client's
             *     session, or one SkillForge does not know, ends nothing and is answered the same.
             * @example sf_rt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
             */
            refresh_token: string;
        };
        /**
         * RelationDirection
         * @description A relation seen from one of its two parties: that party is the ``from`` side, or the ``to`` side.
         * @enum {string}
         */
        RelationDirection: "outgoing" | "incoming";
        /**
         * RelationResponse
         * @description A relation, seen from the party in the path.
         */
        RelationResponse: {
            /**
             * Created At
             * Format: date-time
             * @description When the relation was created.
             */
            created_at: string;
            /** @description `outgoing` if the party in the path is the one the relation starts at, `incoming` if it points to it. */
            direction: components["schemas"]["RelationDirection"];
            /** @description The party on the other side of the relation. */
            party: components["schemas"]["PartyListItem"];
            /** @description Type of the relation. */
            type: components["schemas"]["PartyRelationType"];
        };
        /**
         * Role
         * @description A view a user account holds; an account can hold several.
         *
         *     ``student``, ``tutor`` and ``guardian`` follow from the CRM, ``admin`` is assigned to the account.
         * @enum {string}
         */
        Role: "student" | "tutor" | "guardian" | "admin";
        /**
         * SevdeskContactPutRequest
         * @description Body of `PUT /parties/{party_id}/sevdesk-contact`: the contact the party's invoices go to.
         */
        SevdeskContactPutRequest: {
            /**
             * Sevdesk Contact Id
             * @description ID of the contact in sevDesk: a positive integer without leading zeros. It is stored as given; nothing is
             *     looked up in sevDesk.
             * @example 1234567
             */
            sevdesk_contact_id: string;
        };
        /**
         * SevdeskContactResponse
         * @description The link between a party and its sevDesk contact.
         */
        SevdeskContactResponse: {
            /**
             * Created At
             * Format: date-time
             * @description When the link was made.
             */
            created_at: string;
            /**
             * Party Id
             * Format: uuid
             * @description ID of the party.
             */
            party_id: string;
            /**
             * Sevdesk Contact Id
             * @description ID of the contact in sevDesk.
             */
            sevdesk_contact_id: string;
        };
        /**
         * StudentPayerResponse
         * @description Who pays for a student's lessons: what a lesson that becomes billable now stores (PD1).
         */
        StudentPayerResponse: {
            /**
             * Ambiguous
             * @description Whether several parties pay for the student: a lesson that becomes billable then stores no payer, and the
             *     CRM's `pays_for` relations are corrected first.
             */
            ambiguous: boolean;
            /**
             * Manual Billing
             * @description Whether the payer is billed by hand: their lessons never reach a draft. `false` while ambiguous.
             */
            manual_billing: boolean;
            /**
             * Payer Id
             * @description The party that pays: the one party with a `pays_for` relation to the student - a person or a company - or the
             *     student itself when none has. `null` when several have.
             */
            payer_id: string | null;
            /**
             * Sevdesk Contact Linked
             * @description Whether the payer has a sevDesk contact; without one there is no invoice draft. `false` while ambiguous.
             */
            sevdesk_contact_linked: boolean;
            /**
             * Student Id
             * Format: uuid
             * @description ID of the student's party.
             */
            student_id: string;
        };
        /**
         * StudentRole
         * @description The student role of a person.
         */
        StudentRole: {
            /** @description How the student prefers to meet their tutor. */
            preferred_meeting_tool: components["schemas"]["PreferredMeetingTool"];
            /**
             * Subjects
             * @description The subjects the student takes lessons in, ordered by title.
             */
            subjects: components["schemas"]["SubjectResponse"][];
        };
        /**
         * StudentRoleRequest
         * @description Body of `PUT /persons/{party_id}/student`, and the `student` of `POST /persons`.
         */
        StudentRoleRequest: {
            /**
             * @description How the student prefers to meet their tutor.
             * @example discord
             */
            preferred_meeting_tool: components["schemas"]["PreferredMeetingTool"];
            /**
             * Subject Ids
             * @description IDs of the subjects the student takes lessons in. Replaces the whole set; duplicates collapse.
             * @example [
             *       1,
             *       2
             *     ]
             */
            subject_ids?: number[];
        };
        /**
         * SubjectCreateRequest
         * @description Body of `POST /subjects`.
         */
        SubjectCreateRequest: {
            /**
             * Title
             * @description Title of the subject. Surrounding whitespace is stripped; must be unique regardless of case.
             * @example Mathematics
             */
            title: string;
        };
        /**
         * SubjectResponse
         * @description A subject students learn and tutors teach.
         */
        SubjectResponse: {
            /**
             * Id
             * @description ID of the subject.
             */
            id: number;
            /**
             * Title
             * @description Title of the subject, unique regardless of case.
             */
            title: string;
        };
        /**
         * SubjectUpdateRequest
         * @description Body of `PATCH /subjects/{subject_id}`: only the fields that are sent change.
         */
        SubjectUpdateRequest: {
            /**
             * Title
             * @description New title of the subject. Surrounding whitespace is stripped; must be unique regardless of case.
             */
            title?: string;
        };
        /** SystemHealthCheckResponse */
        SystemHealthCheckResponse: {
            dependencies: components["schemas"]["DependenciesHealthCheckResponse"];
            status: components["schemas"]["HealthStatus"];
            /** Version */
            version: string;
            workers: components["schemas"]["WorkersHealthCheckResponse"];
        };
        /**
         * TutorRole
         * @description The tutor role of a person.
         */
        TutorRole: {
            /**
             * Subjects
             * @description The subjects the tutor teaches, ordered by title.
             */
            subjects: components["schemas"]["SubjectResponse"][];
        };
        /**
         * TutorRoleRequest
         * @description Body of `PUT /persons/{party_id}/tutor`, and the `tutor` of `POST /persons`.
         */
        TutorRoleRequest: {
            /**
             * Subject Ids
             * @description IDs of the subjects the tutor teaches. Replaces the whole set; duplicates collapse.
             * @example [
             *       1,
             *       2
             *     ]
             */
            subject_ids?: number[];
        };
        /**
         * UserAccountCreateRequest
         * @description Body of `POST /users`: the person party an account is created for.
         */
        UserAccountCreateRequest: {
            /**
             * Email
             * @description Login e-mail address, needed for the password login. Stored lowercased, unique across all accounts. Omit
             *     it or send `null` for an account without one.
             * @example anna.schmidt@example.org
             */
            email?: string | null;
            /**
             * Party Id
             * Format: uuid
             * @description ID of the person party the account belongs to. A company cannot hold one, a party at most one.
             * @example 7d9f4f3e-1c2b-4a5d-9e8f-0a1b2c3d4e5f
             */
            party_id: string;
            /**
             * Roles
             * @description Stored roles to give the account. The other roles follow from the CRM and cannot be set.
             * @example [
             *       "admin"
             *     ]
             */
            roles?: components["schemas"]["UserAccountRoleName"][];
        };
        /**
         * UserAccountDetail
         * @description A user account with everything an administrator needs - never the hash or the login counter.
         */
        UserAccountDetail: {
            /**
             * Created At
             * Format: date-time
             * @description When the account was created.
             */
            created_at: string;
            /**
             * Email
             * @description Login e-mail address, lowercased; `null` when the account has none.
             */
            email: string | null;
            /**
             * Has Password
             * @description Whether a password is set; an account without one cannot log in with a password yet.
             */
            has_password: boolean;
            /**
             * Id
             * Format: uuid
             * @description ID of the user account; the tokens of the person carry it as `principal_id`.
             */
            id: string;
            /**
             * Last Login At
             * @description When the person last logged in with their password; `null` until then - a Discord-user exchange is no login.
             */
            last_login_at: string | null;
            /**
             * Locked Until
             * @description Until when the password login is locked after failed attempts; `null` while it is not locked.
             */
            locked_until: string | null;
            /**
             * Party Id
             * Format: uuid
             * @description ID of the person party the account belongs to.
             */
            party_id: string;
            /**
             * Roles
             * @description Every role the account holds, stored (`admin`) and derived from the CRM, sorted.
             */
            roles: components["schemas"]["Role"][];
            /** @description `active` from its creation; a `disabled` account cannot log in. */
            status: components["schemas"]["UserAccountStatus"];
            /**
             * Updated At
             * Format: date-time
             * @description When the account was last changed.
             */
            updated_at: string;
        };
        /**
         * UserAccountListItem
         * @description A user account as one entry of the list.
         */
        UserAccountListItem: {
            /**
             * Created At
             * Format: date-time
             * @description When the account was created.
             */
            created_at: string;
            /**
             * Email
             * @description Login e-mail address, lowercased; `null` when the account has none.
             */
            email: string | null;
            /**
             * Has Password
             * @description Whether a password is set; an account without one cannot log in with a password yet.
             */
            has_password: boolean;
            /**
             * Id
             * Format: uuid
             * @description ID of the user account; the tokens of the person carry it as `principal_id`.
             */
            id: string;
            /**
             * Last Login At
             * @description When the person last logged in with their password; `null` until then - a Discord-user exchange is no login.
             */
            last_login_at: string | null;
            /**
             * Party Id
             * Format: uuid
             * @description ID of the person party the account belongs to.
             */
            party_id: string;
            /**
             * Roles
             * @description Every role the account holds, stored (`admin`) and derived from the CRM, sorted.
             */
            roles: components["schemas"]["Role"][];
            /** @description `active` from its creation; a `disabled` account cannot log in. */
            status: components["schemas"]["UserAccountStatus"];
        };
        /**
         * UserAccountRoleName
         * @enum {string}
         */
        UserAccountRoleName: "admin";
        /**
         * UserAccountStatus
         * @enum {string}
         */
        UserAccountStatus: "active" | "disabled";
        /**
         * UserAccountUpdateRequest
         * @description Body of `PATCH /users/{user_id}`: only the fields that are sent change.
         */
        UserAccountUpdateRequest: {
            /**
             * Email
             * @description New login e-mail address, or `null` to remove it - refused while the account has a password. A change
             *     invalidates the account's unused invitation and reset tokens.
             */
            email?: string | null;
            /**
             * Status
             * @description New status. `disabled` revokes every session of the account; `active` is always allowed.
             */
            status?: components["schemas"]["UserAccountStatus"];
        };
        /** WorkerHealthCheckResponse */
        WorkerHealthCheckResponse: {
            status: components["schemas"]["HealthStatus"];
            worker_name: components["schemas"]["WorkerName"];
        };
        /**
         * WorkerName
         * @enum {string}
         */
        WorkerName: "housekeeping";
        /** WorkersHealthCheckResponse */
        WorkersHealthCheckResponse: {
            /** Checks */
            checks: {
                [key: string]: components["schemas"]["HealthStatus"];
            };
            status: components["schemas"]["HealthStatus"];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    system_root: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    auth_read_application_clients: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ApplicationClientResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_create_application_client: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplicationClientCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApplicationClientResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_read_application_client: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApplicationClientResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_update_application_client: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplicationClientUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApplicationClientResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_grant_application_client_scopes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplicationClientScopeGrantRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApplicationClientResponse"];
                };
            };
            /** @description Invalid requested scope */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_revoke_application_client_scope: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
                /** @description Mode of the grant: `application` (for the client itself) or `delegated` (the ceiling for people). */
                mode: components["schemas"]["GrantMode"];
                /** @description Scope of the grant. */
                scope_key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client not found / Application client scope grant not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_create_application_client_secret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplicationClientSecretCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedClientSecretResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_revoke_application_client_secret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                client_id: string;
                secret_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:clients:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Application client not found / Application client secret not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_list_discord_links: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
                /** @description Only items changed at or after this instant, the boundary included. Write the offset as `Z` or percent-encode the `+`. A change carries the start time of its transaction and can appear behind newer ones: ask from the newest `updated_at` seen minus an overlap (5 minutes), and keep it fixed while paging. Deleted items are not reported, and pages are not a snapshot: filter by fixed facts only, and compare in full now and then. See "Change signals" in docs/ARCHITECTURE.md. */
                updated_since?: string | null;
                /** @description Only the links of this person party. */
                party_id?: string | null;
                /** @description Only active (`true`) or only unlinked (`false`) links. */
                active?: boolean | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_DiscordLink_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:discord-links:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_redeem_discord_link_code: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DiscordLinkRedeemRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiscordLink"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:exchange */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The Discord account is linked to another party */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid or expired token */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_get_discord_link: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The Discord user's snowflake, as a decimal string. */
                discord_user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiscordLink"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:discord-links:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Discord link not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_link_discord_account: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The Discord user's snowflake, as a decimal string. */
                discord_user_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DiscordLinkRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiscordLink"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The Discord account is linked to another party */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown party / A Discord link belongs to a person, not to a company */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_unlink_discord_account: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The Discord user's snowflake, as a decimal string. */
                discord_user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Discord link not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_get_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_redeem_password: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordRedeemRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:login */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid or expired token / Password must be text of 8 to 128 characters */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_revoke_refresh_token: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenRevokeRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:login */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_create_token: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/x-www-form-urlencoded": components["schemas"]["Body_auth_create_token"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccessTokenResponse"];
                };
            };
            /** @description Unsupported grant_type / Invalid requested scope / Invalid credentials or refresh token / Client may not use this grant */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid client credentials */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description A required parameter is missing */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_list_users: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
                /** @description Only accounts in this status. */
                status?: components["schemas"]["UserAccountStatus"] | null;
                /** @description Only the account of this party; a party has at most one. */
                party_id?: string | null;
                /** @description Only the account with this login e-mail address, compared in its canonical form. */
                email?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_UserAccountListItem_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_create_user: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserAccountCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAccountDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The party already has a user account / Another user account uses this e-mail address */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown party / A user account belongs to a person, not to a company */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_get_user: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAccountDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_update_user: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserAccountUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAccountDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Another user account uses this e-mail address / The state of the user account does not allow this */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_issue_discord_link_code: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionTokenResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The state of the user account does not allow this */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_issue_invitation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionTokenResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The state of the user account does not allow this */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_issue_password_reset: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionTokenResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The state of the user account does not allow this */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_add_user_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
                /** @description A stored role; the other roles follow from the CRM. */
                role: components["schemas"]["UserAccountRoleName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAccountDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_remove_user_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
                /** @description A stored role; the other roles follow from the CRM. */
                role: components["schemas"]["UserAccountRoleName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found / The user account does not hold this role */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    auth_revoke_user_sessions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the user account. */
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: auth:users:manage */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User account not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_list_calendar_aliases: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_CalendarAliasResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_create_calendar_alias: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CalendarAliasCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CalendarAliasResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description An alias for this calendar name already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown student */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_delete_calendar_alias: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the calendar alias. */
                alias_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Calendar alias not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_list_calendar_events: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_CalendarEventResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_assign_calendar_event: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the calendar occurrence. */
                event_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CalendarEventAssignRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Calendar event not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The calendar event already has a lesson / The student already has a lesson at this start / An alias for this calendar name already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown student / The calendar event cannot become a lesson: its start is not on a whole minute */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_dismiss_calendar_event: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the calendar occurrence. */
                event_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Calendar event not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_import_calendar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CalendarImportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CalendarImportResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The lesson calendar could not be read */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_list_lessons: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
                /** @description Only lessons starting on this day or later, as a day in `Europe/Berlin` (included). */
                from?: string | null;
                /** @description Only lessons starting on this day or earlier, as a day in `Europe/Berlin` (included). */
                to?: string | null;
                /** @description Only lessons of this student party. */
                student_id?: string | null;
                /** @description Only lessons in this status. */
                status?: components["schemas"]["LessonStatus"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_LessonResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_create_lesson: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LessonCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The student already has a lesson at this start */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown student / A rate must be at least 0 cents per hour and divisible by 4 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_get_lesson: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the lesson. */
                lesson_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Lesson not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_update_lesson: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the lesson. */
                lesson_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LessonUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Lesson not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The student already has a lesson at this start */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown student / A rate must be at least 0 cents per hour and divisible by 4 / Only a held or cancelled lesson can be billable */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_resolve_lesson_payer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the lesson. */
                lesson_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonPayerResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Lesson not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_put_manual_billing: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party: a person or a company. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ManualBillingPutRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ManualBillingResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_delete_manual_billing: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party: a person or a company. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_put_sevdesk_contact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party: a person or a company. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SevdeskContactPutRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SevdeskContactResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The party or the sevDesk contact is already linked */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_delete_sevdesk_contact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party: a person or a company. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_get_payment_request: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The invoice's number as sevDesk prints it: capitals, digits, `.`, `_` and `-`, at most 32 characters, starting with a capital or a digit. */
                invoice_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentRequest"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:payment:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description No payable invoice has this number */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description sevDesk could not be read / sevDesk was not called: its configuration was refused */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_get_student_payer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the student's party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudentPayerResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_list_rates: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
            };
            header?: never;
            path: {
                /** @description ID of the student's party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_RateResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_put_rate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the student's party. */
                party_id: string;
                /** @description The day the rate takes effect; it holds until the next rate's day. */
                valid_from: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RatePutRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RateResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown student / A rate must be at least 0 cents per hour and divisible by 4 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    billing_delete_rate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the student's party. */
                party_id: string;
                /** @description The day the rate takes effect; it holds until the next rate's day. */
                valid_from: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: billing:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found / Rate not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_create_company: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompanyCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_update_company: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompanyUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Company not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_list_parties: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
                /** @description Only parties of this type. */
                type?: components["schemas"]["PartyType"] | null;
                /** @description Only persons holding this role. */
                role?: components["schemas"]["PartyRole"] | null;
                /** @description Only persons having this subject - in the given `role`, or in any role without one. */
                subject_id?: number | null;
                /** @description Search text, split on whitespace. Every word must appear, ignoring case, in the first name, the last name, the company name or a contact value. Searching for an e-mail address doubles as the duplicate check before creating a party. A phone number is stored in E.164 (`+491711234567`), so search for its digits without the national leading zero: `171 1234567`. */
                q?: string | null;
                /** @description Only items changed at or after this instant, the boundary included. Write the offset as `Z` or percent-encode the `+`. A change carries the start time of its transaction and can appear behind newer ones: ask from the newest `updated_at` seen minus an overlap (5 minutes), and keep it fixed while paging. Deleted items are not reported, and pages are not a snapshot: filter by fixed facts only, and compare in full now and then. See "Change signals" in docs/ARCHITECTURE.md. */
                updated_since?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_PartyListItem_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:read or crm:read:own */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_get_party: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartyDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:read or crm:read:own */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_delete_party: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party is still in use */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_add_contact_info: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactInfoCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactInfoResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Contact info already exists for this party */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_remove_contact_info: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
                /** @description ID of the contact info, as listed in the party detail. */
                contact_info_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Contact info not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_update_contact_info: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
                /** @description ID of the contact info, as listed in the party detail. */
                contact_info_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactInfoUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactInfoResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Contact info not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Contact info already exists for this party */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Value is not valid for this contact info type */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_list_relations: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
                /** @description `outgoing`: only relations starting at this party; `incoming`: only those pointing to it. Both by default. */
                direction?: components["schemas"]["RelationDirection"] | null;
                /** @description Only relations of this type. */
                type?: components["schemas"]["PartyRelationType"] | null;
            };
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_RelationResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_put_relation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
                /** @description Type of the relation, read from the first party: `{party_id}` is `parent_of` `{to_party_id}`. */
                type: components["schemas"]["PartyRelationType"];
                /** @description ID of the party the relation points to, e.g. the child of `parent_of`. */
                to_party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RelationResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party not found / Related party not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Invalid party relation */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_remove_relation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
                /** @description Type of the relation, read from the first party: `{party_id}` is `parent_of` `{to_party_id}`. */
                type: components["schemas"]["PartyRelationType"];
                /** @description ID of the party the relation points to, e.g. the child of `parent_of`. */
                to_party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Party relation not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_create_person: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PersonCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown subject */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_update_person: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PersonUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Person not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_put_student_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StudentRoleRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Person not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown subject */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_remove_student_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Person not found / Role not assigned */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_put_tutor_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TutorRoleRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonDetail"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Person not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unknown subject */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_remove_tutor_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the party. */
                party_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Person not found / Role not assigned */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_list_subjects: {
        parameters: {
            query?: {
                /** @description Maximum number of items to return. */
                limit?: number;
                /** @description Number of items to skip before the first returned item. */
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_SubjectResponse_"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:read */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_create_subject: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubjectCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Subject already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_delete_subject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the subject. */
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Subject not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Subject is still assigned to students or tutors */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    crm_update_subject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of the subject. */
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubjectUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectResponse"];
                };
            };
            /** @description Missing or invalid bearer token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Missing required scope: crm:write */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Subject not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Subject already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    system_health_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SystemHealthCheckResponse"];
                };
            };
        };
    };
    system_dependencies_health_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DependenciesHealthCheckResponse"];
                };
            };
        };
    };
    system_dependency_health_check: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                dependency_name: components["schemas"]["DependencyName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DependencyHealthCheckResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    system_liveness_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthCheckResponse"];
                };
            };
        };
    };
    system_workers_health_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkersHealthCheckResponse"];
                };
            };
        };
    };
    system_worker_health_check: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                worker_name: components["schemas"]["WorkerName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkerHealthCheckResponse"];
                };
            };
            /** @description Request validation failed */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "code": "validation_error",
                     *       "detail": "Request validation failed",
                     *       "errors": [
                     *         {
                     *           "loc": [
                     *             "query",
                     *             "limit"
                     *           ],
                     *           "message": "Input should be less than or equal to 100",
                     *           "type": "less_than_equal"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}

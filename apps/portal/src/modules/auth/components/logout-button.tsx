import { Button } from "@skillsite/ui/primitives/button";
import { logoutButton } from "@/content/login";

import { logout } from "../server/actions";

/** Logs the admin out: a form posting to the `logout` server action, so it works without script too. */
export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        {logoutButton.label}
      </Button>
    </form>
  );
}

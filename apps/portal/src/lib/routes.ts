/** The portal's routes. */
export const routes = {
  /** The admin area's start page. */
  home: "/",
  login: "/login",
  health: "/health",
} as const;

/** Routes open without a session: the proxy never redirects them. */
export const publicRoutes: readonly string[] = [routes.login, routes.health];

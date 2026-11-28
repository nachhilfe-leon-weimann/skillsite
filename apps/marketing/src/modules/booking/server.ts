import "server-only";

/** Server entry of the booking module: the availability and funnel-event API handlers. */
export { handleAvailabilityRequest } from "./server/availability-route";
export { handleBookingEventRequest } from "./server/analytics";

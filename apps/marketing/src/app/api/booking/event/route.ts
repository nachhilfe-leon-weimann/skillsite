import { handleBookingEventRequest } from "@/modules/booking/server";

export const POST = (request: Request) => handleBookingEventRequest(request);

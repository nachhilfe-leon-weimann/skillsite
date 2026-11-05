import { handleAvailabilityRequest } from "@/modules/booking/server";

export const GET = (request: Request) => handleAvailabilityRequest(request);

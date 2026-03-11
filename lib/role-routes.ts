import type { ProfileRole } from "@/lib/supabase";

export const hirerRoutes = ["/discover", "/bookings", "/receipts", "/inbox", "/request", "/support"];
export const employerRoutes = ["/worker", "/worker/jobs", "/worker/inbox"];

export function getDefaultRouteForRole(role: ProfileRole) {
  return role === "employer" ? "/worker" : "/discover";
}

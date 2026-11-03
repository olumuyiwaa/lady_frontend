import type { CurrentUser } from "@/app/api/auth.api";

/** Everyone who signs in lands on the dashboard (there is no platform admin). */
export function postLoginPath(_user: CurrentUser | null | undefined): string {
  return "/dashboard";
}

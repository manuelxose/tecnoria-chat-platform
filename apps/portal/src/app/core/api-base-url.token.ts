import { isPlatformBrowser } from "@angular/common";
import { inject, InjectionToken, PLATFORM_ID } from "@angular/core";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

export const API_BASE_URL = new InjectionToken<string>("API_BASE_URL", {
  providedIn: "root",
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      return "/api";
    }

    const internalUrl =
      typeof process !== "undefined" ? process.env["API_INTERNAL_URL"]?.trim() : "";

    return normalizeBaseUrl(internalUrl || "http://127.0.0.1:4101");
  },
});

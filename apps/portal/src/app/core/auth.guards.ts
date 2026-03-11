import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { SessionStore } from "./session.store";

export const authGuard: CanActivateFn = async () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  await store.ensureLoaded();
  return store.user() ? true : router.createUrlTree(["/login"]);
};

export const superadminGuard: CanActivateFn = async () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  await store.ensureLoaded();
  const user = store.user();
  if (!user) {
    return router.createUrlTree(["/login"]);
  }
  return user.platformRole === "superadmin" ? true : router.createUrlTree(["/app"]);
};

import { Injectable, inject, signal } from "@angular/core";
import { PortalApiService } from "./portal-api.service";
import { PortalUser } from "./models";

@Injectable({ providedIn: "root" })
export class SessionStore {
  private readonly api = inject(PortalApiService);

  readonly user = signal<PortalUser | null>(null);
  readonly loading = signal(false);
  readonly ready = signal(false);

  async ensureLoaded(): Promise<void> {
    if (this.ready() || this.loading()) {
      return;
    }

    this.loading.set(true);
    try {
      this.user.set(await this.api.me());
    } finally {
      this.ready.set(true);
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<PortalUser> {
    const user = await this.api.login(email, password);
    this.user.set(user);
    this.ready.set(true);
    return user;
  }

  async logout(): Promise<void> {
    await this.api.logout();
    this.user.set(null);
    this.ready.set(true);
  }
}

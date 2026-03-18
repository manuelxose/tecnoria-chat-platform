import { Injectable, signal, computed } from "@angular/core";
import { Tenant } from "../core/models";

@Injectable({ providedIn: "root" })
export class CockpitStore {
  readonly tenants = signal<Tenant[]>([]);
  readonly activeTenantId = signal<string>("");

  readonly activeTenant = computed(() =>
    this.tenants().find((t) => t.id === this.activeTenantId()) ?? null
  );

  setTenants(tenants: Tenant[]): void {
    this.tenants.set(tenants);
    if (tenants.length && !this.activeTenantId()) {
      this.activeTenantId.set(tenants[0].id);
    }
  }

  setActiveTenantId(id: string): void {
    this.activeTenantId.set(id);
  }
}

import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

export const tenantStore = new AsyncLocalStorage<TenantContext>();

export class TenantSecurity {
  public static currentId(): string {
    const context = tenantStore.getStore();
    if (!context) throw new Error("TENANT_CONTEXT_MISSING: Access attempted outside of tenant context.");
    return context.tenantId;
  }
}

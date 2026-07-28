const fallbackTenant = "acmehealth";
const tenantFromEnv = import.meta.env.VITE_INFOVEAVE_TENANT?.trim();

export const INFOVEAVE_TENANT = tenantFromEnv || fallbackTenant;
export const INFOVEAVE_BASE_URL = `https://${INFOVEAVE_TENANT}.infoveave.app`;

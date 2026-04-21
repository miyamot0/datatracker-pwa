// Roles for data collectors
export const DataCollectorRoles = {
  Primary: 'Primary',
  Reliability: 'Reliability',
} as const;

// Type for data collector roles
export type DataCollectorRolesType = (typeof DataCollectorRoles)[keyof typeof DataCollectorRoles];

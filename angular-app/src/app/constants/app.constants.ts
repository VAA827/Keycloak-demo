export const TOKEN_CLAIMS = {
  USERNAME: 'preferred_username',
  NAME: 'name',
  EMAIL: 'email',
  SUB: 'sub',
  REALM_ACCESS: 'realm_access',
  ROLES: 'roles'
} as const;

export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
} as const;

export const DEFAULT_VALUES = {
  FALLBACK_USERNAME: 'Felhasználó',
  FALLBACK_EMAIL: 'Nem elérhető',
  ERROR_USERNAME: 'Hiba',
  NO_TOKEN: 'Token hiányzik'
} as const;

export const LOG_PREFIXES = {
  APP: '🚀 APP:',
  PROFILE: '👤 PROFILE:',
  HOME: '🏠 HOME:',
  AUTH: '🔐 AUTH:'
} as const;
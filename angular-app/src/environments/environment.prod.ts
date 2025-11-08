export const environment = {
  production: true,
  // PRODUCTION: Frissítsd a saját domain nevedre!
  apiUrl: 'https://api.varganet.cloud',
  keycloak: {
    // Példa: https://auth.varganet.cloud
    url: 'https://auth.varganet.cloud',
    realm: 'biometric-2fa',
    clientId: 'angular-app'
  }
};

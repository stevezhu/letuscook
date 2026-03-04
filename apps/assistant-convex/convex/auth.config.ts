import { AuthConfig } from 'convex/server';

const clientId = process.env.WORKOS_CLIENT_ID;
if (!clientId) {
  throw new Error('WORKOS_CLIENT_ID is not set');
}

export default {
  providers: [
    {
      type: 'customJwt' as const,
      issuer: 'https://api.workos.com/',
      algorithm: 'RS256' as const,
      applicationID: clientId,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
    {
      type: 'customJwt' as const,
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: 'RS256' as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
} satisfies AuthConfig;

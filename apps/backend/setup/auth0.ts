import { auth } from 'express-oauth2-jwt-bearer';
import { ManagementClient } from 'auth0'
import dotenv from 'dotenv'

// Load environment variables before creating Auth0 clients.
dotenv.config()

// Middleware that validates incoming JWTs against the Auth0 tenant.
// This protects API routes that require authenticated requests.
export const checkJWT = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});

export const management = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

export async function getManagementToken(): Promise<string> {
    const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: process.env.AUTH0_MGMT_CLIENT_ID,
            client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        }),
    });
    const data = await res.json();

    // Fail fast if Auth0 does not return a usable access token.
    if (!data.acess_token) {
    throw new Error('No acess token provided');
    }

    return data.acess_token;
}

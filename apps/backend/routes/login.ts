import { Router } from "express";
import { ManagementClient } from 'auth0';
import { auth } from "express-oauth2-jwt-bearer";
import pkg from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import { checkExpiringDocuments } from './notifications.js';

// Create a Prisma adapter that points at the main database connection.
const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

const { PrismaClient } = pkg;
const prisma = new PrismaClient({adapter});
const router = Router();

// JWT validation middleware for Auth0-protected routes.
// Requests must include a valid access token issued by the configured tenant.
const checkJWT = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});

// Sync the logged-in Auth0 user into the local employee table.
// If the employee already exists, refresh login state and username details.
router.post('/api/auth/login', checkJWT, async (req, res) => {
    try {

        // Auth0 subject is the stable unique identifier for this user.
        const auth0Id = req.auth!.payload.sub as string;

        // Prefer common profile fields so the app can fall back gracefully
        // when a particular claim is not present in the token.
        const username =
            (req.auth!.payload['preferred_username'] as string | undefined) ||
            (req.auth!.payload['name'] as string | undefined) ||
            (req.auth!.payload['nickname'] as string | undefined) ;

        if (!username) {
            return res.status(400).json({ error: 'Missing username in token payload' });
        }

        // Match first by Auth0 ID, since that is the most reliable identifier.
        let employee = await prisma.employee.findUnique({ where: { auth0Id } });

        if (employee) {
            employee = await prisma.employee.update({
                where: { empid: employee.empid },
                data: {
                    isLoggedIn: true,
                },
            });
        } else {
            // If no Auth0-linked record exists, try to match by username
            // so existing employees can be linked to a new Auth0 account.
            const employeeByUsername = await prisma.employee.findUnique({ where: { username } });

            if (employeeByUsername) {
                employee = await prisma.employee.update({
                    where: { empid: employeeByUsername.empid },
                    data: {
                        auth0Id,
                        isLoggedIn: true,
                    },
                });
            } else {
                // Otherwise create a brand-new employee record for the user.
                employee = await prisma.employee.create({
                    data: {
                        auth0Id,
                        username,
                        isLoggedIn: true,
                    },
                });
            }
        }

        res.json({ employee });
        
        await checkExpiringDocuments(employee.empid);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login sync failed' });
    }
});

// Return the current user's local employee profile based on the Auth0 subject.
router.get('/api/auth/me', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const employee = await prisma.employee.findUnique({ where: { auth0Id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    res.json({ employee });
});

// Logout is intentionally lightweight here because session state is handled
// on the client/Auth0 side; this endpoint mainly provides a consistent API.
router.post('/api/auth/logout', checkJWT, async (_req, res) => {
    res.json({ message: 'Logged out' });
});

export default router;

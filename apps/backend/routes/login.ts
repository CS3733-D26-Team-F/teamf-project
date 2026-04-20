import { Router } from "express";
import { ManagementClient } from 'auth0';
import { auth } from "express-oauth2-jwt-bearer";
import pkg from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

const { PrismaClient } = pkg;
const prisma = new PrismaClient({adapter});
const router = Router();

const checkJWT = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});

router.post('/api/auth/login', checkJWT, async (req, res) => {
    try {
        console.log("Body =", req.body);
        console.log("Payload =", req.auth!.payload);
        console.log("=================================================Here1");
        const auth0Id = req.auth!.payload.sub as string;
        const username =
            (req.auth!.payload['nickname'] as string | undefined) ||
            (req.auth!.payload['preferred_username'] as string | undefined) ||
            (req.auth!.payload['name'] as string | undefined);

        if (!username) {
            return res.status(400).json({ error: 'Missing username in token payload' });
        }

        let employee = await prisma.employee.findUnique({ where: { auth0Id } });

        if (employee) {
            employee = await prisma.employee.update({
                where: { empid: employee.empid },
                data: {
                    username,
                    isLoggedIn: true,
                },
            });
        } else {
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
        console.log("=================================================Here2");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login sync failed' });
    }
});

router.get('/api/auth/me', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const employee = await prisma.employee.findUnique({ where: { auth0Id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    res.json({ employee });
});

// Possible for additional logout options
router.post('/api/auth/logout', checkJWT, async (_req, res) => {
    res.json({ message: 'Logged out' });
});

export default router;
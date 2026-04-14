import dotenv from 'dotenv';
dotenv.config({ path: 'C:/Users/mrden/WebstormProjects/teamf-project2/apps/backend/.env' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function getManagementToken(): Promise<string> {
    const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type:    'client_credentials',
            client_id:     process.env.AUTH0_MGMT_CLIENT_ID,
            client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
            audience:      `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        }),
    });
    const data = await res.json();
    return data.access_token;
}

// Use this to migrate a new employee over by hand, run this on its own with the employee username, password, and persona passed at the bottom

async function addEmployee(username: string, password: string, persona: string) {
    const token = await getManagementToken();

    // Try to create in Auth0, if already exists fetch them instead
    let auth0UserId: string;

    const createRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
        method: 'POST',
        headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            connection:     'Username-Password-Authentication',
            username,
            password,
            email:          `${username}@noemail.internal`,
            email_verified: true,
        }),
    });

    const createData = await createRes.json();

    if (createData.user_id) {
        // Successfully created
        auth0UserId = createData.user_id;
        console.log(`✓ Created in Auth0: ${username}`);
    } else if (createData.statusCode === 409) {
        // Already exists in Auth0 — fetch them by username instead
        console.warn(`Already exists in Auth0, fetching existing user: ${username}`);
        const searchRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/users?q=username%3A${username}&search_engine=v3`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const users = await searchRes.json();

        if (!users.length) {
            console.error(`Could not find existing Auth0 user: ${username}`);
            return;
        }
        auth0UserId = users[0].user_id;
        console.log(`✓ Found existing Auth0 user: ${username} → ${auth0UserId}`);
    } else {
        console.error('Failed to create in Auth0:', createData);
        return;
    }

    // Upsert into Supabase
    await prisma.employee.upsert({
        where:  { username },
        update: { auth0Id: auth0UserId },
        create: {
            auth0Id:    auth0UserId,
            username,
            persona,
            created_at: new Date(),
        },
    });

    console.log(`✓ Synced to Supabase: ${username} → ${auth0UserId}`);
    await prisma.$disconnect();
}

addEmployee('jswiss', 'jswiss', 'Admin').catch(console.error);
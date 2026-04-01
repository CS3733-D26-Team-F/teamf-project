import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'db';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL })
});

async function main() {
    console.log("Connecting to the database...\n");

    const employees = await prisma.employee.findMany();
    console.log("--- Employee Data ---");
    console.dir(employees, { depth: null });

    const contentItems = await prisma.contentForm.findMany();
    console.log("\n--- Content Data ---");
    console.dir(contentItems, { depth: null });
}

main()
    .catch((e) => {
        console.error("Error fetching data: ", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
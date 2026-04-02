import express from 'express';
import morgan from 'morgan';
const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

dotenv.config();

const adapter = new PrismaPg( {
    connectionString: process.env.DATABASE_URL,
    });
const prisma = new PrismaClient({adapter});
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('dev'));
// Send HTTP 200 at root
app.get('/', (req, res) => {
    res.sendStatus(200);
});
app.get('/employees', async (req, res) => {
    try {
        const employees = await prisma.employee.findMany();
        console.log ('Employee Data:', employees)
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).send('Not Found');
    }
});
app.get('/contentforms', async (req, res) => {
    try {
        const contentForms = await prisma.contentform.findMany();
        console.log ('Employee Data:', contentForms)
        res.json(contentForms);
    } catch (error) {
        console.error(error);
        res.status(500).send('Not Found');
    }
});
app.get('/employee_manage', async (req, res) => {
    try {
        const employeeManage = await prisma.employee_manage.findMany();
        console.log ('Employee Data:', employeeManage)
        res.json(employeeManage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Not Found');
    }
});
// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
export default app;
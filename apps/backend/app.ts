import express from 'express';
import morgan from 'morgan';
const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import cors from 'cors';
app.use(cors());

dotenv.config();

const adapter = new PrismaPg( {
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
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
app.post('/employees', async (req, res) => {
    try {
        const { first_name, last_name, email, persona, salary } = req.body;
        const employee = await prisma.employee.create({
            data: { first_name, last_name, email, persona, salary }
        });
        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating employee');
    }
});
app.post('/contentforms', async (req, res) => {
    try {
        const { name, url, owner, persona, date_modified, expiration_date, content_type, status } = req.body;
        const content = await prisma.contentform.create({
            data: {
                name,
                url,
                owner,
                persona,
                date_modified: new Date(date_modified),
                expiration_date: new Date(expiration_date),
                content_type,x
                status }
        });
        res.json(content);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating content');
    }
});
// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
export default app;
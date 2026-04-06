import express from 'express';
import morgan from 'morgan';
const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

dotenv.config();

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({adapter});
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.get('/employees', async (req, res) => {
    const employees = await prisma.employee.findMany();
    console.log('Employee Data:', employees);
    res.json(employees);
});

app.get('/contentforms', async (req, res) => {
    const contentForms = await prisma.contentform.findMany();
    console.log('Content Form Data:', contentForms);
    res.json(contentForms);
});

app.get('/employee_manage', async (req, res) => {
    const employeeManage = await prisma.employee_manage.findMany();
    console.log('Employee Manage Data:', employeeManage);
    res.json(employeeManage);
});

app.post('/login', async (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).send('Please input username and password');
    }

    const employee = await prisma.employee.findFirst({
        where: {username: username}
    });

    if (employee && employee.password === password) {
        console.log(`Okay: ${username}`);
        return res.status(200).json({
            message: 'okay',
            employee: {
                empid: employee.empid,
                username: employee.username
            }
        });
    } else {
        console.log(`failed: ${username}`);
        return res.status(401).send('Invalid username or password');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
export default app;
import express from 'express';
import morgan from 'morgan';
const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from "@prisma/adapter-pg";

dotenv.config();

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
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

    const employee = await prisma.employee.findUnique({
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

app.post('/getEmployee', async (req, res) => {
    const {username} = req.body;

    if (!username) {
        return res.status(400).send('Missing field required');
    }

    try {
        const employee = await prisma.employee.findUniqueOrThrow({
            where: {
                username: username,
            }
        });
        return res.status(200).json({
            message: 'Employee found',
            data: employee
        });
    } catch (error) {
        res.status(404).json({ error: 'User not Found' });
    }
});

app.post('/updateEmployee', async (req, res) => {
    const {username, password, persona}
})

app.post('/addEmployee', async (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).send('Missing field required');
    }
    try {
        const newEmp = await prisma.employee.create({
            data: {
                username,
                password
            },
        });
        return res.status(200).json({
            message: 'new employee added',
            data: newEmp
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/deleteEmployee/:username', async (req, res) => {
    try{
        const { username } = req.params;

        const user = await prisma.employee.findUnique({
            where: { username: username }
        });

        if (!user) {
            return res.status(404).send('Not Found');
        }

        const deletedEmp = await prisma.employee.delete({
            where: { empid: user.empid }
        });

        return res.status(200).json({
            message: 'Employee removed',
            data: deletedEmp,
        })
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
export default app;
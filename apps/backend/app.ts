import express from 'express';
import morgan from 'morgan';
const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from "@prisma/adapter-pg";
import cors from 'cors';
app.use(cors());

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

//update employee takes the current username and then optionally any data that want to be changed
app.post('/updateEmployee', async (req, res) => {
    const {username,newUsername,password,persona} = req.body;

    if(!username) {
        return res.status(400).send('Current username is required');
    }

    const updateData: {
        username?: string;
        password?: string;
        persona?: string;
    } = {};

    if (newUsername) updateData.username = newUsername;
    if (password) updateData.password = password;
    if (persona) updateData.persona = persona;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).send('No fields to update');
    }

    try {
        const employee = await prisma.employee.update({
            where: { username: username },
            data: updateData
        });
        if (persona.trim() == 'Admin'){
            await prisma.admin.create({
                data:{
                    adid: employee.empid
                }
            })
        } else {
            const check = await prisma.admin.findUnique({
                where: { adid: employee.empid}
            });
            if (check){
                await prisma.admin.delete({
                    where: {adid: employee.empid},
                })
            }
        }
        return res.status(200).json({
            message: 'Employee updated',
            data: employee
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.post('/addEmployee', async (req, res) => {
    const {username, password, persona} = req.body;

    if (!username || !password) {
        return res.status(400).send('Missing field required');
    }

    try {
        if (persona.trim() == 'Admin'){
            const newAdmin = await prisma.employee.create({
                data: {
                    username: username,
                    password: password,
                    persona: persona,
                    admin: {
                        create: {

                        }
                    }
                },
            })
            return res.status(200).json({
                message: 'new admin added',
                data: newAdmin
            });
        } else {
            const newEmp = await prisma.employee.create({
                data: {
                    username,
                    password,
                    persona
                },
            });
            return res.status(200).json({
                message: 'new employee added',
                data: newEmp
            });
        }
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
            data: deletedEmp
        })
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/updateContentForm', async (req, res) => {
    const {name, newName, url, owner, persona, date_modified, expiration_date, content_type, status} = req.body;

    if (!name) {
        return res.status(400).send("Name of content is required");
    }

    const updateData: {
        name?: string;
        url?: string;
        owner?: string;
        persona?: string;
        date_modified?: string;
        expiration_date?: string;
        content_type?: string;
        status?: string;
    } = {};

    if (newName) updateData.name = newName;
    if (url) updateData.url = url;
    if (owner) updateData.owner = owner;
    if (persona) updateData.persona = persona;
    if (date_modified) updateData.date_modified = date_modified;
    if (expiration_date) updateData.expiration_date = expiration_date;
    if (content_type) updateData.content_type = content_type;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).send("No fields to update");
    }

    try {
        const contentForm = await prisma.contentform.update({
            where: {name: name},
            data: updateData
        });
        return res.status(200).json({
            message: 'Content form updated successfully',
            data: contentForm
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
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
                content_type,
                status,
                employee: {
                    connect: { username: owner }
                }
            }
        });
        res.json(content);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating content');
    }
});
app.post('/employee_manage', async (req, res) => {
    try {
        const { username, edits, employee, priority, email, comments } = req.body;
        const employeeManage = await prisma.employee_manage.create({
            data: { username, edits, employee, priority, email, comments }
        });
        res.json(employeeManage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating employee management request');
    }
});

app.post('/deleteContentForm', async (req, res) => {
    const {name} = req.body;

    if (!name) {
        return res.status(400).send("Name of content is required");
    }

    try {
        const contentForm = await prisma.contentform.delete({
            where: {name: name}
        });
        return res.status(200).json({
            message: 'Content form deleted successfully',
            data: contentForm
        });
    }catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
export default app;

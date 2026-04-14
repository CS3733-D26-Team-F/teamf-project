import express from 'express';
import morgan from 'morgan';
const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from "@prisma/adapter-pg";
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import multer from 'multer';
app.use(cors());
import { ManagementClient } from 'auth0';
import { auth } from "express-oauth2-jwt-bearer";


dotenv.config();

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({adapter});
const port = process.env.PORT || 3000;

//set up stuff for passing the files using multipart form data
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const upload = multer({ storage: multer.memoryStorage() });

const checkJWT = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});

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
    if (!data.access_token) {
        throw new Error(`Failed to get management token: ${JSON.stringify(data)}`);
    }
    return data.access_token;
}

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5175"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
// Send HTTP 200 at root

/**
 *
 * Requests after this
 *
 */
// Used for login
app.post('/api/auth/login', checkJWT, async (req, res) => {
    try {
        console.log("Body =", req.body);
        console.log("Payload =", req.auth.payload);
        console.log("=================================================Here1");
        const auth0Id  = req.auth!.payload.sub;
        const username = req.auth!.payload['name'] as string;

        const employee = await prisma.employee.upsert({
            where:  { auth0Id },
            update: {
                username,
                isLoggedIn: true
            },
            create: {
                auth0Id,
                username
            },
        });
        res.json({ employee });
        console.log("=================================================Here2");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login sync failed' });
    }
});

app.get('/api/auth/me', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const employee = await prisma.employee.findUnique({ where: { auth0Id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    res.json({ employee });
});

// Possible for additional logout options
app.post('/api/auth/logout', checkJWT, async (_req, res) => {
    res.json({ message: 'Logged out' });
});


app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.get('/employees', async (req, res) => {
    const employees = await prisma.employee.findMany();
    console.log('Employee Data:', employees);
    res.json(employees);
});

app.get('/contentforms', checkJWT, async (req, res) => {
    const contentForms = await prisma.contentform.findMany({
        where: {is_deleted: false}
    });
    console.log('Content Form Data:', contentForms);
    res.json(contentForms);
});

app.post('/getEmployee', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
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
app.patch('/updateEmployee', checkJWT, async (req, res) => {
    const token = await getManagementToken();
    const {username,newUsername,newPassword,persona, first_name, last_name} = req.body;

    if(!username) {
        return res.status(400).send('Current username is required');
    }

    const updateData: {
        username?: string;
        persona?: string;
        first_name?: string;
        last_name?: string;
    } = {};

    if (newUsername) updateData.username = newUsername;
    if (persona) updateData.persona = persona;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.first_name = last_name;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).send('No fields to update');
    }

    try {
        const employee = await prisma.employee.update({
            where: { username: username },
            data: updateData
        });
        const auth0Updates: Record<string, string> = {};
        if (newPassword) auth0Updates.password = newPassword;
        if (newUsername) {
            auth0Updates.username = newUsername;
            auth0Updates.email    = `${newUsername}@noemail.internal`;
        }

        const updateRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
            {
                method:  'PATCH',
                headers: {
                    Authorization:  `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(auth0Updates),
            }
        );

        if (!updateRes.ok) {
            const error = await updateRes.json();
            if (updateRes.status === 409) {
                return res.status(409).json({ error: 'Username already in use' });
            }
            return res.status(500).json({ error: 'Failed to update Auth0 user', details: error });
        }

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

app.post('/addEmployee', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {username, password, persona, first_name, last_name} = req.body;

    if (!username || !password || !persona) {
        return res.status(400).send('Missing field required');
    }

    try {
        const token = await getManagementToken();

        const createRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                connection: 'Username-Password-Authentication',
                username,
                password,
                email: `${username}@noemail.internal`,
                email_verified: true,
            }),
        });

        if (!auth0User.user_id) {
            if (auth0User.statusCode === 409) {
                return res.status(409).json({error: 'Username already exists'});
            }
            return res.status(500).json({error: 'Failed to create Auth0 user', details: auth0User});
        }

        if (persona.trim() == 'Admin'){


            const newAdmin = await prisma.employee.create({
                data: {
                    username: username,
                    password: password,
                    persona: persona,
                    first_name: first_name,
                    last_name: last_name,
                    created_at: new Date(),
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
                    persona,
                    first_name,
                    last_name,
                    created_at: new Date(),
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

app.delete('/deleteEmployee/:name', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try{
        const {username} = req.body;

        const user = await prisma.employee.findUnique({
            where: { username:username }
        });

        if (!user) {
            return res.status(404).send('Not Found');
        }

        const deleteRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
            {
                method:  'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (deleteRes.status !== 204) {
            const error = await deleteRes.json();
            return res.status(500).json({ error: 'Failed to delete from Auth0', details: error });
        }

        const deletedEmp = await prisma.employee.delete({
            where: { username: username }
        });

        return res.status(200).json({
            message: 'Employee removed',
            data: deletedEmp
        })
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/updateTheme', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const { empid, theme } = req.body;
    if (!empid || theme === undefined) {
        return res.status(400).send('Missing field required, need to provide theme');
    }

    try {
        const employee = await prisma.employee.update({
            where: { empid: empid },
            data: { theme: theme }
        });
        return res.status(200).json({
            message: 'Theme updated',
            data: employee
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.post('/updateContentForm', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

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

// the emid shoudld be the logged in user
app.post('/addFileToBucket', upload.single('file'), async (req, res) => {
    try {
        const {empid} = req.body;
        const file = req.file;

        if (!file || !empid) {
            return res.status(400).json({error: 'Missing required fields'});
        }

        const employee = await prisma.employee.findUnique({
            where: { empid: parseInt(empid) }
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found this should be the current user'});
        }

        const persona = employee.persona;

        const {data, error} = await supabase.storage
            .from(persona)
            .upload(file.originalname, file.buffer, {
                contentType: file.mimetype,
                upsert: true // upsert means that an existing file will be overwritten :)
            });

        if (error) {
            return res.status(500).json({error: 'Something went wrong with the upload'});
        }

        const {data: urlData} = supabase.storage
            .from(persona)
            .getPublicUrl(file.originalname);

        return res.status(200).json({
            message: 'File uploaded successfully',
            url: urlData.publicUrl,
            bucket: persona,
            filename: file.originalname
        });

    } catch (error) {
        return res.status(500).json({error: 'Something went wrong with the upload'});
    }
});


app.post('/contentforms', upload.single('file'), async (req, res) => {
    try {
        console.log('backend received', req.body);
        const {filename, ownerUsername, date_modified, expiration_date, content_type, status} = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({error: 'File is required'});
        }

        const employee = await prisma.employee.findUnique({
            where: {username: ownerUsername}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found this should be the current user'});
        }

        const persona = employee.persona;

        const {data, error} = await supabase.storage
            .from(persona)
            .upload(file.originalname, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            return res.status(500).json({error: 'Failed to upload file to bucket', details: error.message});
        }

        // Get the public URL to store in the DB
        const {data: urlData} = supabase.storage
            .from(persona)
            .getPublicUrl(file.originalname);

        // Create the content form record with the supabase URL
        const content = await prisma.contentform.create({
            data: {
                name: filename,
                url: urlData.publicUrl,
                owner: ownerUsername,
                persona,
                date_modified: new Date(date_modified),
                expiration_date: new Date(expiration_date),
                content_type,
                status,
                employee: {
                    connect: {username: ownerUsername}
                }
            }
        });

        return res.status(200).json({
            message: 'Content form created successfully',
            data: content,
            url: urlData.publicUrl
        });

    } catch (error) {
        console.error('contentform create error:', error);
        res.status(500).send('Error creating content');
    }
});

app.post('/employee_manage', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

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

app.delete('/deleteContentForm/:id', checkJWT, async (req, res)=> {
    const auth0Id = req.auth!.payload.sub as string;

    const id = parseInt(req.params.id);

    const contentform1 = await prisma.contentform.findUnique({
        where: {id: id}
    });

    if (!contentform1) {
        return res.status(400).send("No content form of this name");
    }

    try {

        const contentForm = await prisma.contentform.delete({
            where: {id:id}
        });
        return res.status(200).json({
            message: 'Content form deleted successfully',
            data: contentForm
        });
    }catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/persona/:persona', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const { persona } = req.params;
    try {
        const contentForms = await prisma.contentform.findMany({
            where: { persona: persona }
        });
        res.json(contentForms);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/contentforms/admin', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const [underwriterForms, businessAnalystForms] = await Promise.all([
            prisma.contentform.findMany({ where: { persona: 'Underwriter' } }),
            prisma.contentform.findMany({ where: { persona: 'Business Analyst' } })
        ]);
        res.json({ Underwriter: underwriterForms, BusinessAnalyst: businessAnalystForms });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/contentforms/persona/:persona/:field', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {persona, field} = req.params;
    try {
        if (persona === 'Admin') {
            const contentForm = await prisma.contentform.findMany({
                where: {persona: {in: ['Underwriter', 'Business Analyst']}},
                select: {[field]: true}
            });
            const links = contentForm.map(item => item[field])
            res.json(links);
        } else {
            const contentForms = await prisma.contentform.findMany({
                where: {persona: persona},
                select: {[field]: true}
            });
            const links = contentForms.map(item => item[field])
            res.json(links);
        }
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Trash - get all soft deleted (admin only)
app.get('/contentforms/trash', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const trashed = await prisma.contentform.findMany({
            where: { is_deleted: true }
        });
        res.json(trashed);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Soft delete - sets is_deleted flag instead of removing from DB
app.patch('/contentforms/:id/softdelete', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const id = parseInt(req.params.id);
        const updated = await prisma.contentform.update({
            where: { id },
            data: { is_deleted: true, deleted_at: new Date() }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Restore from trash
app.patch('/contentforms/:id/restore', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const id = parseInt(req.params.id);
        const restored = await prisma.contentform.update({
            where: { id },
            data: { is_deleted: false, deleted_at: null }
        });
        res.json(restored);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Permanent delete - admin only
app.delete('/contentforms/:id/permanent', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const id = parseInt(req.params.id);
        const deleted = await prisma.contentform.delete({ where: { id } });
        res.json(deleted);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/contentforms/:id', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const id = parseInt(req.params.id);
        const contentForm = await prisma.contentform.findUnique({
            where: {id}
        });
        if (!contentForm) return res.status(404).json({error:'Not found'});
        res.json(contentForm);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.put('/contentforms/:id', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const id = parseInt(req.params.id);
        const { name, url, owner, persona, date_modified, expiration_date, content_type, status } = req.body;
        const updated = await prisma.contentform.update({
            where: { id },
            data: {
                name, url, owner, persona,
                date_modified: new Date(date_modified),
                expiration_date: new Date(expiration_date),
                content_type, status,
                employee: { connect: { username: owner } }
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/contentforms/employee/:empid', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const empid = parseInt(req.params.empid);
        const contentForms = await prisma.contentform.findMany({
            where: {empid}
        });
        res.json(contentForms);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.post('/contentforms/:id/favorite', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const id = parseInt(req.params.id);
    const {is_favorite} = req.body;
    try {
        const updated = await prisma.contentform.update({
            where: {id},
            data: {is_favorite}
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});



export default app;

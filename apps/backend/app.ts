import express from 'express';
import morgan from 'morgan';
import path from 'path';

const app = express();
import dotenv from 'dotenv';

import pkg from '@prisma/client';

import {PrismaPg} from "@prisma/adapter-pg";
import {createClient} from '@supabase/supabase-js';
import cors from 'cors';
import multer from 'multer';

const { PrismaClient } = pkg;

const distPath = path.resolve("../frontend/dist");

app.use(cors());
import { ManagementClient } from 'auth0';
import { auth } from "express-oauth2-jwt-bearer";


dotenv.config();

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({adapter});
const port = Number(process.env.PORT) || 3000;

//set up stuff for passing the files using multipart form data
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const upload = multer({storage: multer.memoryStorage()});

// setting up constent for checkin/checkout document stuff
const checkOutMem: Record<number, { username: string; checkedOut: Date }> = {};

const checkJWT = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});

const management = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
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
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Auth0 token request failed: ${res.status} - ${text}`);
    }
    return data.access_token;
}

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5175", "https://cs3733.lunarflame.dev"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(distPath));

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


/*app.get('/', (req, res) => {
    res.sendStatus(200);
});*/

app.get('/employees', async (req, res) => {
    //const auth0Id = req.auth!.payload.sub as string;
    const employees = await prisma.employee.findMany();
    console.log('Employee Data:', employees);
    res.json(employees);
});

app.get('/contentforms', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const contentForms = await prisma.contentform.findMany({
        where: {is_deleted: false}
    });
    console.log('Content Form Data:', contentForms);
    res.json(contentForms);
});

app.post('/getEmployee', async (req, res) => {
    //const auth0Id = req.auth!.payload.sub as string;
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
        res.status(404).json({error: 'User not Found'});
    }
});

//update employee takes the current username and then optionally any data that want to be changed
app.patch('/updateEmployee', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const token = await getManagementToken();
    const {username,newUsername,password,persona, first_name, last_name, pfp_URL} = req.body;

    if (!username) {
        return res.status(400).send('Current username is required');
    }

    const updateData: {
        username?: string;
        password?: string;
        persona?: string;
        first_name?: string;
        last_name?: string;
        pfp_URL?: string;
    } = {};

    if (newUsername) updateData.username = newUsername;
    if (password) updateData.password = password;
    if (persona) updateData.persona = persona;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (pfp_URL) updateData.pfp_URL = pfp_URL;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).send('No fields to update');
    }

    try {

        const employee = await prisma.employee.update({
            where: {username: username},
            data: updateData,
        });

        if (newUsername) {
            const usernameUpdate = {
                connection: "Username-Password-Authentication",
                username: newUsername,
                //email: `${newUsername}@noemail.internal`
            };

            const res1 = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(usernameUpdate),
                }
            );

            if (!res1.ok) {
                const err = await res1.json();
                console.log("Username update failed:", err);
                return res.status(500).json({ error: "Failed to update username", details: err });
            }
        }

        if (newUsername) {
            const usernameUpdate = {
                connection: "Username-Password-Authentication",
                //username: newUsername,
                email: `${newUsername}@noemail.internal`,
                nickname: newUsername
            };

            const res1 = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(usernameUpdate),
                }
            );

            if (!res1.ok) {
                const err = await res1.json();
                console.log("Username update failed:", err);
                return res.status(500).json({ error: "Failed to update username", details: err });
            }
        }


        if (password) {
            const passwordUpdate = {
                connection: "Username-Password-Authentication",
                password: password
            };

            const res2 = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(employee.auth0Id)}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(passwordUpdate),
                }
            );

            if (!res2.ok) {
                const err = await res2.json();
                console.log("Password update failed:", err);
                return res.status(500).json({ error: "Failed to update password", details: err });
            }
        }

        if (persona) {
            const allRolesRes = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/roles`,
                {headers: { Authorization: `Bearer ${token}` }
                }
            );

            const allRoles = await allRolesRes.json();
            const matchedRole = allRoles.find((r: any) => r.name === persona);

            const userRolesRes = await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${employee.auth0Id}/roles`,
                {headers: { Authorization: `Bearer ${token}` }
                }
            );

            const userRoles = await userRolesRes.json();
            if (userRoles.length > 0) {
                await fetch(
                    `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${employee.auth0Id}/roles`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            roles: userRoles.map((r: any) => r.id)
                        })
                    }
                );
            };

            if (matchedRole) {
                await fetch(
                    `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${employee.auth0Id}/roles`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            roles: [matchedRole.id]
                        })
                    }
                );
            }
        };

        if (persona == 'Admin'){
            await prisma.admin.create({
                data: {
                    adid: employee.empid
                }
            })
        } else {
            await prisma.admin.deleteMany({
                where: {adid: employee.empid},
            });
        }
        return res.status(200).json({
            message: 'Employee updated',
            data: employee
        });
    } catch (error) {
        console.error('updateEmployee error:', error);
        res.status(500).json({error: 'Something went wrong updating employee'});
    }
});

app.post('/addEmployee', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {username, password, persona, first_name, last_name, pfp_URL} = req.body;

    if (!username || !password || !first_name || !last_name) {
        return res.status(400).send('Missing field required');
    }

    console.log('Adding employee:', { username, password, persona, first_name, last_name, pfp_URL });
    try {
        const token = await getManagementToken();

        const createRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
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

        const userData = await createRes.json();
        const auth0UserId = userData.user_id;

        const rolesRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/roles`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const rolesData = await rolesRes.json();
        const matchedRole = rolesData.find((r: any) => r.name === persona);

        if (matchedRole) {
            await fetch(
                `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${auth0UserId}/roles`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roles: [matchedRole.id],
                    }),
                }
            );
        }

        if (persona.trim() == 'Admin'){
            const newAdmin = await prisma.employee.create({
                data: {
                    auth0Id: userData.user_id,
                    username,
                    password,
                    persona,
                    first_name,
                    last_name,
                    created_at: new Date(),
                    admin: {
                        create: {}
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
                    auth0Id: userData.user_id,
                    username,
                    password,
                    persona,
                    first_name,
                    last_name,
                    created_at: new Date(),
                    pfp_URL: pfp_URL || null
                },
            });
            return res.status(200).json({
                message: 'new employee added',
                data: newEmp
            });
        }
    } catch (error) {
        console.error('Add employee error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/deleteEmployee/:name', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try{
        const {name} = req.params;

        const user = await prisma.employee.findUnique({
            where: { username: name }
        });

        if (!user) {
            return res.status(404).send('Not Found');
        }

        const token = await getManagementToken();

        const deleteRes = await fetch(
            `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user.auth0Id)}`,
            {
                method:  'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                },
            }
        );

        if (deleteRes.status !== 204) {
            const error = await deleteRes.json();
            return res.status(500).json({ error: 'Failed to delete from Auth0', details: error });
        }

        const deletedEmp = await prisma.employee.delete({
            where: { username: name }
        });

        return res.status(200).json({
            message: 'Employee removed',
            data: deletedEmp
        })
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

app.post('/employees/:empid/profile-picture', upload.single('file'), async (req, res) => {
  try {
    const empid = Number(req.params.empid);
    const file = req.file;
    if (!empid || !file) return res.status(400).json({ error: 'empid and file are required' });
    if (!file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Only image uploads are allowed' });

    const employee = await prisma.employee.findUnique({ where: { empid } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const safeName = file.originalname.replace(/\s+/g, '_');
    const path = `employee-profiles/${empid}/avatar-${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('Employee Media') //direct to Employee Media bucket
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) return res.status(500).json({ error: 'Upload failed', details: uploadError.message });

    const { data: urlData } = supabase.storage.from('Employee Media').getPublicUrl(path);

    const updated = await prisma.employee.update({
      where: { empid },
      data: { pfp_URL: urlData.publicUrl }
    });

    return res.status(200).json({ message: 'Profile picture uploaded', data: updated });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error' });
  }
});
  
app.post('/updateTheme', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {empid, theme} = req.body;
    if (!empid || theme === undefined) {
        return res.status(400).send('Missing field required, need to provide theme');
    }

    try {
        const employee = await prisma.employee.update({
            where: {empid: empid},
            data: {theme: theme}
        });
        return res.status(200).json({
            message: 'Theme updated',
            data: employee
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
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
        persona?: string[];
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
app.post('/addFileToBucket', upload.single('file'), checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const {empid} = req.body;
        const file = req.file;

        if (!file || !empid) {
            return res.status(400).json({error: 'Missing required fields'});
        }

        const employee = await prisma.employee.findUnique({
            where: {empid: parseInt(empid)}
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


app.post('/contentforms', upload.single('file'), checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        console.log('backend received', req.body);
        const {filename, ownerUsername, date_modified, expiration_date, content_type, status} = req.body;
        const file = req.file;
        const rawUrl = req.body.url;

        if (!file && !rawUrl) {
            return res.status(400).json({error: 'File or URL is required'});
        }

        const employee = await prisma.employee.findUnique({
            where: {username: ownerUsername}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found this should be the current user'});
        }

        const persona = JSON.parse(req.body.persona ?? '[]');

        let contentUrl: string = '';

        if(file) {

            const bucket = Array.isArray(persona) && persona.length > 0 ? persona[0] : employee.persona;

            const {data, error} = await supabase.storage
                .from(bucket)
                .upload(file.originalname, file.buffer, {contentType: file.mimetype, upsert: true});

            if (error) {
                return res.status(500).json({error: 'Failed to upload file to bucket', details: error.message});
            }

            const {data: urlData} = supabase.storage
                .from(bucket)
                .getPublicUrl(file.originalname);

            contentUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }else{
            try { new URL(rawUrl); }catch(error){
                return res.status(400).json({error: 'Invalid URL'});
            }
            contentUrl = rawUrl;
        }

        // Create the content form record with the supabase URL
        const content = await prisma.contentform.create({
            data: {
                name: filename,
                url: contentUrl,
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
            url: contentUrl
        });

    } catch (error) {
        console.error('contentform create error:', error);
        res.status(500).send('Error creating content');
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
            where: {id: id}
        });
        return res.status(200).json({
            message: 'Content form deleted successfully',
            data: contentForm
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/persona/:persona', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const { persona } = req.params;
    try {
        const contentForms = await prisma.contentform.findMany({
            where: {persona: {has: persona}}
        });
        res.json(contentForms);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/admin', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const [underwriterForms, businessAnalystForms] = await Promise.all([
            prisma.contentform.findMany({ where: { persona: { has: 'Underwriter' } } }),
            prisma.contentform.findMany({ where: { persona: { has: 'Business Analyst' } } }),
        ]);
        res.json({Underwriter: underwriterForms, BusinessAnalyst: businessAnalystForms});
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/persona/:persona/:field', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {persona, field} = req.params;
    try {
        if (persona === 'Admin') {
            const contentForm = await prisma.contentform.findMany({
                where: { persona: { hasSome: ['Underwriter', 'Business Analyst'] } },
                select: {[field]: true}
            });
            const links = contentForm.map(item => item[field])
            res.json(links);
        } else {
            const contentForms = await prisma.contentform.findMany({
                where: { persona: { has: persona } },
                select: {[field]: true}
            });
            const links = contentForms.map(item => item[field])
            res.json(links);
        }
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/filter/:persona/:file_type', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {persona, file_type} = req.params;
    try {
        const where: any = {};
        if (persona === 'Admin') {
            where.persona = {in: ['Underwriter', 'Business Analyst']};
        } else {
            where.persona = persona;
        }
        const contentForm = await prisma.contentform.findMany({where})
        const filtered = contentForm.filter(form => {
            const ext = form.url.split('.').pop();
            return ext === file_type;
        });
        res.json(filtered);
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

// Auto-expire documents past their expiration date
// NOTE: this must stay above GET /contentforms/:id or Express will treat "autoexpire" as an id
app.patch('/contentforms/autoexpire', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const updated = await prisma.contentform.updateMany({
            where: {
                expiration_date: { lt: new Date() },
                status: { not: 'Expired' },
                is_deleted: false
            },
            data: { status: 'Expired' }
        });
        res.json({ message: `${updated.count} documents expired` });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Get archived documents
// NOTE: must stay above GET /contentforms/:id
app.get('/contentforms/archived', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const archived = await prisma.contentform.findMany({
            where: { status: 'Archived', is_deleted: false }
        });
        res.json(archived);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Get expired documents
// NOTE: must stay above GET /contentforms/:id
app.get('/contentforms/expired', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const expired = await prisma.contentform.findMany({
            where: { status: 'Expired', is_deleted: false }
        });
        res.json(expired);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Trash - get all soft deleted (admin only)
// NOTE: must stay above GET /contentforms/:id
app.get('/contentforms/trash', async (req, res) => {
    try {
        const trashed = await prisma.contentform.findMany({
            where: { is_deleted: true }
        });
        res.json(trashed);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Patch just the status field — used by Archive page restore
app.patch('/contentforms/:id/status', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'status is required' });
        const updated = await prisma.contentform.update({
            where: { id },
            data: { status }
        });
        res.json(updated);
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
        if (!contentForm) return res.status(404).json({error: 'Not found'});
        res.json(contentForm);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.post('/contentforms/:id/checkout', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const {username} = req.body;
    console.log('checkout hit', { id, username });
    if (!username) {
        return res.status(400).send('Requires username');
    }

    try {
        const current = await prisma.contentform.findUnique({
            where: { id },
            select: { checkout_username: true,  checkout_date: true }
        });

        if (current && current.checkout_username) {
            const {checkout_username: takenBy, checkout_date} = current;
            if (takenBy !== username) {
                return res.status(423).json({
                    error: `Document is checked out by ${takenBy} since ${checkout_date}`
                });
            }
        }

        try {
            const updated = await prisma.contentform.update({
                where: {id},
                data: {checkout_username: username, checkout_date: new Date()}
            });
            return res.status(200).json({message: 'Document checked out'});
        } catch (error) {
            res.status(500).json({error: 'Something went wrong 1'});
        }

    } catch (error) {
        res.status(500).json({error: 'Something went wrong 2'});
    }

});

app.post('/contentforms/:id/checkin', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const {username} = req.body;

    try {
        const current = await prisma.contentform.findUnique({
            where: { id },
            select: { checkout_username: true,  checkout_date: true }
        });

        if (!current) {
            return res.status(400).send('Document isnt checked out')
        }

        const {checkout_username: takenBy, checkout_date} = current;

    if (takenBy !== username) {
        return res.status(401).json({error: "You can only check in documents that you have checked out"});
    }

    try {
        const updated = await prisma.contentform.update({
            where: { id },
            data: { checkout_username: null, checkout_date: null }
        });

        return res.status(200).json({message: 'Document checked in'});
    } catch (error) {
        res.status(500).json({error: 'Something went wrong checking in doc'});
    }
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/:id/checkout_status', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);

    try {
        const current = await prisma.contentform.findUnique({
            where: {id},
            select: {checkout_username: true, checkout_date: true}
        });

        if (!current) return res.status(404).json({ error: 'Document not found' });

        const {checkout_username: takenBy, checkout_date} = current;

        if (!takenBy) {
            return res.status(200).json({isCheckedOut: false});
        }
        return res.status(200).json({
            isCheckedOut: true,
            checkedOutBy: takenBy,
            checkedOutAt: checkout_date
        });
    }catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/checkout/all', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const forms = await prisma.contentform.findMany({
            where: {checkout_username: {not: null}},
            select: {id: true, checkout_username: true, checkout_date: true}
        });

        const result = forms.map(form => ({
            id: form.id,
            checkedOutBy: form.checkout_username,
            checkedOutAt: form.checkout_date
        }));

        return res.status(200).json(result);

    } catch (error) {
        res.status(500).json({error: 'Something is Wrong'});
    }
});

app.put('/contentforms/:id', upload.single('file'), checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    console.log('PUT body:', req.body);
    console.log('PUT file:', req.file?.originalname);

    try {
        const id = parseInt(req.params.id.toString());
        const { name, ownerUsername, owner, date_modified, expiration_date, content_type, status } = req.body;
        const resolvedOwner = ownerUsername ?? owner;
        console.log('ownerUsername:', ownerUsername, 'owner:', owner, 'resolvedOwner:', resolvedOwner);
        const rawPersona = req.body.persona;
        const persona = typeof rawPersona === 'string' ? JSON.parse(rawPersona) : (rawPersona ?? []);

        const updateData: any = {
            name,
            owner: resolvedOwner,
            persona,  // now correctly set
            date_modified: new Date(date_modified),
            expiration_date: expiration_date ? new Date(expiration_date) : null,
            content_type,
            status,
            employee: { connect: { username: resolvedOwner } }
        };

        if (req.file) {
            // look up the employee to get their persona/bucket
            const employee = await prisma.employee.findUnique({
                where: { username: resolvedOwner }
            });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const bucket = employee.persona;

            const { error } = await supabase.storage
                .from(bucket)
                .upload(req.file.originalname, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true  // overwrites existing file with same name
                });

            if (error) {
                return res.status(500).json({ error: 'Failed to upload file to Supabase', details: error.message });
            }

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(req.file.originalname);

            updateData.url = `${urlData.publicUrl}?t=${Date.now()}`;
        } else if (req.body.url) {
            try { new URL(req.body.url); } catch (error) {
                return res.status(400).json({ error: 'Invalid URL' });
            }
            updateData.url = req.body.url;
        }

        const updated = await prisma.contentform.update({
            where: { id },
            data: updateData
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating document:', error);
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

app.get('/ba-files', async (req, res) => {
    const { data, error } = await supabase
        .from('ba_files_with_size')
        .select('name, file_size_kb')
        .not('file_size_kb', 'is', null)

    if (error) {
        return res.status(500).json({ error: 'Cannot find file size' })
    }

    res.json(data)
})

app.get('/uw-files', async (req, res) => {
    const { data, error } = await supabase
        .from('underwriter_files_with_size')
        .select('name, file_size_kb')
        .not('file_size_kb', 'is', null)

    if (error) {
        return res.status(500).json({ error: 'Cannot find file size' })
    }

    res.json(data)
})

app.get('/uw-files/:name', async(req, res) => {
    const {name} = req.params;
    const { data, error } = await supabase
        .from('underwriter_files_with_size') // your VIEW
        .select('name, file_size_kb')
        .eq('name', name)
        .single()

    if (error) {
        return res.status(500).json({ error: 'Cannot find file' })
    }
    res.json(data)
})

app.get('/ba-files/:name', async(req, res) => {
    const {name} = req.params;
    const { data, error } = await supabase
        .from('ba_files_with_size') // your VIEW
        .select('name, file_size_kb')
        .eq('name', name)
        .single()

    if (error) {
        return res.status(500).json({ error: 'Cannot find file' })
    }
    res.json(data)
});

app.post('/newtag', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Must name the tag' })
    };

    try {

        const newTag = await prisma.metatags.create({
            data: {
                tag_name: name
            },
        });


        return res.status(200).json({
            message: 'new tag added',
            data: newTag
        });
    } catch (error) {
        res.status(500).json({ error: 'Cannot add a tag' });
    }
});

app.post('/assigntag', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const idInt = Number(req.body.id);
    const metidInt = Number(req.body.metid);

    const form = await prisma.contentform.findUnique({
        where: { id: idInt }
    });

    const tag = await prisma.metatags.findUnique({
        where: { metid: metidInt }
    });

    if (!form) {
        return res.status(400).json({ error: 'Form not found' });
    }

    if (!tag) {
        return res.status(400).json({ error: 'Tag not found' });
    }

    try {

        const assignTag = await prisma.jointagscontent.create({
            data: {
                id: form.id,
                metid: tag.metid
            },
        });

        if (assignTag){
            return res.status(200).json('Tag assigned');
        }
    } catch (error) {
        return res.status(500).json({error});
    }
});

app.get('/grabtaggedforms/:name', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const name = req.params.name;

    const tag = await prisma.metatags.findFirst({
        where: { tag_name: name }
    });

    if (!tag) {
        return res.status(400).json('No Tag by This Name');
    }

    try {
        const join = await prisma.jointagscontent.findMany({
            where: {metid: tag.metid}
        });

        const tagged = join.map(formid => formid.id);

        console.log(tagged);

        const forms= await prisma.contentform.findMany({
            where: {
                id: { in: tagged }
            }
        })

        return res.status(200).json({data: forms});

    } catch (error) {
        res.status(500).json({ error: 'Cannot find forms with this tag' });
    }
})

app.get('/grabformtags/:name', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const name = req.params.name;

    const form = await prisma.contentform.findFirst({
        where: { name: name }
    });

    if (!form) {
        return res.status(400).json('No Tag by This Name');
    }

    try {
        const join = await prisma.jointagscontent.findMany({
            where: {id: form.id}
        });

        const tagged = join.map(tagid => tagid.metid);

        console.log(tagged);

        const tags= await prisma.metatags.findMany({
            where: {
                id: { in: tagged }
            }
        })

        return res.status(200).json({data: tags});

    } catch (error) {
        res.status(500).json({ error: 'Cannot find tags for this form' });
    }
})

app.delete('/unassigntag', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const idInt = Number(req.body.id);
    const metidInt = Number(req.body.metid);

    try {
        const removeTag = await prisma.jointagscontent.deleteMany({
            where: {
                id: idInt,
                metid: metidInt
            }
        })

        if (removeTag) {
            return res.status(200).json({message: 'Tag removed', data: removeTag});
        }
    } catch (error) {
        res.status(500).json({ error: 'Cannot remove a tag' });
    }
})

app.delete('/deletetag/:name', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Must include the tag' })
    };

    try {

        const deletedTag = await prisma.metatags.delete({
            where: { tag_name: name }
        });


        return res.status(200).json({
            message: 'tag deleted',
            data: deletedTag
        });
    } catch (error) {
        res.status(500).json({ error: 'Cannot remove a tag' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;

import express from 'express';
import morgan from 'morgan';

const app = express();
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from "@prisma/adapter-pg";
import {createClient} from '@supabase/supabase-js';
import cors from 'cors';
import multer from 'multer';

app.use(cors());

dotenv.config();

const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({adapter});
const port = process.env.PORT || 3000;

//set up stuff for passing the files using multipart form data
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const upload = multer({storage: multer.memoryStorage()});

// setting up constent for checkin/checkout document stuff
const checkOutMem: Record<number, { username: string; checkedOut: Date }> = {};

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

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.get('/employees', async (req, res) => {
    const employees = await prisma.employee.findMany();
    console.log('Employee Data:', employees);
    res.json(employees);
});

app.get('/contentforms', async (req, res) => {
    const contentForms = await prisma.contentform.findMany({
        where: {is_deleted: false}
    });
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

        //receive session info from front end, including empid, username, and persona

        return res.status(200).json({
            message: 'okay',
            employee: {
                empid: employee.empid,
                username: employee.username,
                persona: employee.persona
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
        res.status(404).json({error: 'User not Found'});
    }
});

//update employee takes the current username and then optionally any data that want to be changed
app.post('/updateEmployee', async (req, res) => {
    const {username, newUsername, password, persona} = req.body;

    if (!username) {
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
            where: {username: username},
            data: updateData
        });
        if (persona.trim() == 'Admin') {
            await prisma.admin.create({
                data: {
                    adid: employee.empid
                }
            })
        } else {
            const check = await prisma.admin.findUnique({
                where: {adid: employee.empid}
            });
            if (check) {
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
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.post('/addEmployee', async (req, res) => {
    const {username, password, persona, first_name, last_name} = req.body;

    if (!username || !password || !first_name || !last_name) {
        return res.status(400).send('Missing field required');
    }

    console.log('Adding employee:', { username, password, persona, first_name, last_name });
    try {
        if (persona.trim() == 'Admin') {


            const newAdmin = await prisma.employee.create({
                data: {
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
        console.error('Add employee error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/deleteEmployee/:name', async (req, res) => {
    try{
        const {name} = req.params;

        const user = await prisma.employee.findUnique({
            where: { username:name }
        });

        if (!user) {
            return res.status(404).send('Not Found');
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

app.post('/updateTheme', async (req, res) => {
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

app.post('/updateContentForm', async (req, res) => {
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
app.post('/addFileToBucket', upload.single('file'), async (req, res) => {
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

        const persona = JSON.parse(req.body.persona ?? '[]');
        const bucket = Array.isArray(persona) && persona.length > 0 ? persona[0] : employee.persona;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(file.originalname, file.buffer, { contentType: file.mimetype, upsert: true });

        if (error) {
            return res.status(500).json({ error: 'Failed to upload file to bucket', details: error.message });
        }

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(file.originalname);

        // Create the content form record with the supabase URL
        const content = await prisma.contentform.create({
            data: {
                name: filename,
                url: `${urlData.publicUrl}?t=${Date.now()}`,
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

app.post('/employee_manage', async (req, res) => {
    try {
        const {username, edits, employee, priority, email, comments} = req.body;
        const employeeManage = await prisma.employee_manage.create({
            data: {username, edits, employee, priority, email, comments}
        });
        res.json(employeeManage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating employee management request');
    }
});

app.delete('/deleteContentForm/:id', async (req, res) => {
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

app.get('/contentforms/persona/:persona', async (req, res) => {
    const {persona} = req.params;
    try {
        const contentForms = await prisma.contentform.findMany({
            where: {persona: {has: persona}}
        });
        res.json(contentForms);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

app.get('/contentforms/admin', async (req, res) => {
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

app.get('/contentforms/persona/:persona/:field', async (req, res) => {
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

app.get('/contentforms/filter/:persona/:file_type', async (req, res) => {
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
                username: employee.username,
                isLoggedIn: true,
            }
        });
    } else {
        console.log(`failed: ${username}`);
        return res.status(401).send('Invalid username or password');
    }
});

// Trash - get all soft deleted (admin only)
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

// Soft delete - sets is_deleted flag instead of removing from DB
app.patch('/contentforms/:id/softdelete', async (req, res) => {
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
app.patch('/contentforms/:id/restore', async (req, res) => {
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
app.delete('/contentforms/:id/permanent', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await prisma.contentform.delete({ where: { id } });
        res.json(deleted);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/contentforms/:id', async (req, res) => {
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

app.post('/contentforms/:id/checkout', async (req, res) => {
    const id = parseInt(req.params.id);
    const {username} = req.body;
    if (!username) {
        return res.status(400).send('Requires username');
    }

    if (checkOutMem[id]) {
        const {username: takenBy, checkedOut} = checkOutMem[id];
        if (takenBy !== username) {
            return res.status(423).json({
                error: `Document is checked out by ${takenBy} since ${checkedOut}`
            });
        }
    }
    checkOutMem[id] = {username, checkedOut: new Date()};
    return res.status(200).json({message: 'Document checked out'});
});

app.post('/contentforms/:id/checkin', async (req, res) => {
    const id = parseInt(req.params.id);
    const {username} = req.body;

    if (!checkOutMem[id]) {
        return res.status(400).send('Document isnt checked out')
    }
    ;
    if (checkOutMem[id].username !== username) {
        return res.status(401).json({error: "You can only check in documents that you have checked out"});
    }

    delete checkOutMem[id];
    return res.status(200).json({message: 'Document checked in'});
});

app.get('/contentforms/:id/checkout_status', async (req, res) => {
    const id = parseInt(req.params.id);

    if (!checkOutMem[id]) {
        return res.status(401).json({isCheckedOut: false});
    }
    return res.status(200).json({
        isCheckedOut: true,
        checkedOutBy: checkOutMem[id].username,
        checkedOutAt: checkOutMem[id].checkedOut
    });
})

app.get('/contentforms/checkout/all', async (req, res) => {
    try {
        const checkedOutId = Object.keys(checkOutMem).map(Number);
        if (checkedOutId.length === 0) {
            return res.status(200).json([]);
        }
        const forms = await prisma.contentform.findMany({
            where: {id: {in: checkedOutId}}
        });

        const result = forms.map(form => ({
            ...form,
            checkedOutBy: checkOutMem[form.id].username,
            checkedOutAt: checkOutMem[form.id].checkedOut
        }));
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({error: 'Something is Wrong'});
    }
});

app.put('/contentforms/:id', upload.single('file'), async (req, res) => {
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

app.get('/contentforms/employee/:empid', async (req, res) => {
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

app.post('/contentforms/:id/favorite', async (req, res) => {
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
})

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


export default app;

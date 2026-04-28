import { Router } from 'express';
import {prisma} from '../setup/prisma.js';
import {supabase} from '../setup/supabase.js';
import {upload} from '../setup/upload.js';
import {checkJWT} from '../setup/auth0.js';
import { sendNotificationToUsers } from './notifications.js';

const router = Router();

async function resolveRequestUsername(req: any): Promise<string | null> {
    const bodyUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    if (bodyUsername && bodyUsername !== 'null' && bodyUsername !== 'undefined') return bodyUsername;

    const auth0Id = req.auth?.payload?.sub as string | undefined;
    if (!auth0Id) return null;

    const employee = await prisma.employee.findUnique({
        where: { auth0Id },
        select: { username: true }
    });

    return employee?.username ?? null;
}

router.get('/api/auth/me', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const employee = await prisma.employee.findUnique({where: {auth0Id}});
    if (!employee) return res.status(404).json({error: 'Employee not found'});

    res.json({employee});
});

router.get('/contentforms', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const contentForms = await prisma.contentform.findMany({
        where: {is_deleted: false}
    });
    res.json(contentForms);
});

router.post('/updateContentForm', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {
        name,
        newName,
        url,
        owner,
        persona,
        date_modified,
        expiration_date,
        content_type,
        status,
        review_date,
        username
    } = req.body;

    const expiration = new Date(req.body.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!name) {
        return res.status(400).send({error: "Name of content is required"});
    }

    if (!newName || !owner || !persona || !date_modified || !expiration_date || !content_type || !status) {
        return res.status(406).send({error: "Make sure all fields are filled in"});
    }

    if (status !== 'Expired' && expiration < today) {
        return res.status(409).send({error: "Expiration date should be in the future"})
    }

    if (status === 'Expired' && expiration > today) {
        return res.status(409).send({error: "Expiration date or Status should be edited"})
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
        review_date?: string;
    } = {};

    if (newName) updateData.name = newName;
    if (url) updateData.url = url;
    if (owner) updateData.owner = owner;
    if (persona) updateData.persona = persona;
    if (date_modified) updateData.date_modified = date_modified;
    if (expiration_date) updateData.expiration_date = expiration_date;
    if (content_type) updateData.content_type = content_type;
    if (status) updateData.status = status;
    if (review_date) updateData.review_date = review_date;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).send("No fields to update");
    }

    try {
        const contentForm = await prisma.contentform.update({
            where: {name: name},
            data: updateData
        });

        const sender = await prisma.employee.findUnique({ where: { auth0Id } });

        if (sender && contentForm.persona && contentForm.persona.length > 0) {
            const recipients = await prisma.employee.findMany({
                where: {
                    persona: { hasSome: contentForm.persona }
                },
                select: { empid: true }
            });
            const recipientEmpids = recipients.map(e => e.empid);
            console.log('[updateContentForm] Recipients found:', recipientEmpids);

            if (recipientEmpids.length > 0) {
                await sendNotificationToUsers(
                    'Document Updated',
                    `Document "${contentForm.name}" has been updated.`,
                    recipientEmpids,
                    sender.empid
                );
            }
        }

        const employee1 = await prisma.employee.findUnique({
            where: {username: username}
        })

        const transaction = await prisma.changes.create({
            data: {
                id: contentForm.id,
                empid: employee1.empid,
                change: "Updated Document",
                date: new Date().toISOString()
            }
        });

        console.log(transaction);

        return res.status(200).json({
            message: 'Content form updated successfully',
            data: contentForm
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.post('/addFileToBucket', upload.single('file'), checkJWT, async (req, res) => {
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

router.post('/contentforms', upload.single('file'), checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        console.log('backend received', req.body);
        const {
            name,
            ownerUsername,
            date_modified,
            expiration_date,
            review_date,
            content_type,
            status,
            username
        } = req.body;
        const file = req.file;
        const rawUrl = req.body.url;

        if (!file && !rawUrl) {
            return res.status(400).json({error: 'File or URL is required'});
        }

        if (!name || !ownerUsername || !date_modified || !expiration_date || !content_type || !status) {
            return res.status(406).send({error: "Make sure all fields are filled in"});
        }

        const persona = JSON.parse(req.body.persona ?? '[]');

        if (!Array.isArray(persona) || persona.length === 0) {
            return res.status(406).json({ error: 'At least one job position is required' });
        }

        const expiration = new Date(expiration_date);
        //Date can be invalid
        //const review = new Date(review_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiration < today && status !== 'Expired') {
            return res.status(409).json({ error: 'Document is expired' });
        }

        //No longer done since expiration=review
        //if (review < today) {
        //    return res.status(409).json({ error: 'Review date should be in the future' });
        //}

        const employee = await prisma.employee.findUnique({
            where: {username: ownerUsername}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found this should be the current user'});
        }

        let contentUrl: string = '';

        if (file) {

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
        } else {
            try {
                new URL(rawUrl);
            } catch (error) {
                return res.status(400).json({error: 'Invalid URL'});
            }
            contentUrl = rawUrl;
        }

        // Create the content form record with the supabase URL
        const content = await prisma.contentform.create({
            data: {
                name: name,
                url: contentUrl,
                owner: ownerUsername,
                persona : persona,
                date_modified: new Date(date_modified),
                expiration_date: new Date(expiration_date),
                content_type,
                status,
                employee: {
                    connect: {username: ownerUsername}
                },
                //Date can be invalid so just date instead of review_date
                review_date: new Date()
            }
        });

        const employee1 = await prisma.employee.findUnique({
            where: {username: username}
        })

        const transaction = await prisma.changes.create({
            data: {
                id: content.id,
                empid: employee1.empid,
                change: "Added Document",
                date: new Date(date_modified).toISOString()
            }
        })

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

router.delete('/deleteContentForm/:id', checkJWT, async (req, res) => {
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

router.get('/contentforms/persona/:persona', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

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

router.get('/contentforms/admin', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const [underwriterForms, businessAnalystForms, actuarialAnalystForms, exlOperationsForms] = await Promise.all([
            prisma.contentform.findMany({where: {persona: {has: 'Underwriter'}}}),
            prisma.contentform.findMany({where: {persona: {has: 'Business Analyst'}}}),
            prisma.contentform.findMany({where: {persona: {has: 'Actuarial Analyst'}}}),
            prisma.contentform.findMany({where: {persona: {has: 'EXL Operations'}}}),
        ]);
        res.json({
            Underwriter: underwriterForms,
            BusinessAnalyst: businessAnalystForms,
            ActuarialAnalyst: actuarialAnalystForms,
            EXLOperations: exlOperationsForms
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.get('/contentforms/persona/:persona/:field', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const {persona, field} = req.params;
    try {
        if (persona === 'Admin') {
            const contentForm = await prisma.contentform.findMany({
                where: {persona: {hasSome: ['Underwriter', 'Business Analyst', 'Actuarial Analyst', 'EXL Operations']}},
                select: {[field]: true}
            });
            const links = contentForm.map(item => item[field])
            res.json(links);
        } else {
            const contentForms = await prisma.contentform.findMany({
                where: {persona: {has: persona}},
                select: {[field]: true}
            });
            const links = contentForms.map(item => item[field])
            res.json(links);
        }
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.get('/contentforms/filter/:persona/:file_type', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {persona, file_type} = req.params;
    try {
        const where: any = {};
        if (persona === 'Admin') {
            where.persona = {in: ['Underwriter', 'Business Analyst', 'Actuarial Analyst', 'EXL Operations']};
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
router.get('/contentforms/trash', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const trashed = await prisma.contentform.findMany({
            where: {is_deleted: true}
        });
        res.json(trashed);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Soft delete - sets is_deleted flag instead of removing from DB
router.patch('/contentforms/:id/:username/softdelete', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    console.log(req.params.username);
    try {
        const id = parseInt(req.params.id);
        const updated = await prisma.contentform.update({
            where: {id},
            data: {is_deleted: true, deleted_at: new Date()}
        });

        const sender = await prisma.employee.findUnique({ where: { auth0Id } });
        if (sender && updated.persona && updated.persona.length > 0) {
            const allRecipients = [];
            for (const p of updated.persona) {
                const recipients = await prisma.employee.findMany({
                    where: { persona: p },
                    select: { empid: true }
                });
                allRecipients.push(...recipients);
            }

            const admins = await prisma.admin.findMany({
                select: { adid: true }
            });
            const adminEmpids = admins.map(a => a.adid);

            const recipientEmpids = [...new Set([...allRecipients.map(e => e.empid), ...adminEmpids])];

            if (recipientEmpids.length > 0) {
                await sendNotificationToUsers(
                    'Document Deleted',
                    `Document "${updated.name}" has been deleted.`,
                    recipientEmpids,
                    sender.empid
                );
            }
        }

        const employee1 = await prisma.employee.findUnique({
            where: {username: req.params.username}
        })

        const transaction = await prisma.changes.create({
            data: {
                id: updated.id,
                empid: employee1.empid,
                change: "Deleted Document",
                date: new Date().toISOString()
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Restore from trash
router.patch('/contentforms/:id/restore', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const id = parseInt(req.params.id);
        const restored = await prisma.contentform.update({
            where: {id},
            data: {is_deleted: false, deleted_at: null}
        });
        res.json(restored);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Permanent delete - admin only
router.delete('/contentforms/:id/permanent', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const id = parseInt(req.params.id);
        const deleted = await prisma.contentform.delete({where: {id}});
        res.json(deleted);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Auto-expire documents past their expiration date
// NOTE: this must stay above GET /contentforms/:id or Express will treat "autoexpire" as an id
router.patch('/contentforms/autoexpire', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const updated = await prisma.contentform.updateMany({
            where: {
                expiration_date: {lt: new Date()},
                status: {not: 'Expired'},
                is_deleted: false
            },
            data: {status: 'Expired'}
        });
        res.json({message: `${updated.count} documents expired`});
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Get archived documents
// NOTE: must stay above GET /contentforms/:id
router.get('/contentforms/archived', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const archived = await prisma.contentform.findMany({
            where: {status: 'Archived', is_deleted: false}
        });
        res.json(archived);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Get expired documents
// NOTE: must stay above GET /contentforms/:id
router.get('/contentforms/expired', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const expired = await prisma.contentform.findMany({
            where: {status: 'Expired', is_deleted: false}
        });
        res.json(expired);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Trash - get all soft deleted (admin only)
// NOTE: must stay above GET /contentforms/:id
router.get('/contentforms/trash', async (req, res) => {
    try {
        const trashed = await prisma.contentform.findMany({
            where: {is_deleted: true}
        });
        res.json(trashed);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Patch just the status field — used by Archive page restore
router.patch('/contentforms/:id/status', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {status} = req.body;
        if (!status) return res.status(400).json({error: 'status is required'});
        const updated = await prisma.contentform.update({
            where: {id},
            data: {status, expiration_date: new Date()}
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.get('/contentforms/:id', checkJWT, async (req, res) => {
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

router.post('/contentforms/:id/checkout', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const username = await resolveRequestUsername(req);
    console.log('checkout hit', {id, username});

    if (!username) {
        return res.status(400).json({error: 'Requires username'});
    }

    try {
        const user = await prisma.employee.findUnique({
            where: { username },
            select: { persona: true }
        });
        const isAdmin = user?.persona === 'Admin';
        const userPersona = user?.persona || '';

        const current = await prisma.contentform.findUnique({
            where: {id},
            select: {checkout_username: true, checkout_date: true, persona: true}
        });

        if (!current) {
            return res.status(404).send('Document not found');
        }

        if (!isAdmin && !current.persona.includes(userPersona)) {
            return res.status(403).json({ error: "Your role does not have permission to checkout or modify this document." });
        }

        if (current.checkout_username && current.checkout_username !== username) {
            if (!isAdmin) {
                return res.status(423).json({
                    error: `Document is already checked out by ${current.checkout_username} since ${current.checkout_date}`
                });
            }
            console.log(`[ADMIN OVERRIDE] ${username} is force-checking out document ${id} from ${current.checkout_username}`);
        }

        try {
            const updated = await prisma.contentform.update({
                where: {id},
                data: {checkout_username: username, checkout_date: new Date()}
            });

            const employee1 = await prisma.employee.findUnique({
                where: {username: username}
            })

            const transaction = await prisma.changes.create({
                data: {
                    id: updated.id,
                    empid: employee1.empid,
                    change: "Checked Out Document",
                    date: new Date().toISOString()
                }
            });

            return res.status(200).json({
                message: 'Document checked out successfully',
                checkedOutBy: username,
                checkedOutAt: updated.checkout_date
            });
        } catch (error) {
            res.status(500).json({error: 'Something went wrong writing the checkout to the database'});
        }

    } catch (error) {
        console.error("Checkout route error:", error);
        res.status(500).json({error: 'Something went wrong processing the checkout'});
    }
});

router.post('/contentforms/:id/checkin', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const username = await resolveRequestUsername(req);

    if (!username) {
        return res.status(400).json({error: 'Requires username'});
    }

    try {
        const user = await prisma.employee.findUnique({
            where: { username },
            select: { persona: true }
        });
        const isAdmin = user?.persona === 'Admin';
        const userPersona = user?.persona || '';

        const current = await prisma.contentform.findUnique({
            where: {id},
            select: {checkout_username: true, checkout_date: true, persona: true}
        });

        if (!current) {
            return res.status(404).send('Document not found');
        }

        if (!isAdmin && !current.persona.includes(userPersona)) {
            return res.status(403).json({ error: "Your role does not have permission to modify this document." });
        }

        const {checkout_username: takenBy} = current;

        if (!takenBy) {
            return res.status(400).send('Document is not currently checked out');
        }

        if (takenBy !== username && !isAdmin) {
            return res.status(401).json({error: "You can only check in documents that you have checked out"});
        }

        try {
            const updated = await prisma.contentform.update({
                where: {id},
                data: {checkout_username: null, checkout_date: null}
            });

            const employee1 = await prisma.employee.findUnique({
                where: {username: username}
            })

            const transaction = await prisma.changes.create({
                data: {
                    id: updated.id,
                    empid: employee1.empid,
                    change: "Checked In Document",
                    date: new Date().toISOString()
                }
            });

            return res.status(200).json({
                message: 'Document checked in successfully',
                checkedInBy: username
            });
        } catch (error) {
            res.status(500).json({error: 'Something went wrong writing the checkin to the database'});
        }
    } catch (error) {
        console.error("Checkin route error:", error);
        res.status(500).json({error: 'Something went wrong processing the checkin'});
    }
});

router.get('/contentforms/:id/checkout_status', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);

    try {
        const current = await prisma.contentform.findUnique({
            where: {id},
            select: {checkout_username: true, checkout_date: true}
        });

        if (!current) return res.status(404).json({error: 'Document not found'});

        const {checkout_username: takenBy, checkout_date} = current;

        if (!takenBy) {
            return res.status(200).json({isCheckedOut: false});
        }
        return res.status(200).json({
            isCheckedOut: true,
            checkedOutBy: takenBy,
            checkedOutAt: checkout_date
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.get('/contentforms/checkout/all', checkJWT, async (req, res) => {
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

router.put('/contentforms/:id', upload.single('file'), checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    console.log('PUT body:', req.body);
    console.log('PUT file:', req.file?.originalname);

    try {
        const id = parseInt(req.params.id.toString());
        const {
            name,
            ownerUsername,
            owner,
            date_modified,
            expiration_date,
            review_date,
            content_type,
            status,
            username
        } = req.body;
        const resolvedOwner = ownerUsername ?? owner;
        console.log('ownerUsername:', ownerUsername, 'owner:', owner, 'resolvedOwner:', resolvedOwner);
        const rawPersona = req.body.persona;
        const persona = typeof rawPersona === 'string' ? JSON.parse(rawPersona) : (rawPersona ?? []);


        if (!name || !resolvedOwner || !date_modified || !expiration_date || !content_type || !status) {
            return res.status(406).json({ error: 'Make sure all fields are filled in' });
        }

        if (!Array.isArray(persona) || persona.length === 0) {
            return res.status(406).json({ error: 'At least one job position is required' });
        }

        const expiration = new Date(expiration_date);
        //const review = new Date(review_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiration < today && status !== 'Expired') {
            return res.status(409).json({ error: 'Document is expired' });
        }

        //no longer done since expiration = review
        //if (review < today) {
        //    return res.status(409).json({ error: 'Review date should be in the future' });
        //}

        const updateData: any = {
            name: name,
            owner: resolvedOwner,
            persona,  // now correctly set
            date_modified: new Date(date_modified),
            expiration_date: expiration_date ? new Date(expiration_date) : null,
            content_type,
            status,
            employee: {connect: {username: resolvedOwner}},
            //Safe check for if review_date exists
            //But Date can still be invalid so just null
            //review_date: review_date ? new Date(review_date) : null
            review_date : null
        };

        if (req.file) {
            // look up the employee to get their persona/bucket
            const employee = await prisma.employee.findUnique({
                where: {username: resolvedOwner}
            });

            if (!employee) {
                return res.status(404).json({error: 'Employee not found'});
            }

            const bucket = employee.persona;

            const {error} = await supabase.storage
                .from(bucket)
                .upload(req.file.originalname, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true  // overwrites existing file with same name
                });

            if (error) {
                return res.status(500).json({error: 'Failed to upload file to Supabase', details: error.message});
            }

            const {data: urlData} = supabase.storage
                .from(bucket)
                .getPublicUrl(req.file.originalname);

            updateData.url = `${urlData.publicUrl}?t=${Date.now()}`;
        } else if (req.body.url) {
            try {
                new URL(req.body.url);
            } catch (error) {
                return res.status(400).json({error: 'Invalid URL'});
            }
            updateData.url = req.body.url;
        }

        const updated = await prisma.contentform.update({
            where: {id},
            data: updateData
        });

        const sender = await prisma.employee.findUnique({ where: { auth0Id } });
        if (sender && updated.persona && updated.persona.length > 0) {
            const allRecipients = [];
            for (const p of updated.persona) {
                const recipients = await prisma.employee.findMany({
                    where: { persona: p },
                    select: { empid: true }
                });
                allRecipients.push(...recipients);
            }

            const admins = await prisma.admin.findMany({
                select: { adid: true }
            });
            const adminEmpids = admins.map(a => a.adid);

            const recipientEmpids = [...new Set([...allRecipients.map(e => e.empid), ...adminEmpids])];

            if (recipientEmpids.length > 0) {
                await sendNotificationToUsers(
                    'Document Updated',
                    `Document "${updated.name}" has been updated.`,
                    recipientEmpids,
                    sender.empid
                );
            }
        }

        const employee1 = await prisma.employee.findUnique({
            where: {username: username}
        })

        const transaction = await prisma.changes.create({
            data: {
                id: updated.id,
                empid: employee1.empid,
                change: "Updated Document",
                date: new Date().toISOString()
            }
        })

        res.json(updated);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.get('/contentforms/employee/:empid', checkJWT, async (req, res) => {
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

router.post('/newtag', checkJWT, async(req, res) => {
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

router.post('/assigntag', checkJWT, async(req, res) => {
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

router.get('/grabtaggedforms/:name', checkJWT, async(req, res) => {
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

router.get('/grabformtags/:name', checkJWT, async(req, res) => {
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

        const tags= await prisma.metatags.findMany({
            where: {
                metid: { in: tagged }
            }
        })

        return res.status(200).json({data: tags});

    } catch (error) {
        res.status(500).json({ error: 'Cannot find tags for this form' });
    }
})

router.delete('/unassigntag', checkJWT, async(req, res) => {
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

router.delete('/deletetag', checkJWT, async(req, res) => {
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

router.get('/getTags', async (req, res) => {
    const tags = await prisma.metatags.findMany();

    return res.json({data: tags})
});

router.get('/favorites', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id}
        })

        if (!employee) return res.status(404).json({ error: 'No employee found' });

        const favRows = await prisma.joinedfavorites.findMany({
            where: { empid: employee.empid }
        });

        const ids = favRows.map(r => r.id);

        const forms = await prisma.contentform.findMany({
            where: { id: { in: ids } }
        });

        return res.json(forms);
    } catch (err) {
        res.status(500).json({ error: 'No favorite documents found' });
    }
});

router.post('/addFavorite', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {username, formname} = req.body;

    const employee = await prisma.employee.findUnique({
        where: {username: username}
    })

    const document = await prisma.contentform.findUnique({
        where: {name: formname}
    })

    if (!document || !employee) {
        return res.status(404).json({error: 'No document/employee found with this name'});
    }

    try {
        const addFavorite = await prisma.joinedfavorites.create({
            data: {
                empid: employee.empid,
                id: document.id

            },
        });
        console.log("added favorite");
        return res.json(addFavorite);
    } catch (error) {
        return res.status(500).json({error: 'Could not add document to favorites'});
    }
})

router.delete('/removeFavorite', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {username, formname} = req.body;

    const employee = await prisma.employee.findUnique({
        where: {username: username}
    })

    const document = await prisma.contentform.findUnique({
        where: {name: formname}
    })

    if (!document || !employee) {
        return res.status(404).json({error: 'No document/employee found with this name'});
    }
    try {
        const removed = await prisma.joinedfavorites.deleteMany({
            where: {
                empid: employee.empid,
                id: document.id
            }
        })

        return res.json(removed);
    } catch (error) {
        return res.status(500).json({error: 'Could not remove document from favorites'});
    }
})

router.post('/transactionDates', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const today = new Date();

    const transactions = await prisma.changes.findMany({
        where: {date: today}
    })

    return(transactions);
})

router.post('/changes', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const username = await resolveRequestUsername(req);
    try {
        const emp1 = await prisma.employee.findUnique({
            where: { username: username }
        })

        if (!emp1) {
            return res.json([]); // no employee found
        }

        if (emp1.persona === 'Admin') {
            const changes = await prisma.changes.findMany();
            return res.json(changes);
        }

        const changes = await prisma.changes.findMany({
            where: {empid: emp1.empid}
        });
        res.json(changes);
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});


export default router;

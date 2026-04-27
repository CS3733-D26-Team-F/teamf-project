import { Router } from 'express';
import {prisma} from '../setup/prisma.js';
import {supabase} from '../setup/supabase.js';
import {upload} from '../setup/upload.js';
import {checkJWT} from '../setup/auth0.js';
import { sendNotificationToUsers } from './notifications.js';

const router = Router();

function isAdminPersona(persona: string | null | undefined) {
    return (persona ?? '').toLowerCase() === 'admin';
}

function hasFolderAccess(
    employee: { empid: number; persona: string | null; username: string },
    folder: { owner_empid: number; persona: string[]; allowed_users: string[] }
) {
    const hasPersonaAccess = !!employee.persona && folder.persona.includes(employee.persona);
    const hasUserAccess = folder.allowed_users.includes(employee.username);

    return isAdminPersona(employee.persona) || folder.owner_empid === employee.empid || hasPersonaAccess || hasUserAccess;
}

function canSeeFolder(
    employee: { empid: number; persona: string | null; username: string },
    folder: { owner_empid: number; persona: string[]; allowed_users: string[] }
) {
    const hasPersonaAccess = !!employee.persona && folder.persona.includes(employee.persona);
    const hasUserAccess = folder.allowed_users.includes(employee.username);

    return folder.owner_empid === employee.empid || hasPersonaAccess || hasUserAccess;
}

function formatFolder(folders: {
    id: number;
    name: string;
    parent_folder_id?: number | null;
    persona: string[];
    allowed_users: string[];
    url: string | null;
    updated_at: Date;
    employee: { username: string };
    contentform: Array<{ id: number }>;
}) {
    return {
        id: folders.id,
        name: folders.name,
        parent_folder_id: folders.parent_folder_id ?? null,
        owner: folders.employee.username,
        persona: folders.persona,
        allowed_users: folders.allowed_users,
        associated_docsIDs: folders.contentform.map((doc) => doc.id),
        date_modified: folders.updated_at.toISOString(),
        url: folders.url ?? ''
    };
}

function formatContentFormWithFolder(
    contentForm: Record<string, unknown> & { folder?: { name: string } | null }
) {
    return {
        ...contentForm,
        folder: contentForm.folder?.name ?? ''
    };
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
        where: {is_deleted: false},
        include: {
            folder: {
                select: {name: true}
            }
        }
    });
    res.json(contentForms.map(formatContentFormWithFolder));
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
        review_date
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
            filename,
            ownerUsername,
            date_modified,
            expiration_date,
            review_date,
            content_type,
            status
        } = req.body;
        const rawFolderId = req.body.folder_id ?? req.body.folderId;
        const folderId = rawFolderId !== undefined && rawFolderId !== '' ? Number(rawFolderId) : null;
        const file = req.file;
        const rawUrl = req.body.url;

        if (folderId !== null && Number.isNaN(folderId)) {
            return res.status(400).json({error: 'Invalid folder id'});
        }

        if (!file && !rawUrl) {
            return res.status(400).json({error: 'File or URL is required'});
        }

        if (!filename || !ownerUsername || !date_modified || !expiration_date || !content_type || !status) {
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
                name: filename,
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
                review_date: new Date(),
                ...(folderId !== null ? {folder: {connect: {id: folderId}}} : {})
            },
            include: {
                folder: {
                    select: {name: true}
                }
            }
        });

        return res.status(200).json({
            message: 'Content form created successfully',
            data: formatContentFormWithFolder(content),
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
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const trashedDocuments = await prisma.contentform.findMany({
            where: {is_deleted: true}
        });

        const trashedFolders = await prisma.folders.findMany({
            where: {
                is_deleted: true,
                ...(isAdminPersona(employee.persona)
                    ? {}
                    : {
                        OR: [
                            {owner_empid: employee.empid},
                            {persona: {has: employee.persona ?? ''}},
                            {allowed_users: {has: employee.username}}
                        ]
                    })
            },
            include: {
                employee: {select: {username: true}},
                contentform: {
                    where: {is_deleted: true},
                    include: {
                        folder: {select: {name: true}}
                    },
                    orderBy: {deleted_at: 'desc'}
                }
            },
            orderBy: {deleted_at: 'desc'}
        });

        res.json({
            documents: trashedDocuments,
            folders: trashedFolders.filter(folder => canSeeFolder(employee, folder)).map(folder => ({
                ...formatFolder(folder),
                is_deleted: folder.is_deleted,
                deleted_at: folder.deleted_at,
                documents: folder.contentform.map(formatContentFormWithFolder)
            }))
        });
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

// Soft delete - sets is_deleted flag instead of removing from DB
router.patch('/contentforms/:id/softdelete', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
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
        const existing = await prisma.contentform.findUnique({
            where: {id},
            select: {folder_id: true}
        });

        if (!existing) {
            return res.status(404).json({error: 'Document not found'});
        }

        let folderIdForRestore: number | null = existing.folder_id;
        if (existing.folder_id !== null) {
            const parentFolder = await prisma.folders.findUnique({
                where: {id: existing.folder_id},
                select: {is_deleted: true}
            });
            if (parentFolder?.is_deleted) {
                // If folder is still in trash, restore document outside folder.
                folderIdForRestore = null;
            }
        }

        const restored = await prisma.contentform.update({
            where: {id},
            data: {is_deleted: false, deleted_at: null, folder_id: folderIdForRestore}
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
            where: {status: 'Archived', is_deleted: false},
            include: {
                folder: {
                    select: {name: true}
                }
            }
        });
        res.json(archived.map(formatContentFormWithFolder));
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
            where: {status: 'Expired', is_deleted: false},
            include: {
                folder: {
                    select: {name: true}
                }
            }
        });
        res.json(expired.map(formatContentFormWithFolder));
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
            data: {status, expiration_date: new Date()},
            include: {
                folder: {
                    select: {name: true}
                }
            }
        });
        res.json(formatContentFormWithFolder(updated));
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.get('/folders', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const folders = await prisma.folders.findMany({
            where: {
                is_deleted: false,
                ...(isAdminPersona(employee.persona)
                    ? {}
                    : {
                        OR: [
                            {owner_empid: employee.empid},
                            {persona: {has: employee.persona ?? ''}},
                            {allowed_users: {has: employee.username}}
                        ]
                    })
            },
            include: {
                employee: {select: {username: true}},
                contentform: {select: {id: true}}
            },
            orderBy: {updated_at: 'desc'}
        });

        return res.json(folders.filter(folder => canSeeFolder(employee, folder)).map(formatFolder));
    } catch (error) {
        console.error('folders fetch error:', error);
        return res.status(500).json({error: 'Could not fetch folders'});
    }
});

router.post('/folders', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {name, persona, allowedUsers, parentFolderId} = req.body as {
        name?: string;
        persona?: string[];
        allowedUsers?: string[];
        parentFolderId?: number | null;
    };

    if (!name || !name.trim()) {
        return res.status(400).json({error: 'Folder name is required'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const normalizedParentFolderId = parentFolderId === null || parentFolderId === undefined
            ? null
            : Number(parentFolderId);

        if (normalizedParentFolderId !== null && Number.isNaN(normalizedParentFolderId)) {
            return res.status(400).json({error: 'Invalid parent folder id'});
        }

        if (normalizedParentFolderId !== null) {
            const parentFolder = await prisma.folders.findUnique({
                where: {id: normalizedParentFolderId},
                select: {
                    id: true,
                    owner_empid: true,
                    persona: true,
                    allowed_users: true,
                    is_deleted: true
                }
            });

            if (!parentFolder) {
                return res.status(404).json({error: 'Parent folder not found'});
            }

            if (parentFolder.is_deleted) {
                return res.status(409).json({error: 'Parent folder is in trash'});
            }

            if (!hasFolderAccess(employee, parentFolder)) {
                return res.status(403).json({error: 'Not allowed to create inside this parent folder'});
            }
        }

        const folder = await prisma.folders.create({
            data: {
                name: name.trim(),
                owner_empid: employee.empid,
                parent_folder_id: normalizedParentFolderId,
                persona: Array.isArray(persona) && persona.length > 0
                    ? persona
                    : [employee.persona ?? ''].filter(Boolean),
                allowed_users: Array.isArray(allowedUsers)
                    ? Array.from(new Set(allowedUsers.filter(Boolean)))
                    : [],
                    updated_at: new Date()
            },
            include: {
                employee: {select: {username: true}},
                contentform: {select: {id: true}}
            }
        });

        return res.status(201).json(formatFolder(folder));
    } catch (error: unknown) {
        if ((error as { code?: string }).code === 'P2002') {
            return res.status(409).json({error: 'Folder name already exists'});
        }
        if ((error as { code?: string }).code === 'P2022') {
            return res.status(500).json({error: 'Database schema is out of date. Run prisma db push.'});
        }
        console.error('folders create error:', error);
        return res.status(500).json({error: 'Could not create folder'});
    }
});

router.patch('/folders/:id', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const {name, persona, allowedUsers, parentFolderId} = req.body as {
        name?: string;
        persona?: string[];
        allowedUsers?: string[];
        parentFolderId?: number | null;
    };

    if (Number.isNaN(id)) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const existingFolder = await prisma.folders.findUnique({
            where: {id},
            select: {owner_empid: true, parent_folder_id: true}
        });

        if (!existingFolder) {
            return res.status(404).json({error: 'Folder not found'});
        }

        if (!isAdminPersona(employee.persona) && existingFolder.owner_empid !== employee.empid) {
            return res.status(403).json({error: 'Not allowed to edit this folder'});
        }

        const updateData: {
            name?: string;
            persona?: string[];
            allowed_users?: string[];
            parent_folder_id?: number | null;
        } = {};

        if (name !== undefined) {
            const trimmedName = name.trim();
            if (!trimmedName) {
                return res.status(400).json({error: 'Folder name is required'});
            }
            updateData.name = trimmedName;
        }

        if (Array.isArray(persona)) {
            updateData.persona = persona.filter(Boolean);
        }

        if (Array.isArray(allowedUsers)) {
            updateData.allowed_users = Array.from(new Set(allowedUsers.filter(Boolean)));
        }

        if (parentFolderId !== undefined) {
            const normalizedParentFolderId = parentFolderId === null ? null : Number(parentFolderId);

            if (normalizedParentFolderId !== null && Number.isNaN(normalizedParentFolderId)) {
                return res.status(400).json({error: 'Invalid parent folder id'});
            }

            if (normalizedParentFolderId === id) {
                return res.status(400).json({error: 'Folder cannot be its own parent'});
            }

            if (normalizedParentFolderId !== null) {
                const parentFolder = await prisma.folders.findUnique({
                    where: {id: normalizedParentFolderId},
                    select: {
                        id: true,
                        parent_folder_id: true,
                        owner_empid: true,
                        persona: true,
                        allowed_users: true,
                        is_deleted: true
                    }
                });

                if (!parentFolder) {
                    return res.status(404).json({error: 'Parent folder not found'});
                }

                if (parentFolder.is_deleted) {
                    return res.status(409).json({error: 'Parent folder is in trash'});
                }

                if (!hasFolderAccess(employee, parentFolder)) {
                    return res.status(403).json({error: 'Not allowed to move folder into this parent'});
                }

                let cursor: number | null = parentFolder.id;
                while (cursor !== null) {
                    if (cursor === id) {
                        return res.status(400).json({error: 'Cannot move folder into its own descendant'});
                    }

                    const nextFolder: any = await prisma.folders.findUnique({
                        where: {id: cursor}
                    });

                    cursor = (nextFolder as any)?.parent_folder_id ?? null;
                }
            }

            updateData.parent_folder_id = normalizedParentFolderId;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({error: 'No changes provided'});
        }

        const updatedFolder = await prisma.folders.update({
            where: {id},
            data: updateData,
            include: {
                employee: {select: {username: true}},
                contentform: {select: {id: true}}
            }
        });

        return res.json(formatFolder(updatedFolder));
    } catch (error: unknown) {
        if ((error as { code?: string }).code === 'P2002') {
            return res.status(409).json({error: 'Folder name already exists'});
        }
        if ((error as { code?: string }).code === 'P2022') {
            return res.status(500).json({error: 'Database schema is out of date. Run prisma db push.'});
        }
        console.error('folders update error:', error);
        return res.status(500).json({error: 'Could not update folder'});
    }
});

router.delete('/folders/:id', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const folder = await prisma.folders.findUnique({
            where: {id},
            select: {id: true, name: true, owner_empid: true, is_deleted: true}
        });

        if (!folder) {
            return res.status(404).json({error: 'Folder not found'});
        }

        if (folder.is_deleted) {
            return res.status(409).json({error: 'Folder is already in trash'});
        }

        if (!isAdminPersona(employee.persona) && folder.owner_empid !== employee.empid) {
            return res.status(403).json({error: 'Not allowed to delete this folder'});
        }

        const result = await prisma.$transaction(async (tx) => {
            const softDeleted = await tx.contentform.updateMany({
                where: {
                    folder_id: id,
                    is_deleted: false
                },
                data: {
                    is_deleted: true,
                    deleted_at: new Date()
                }
            });

            await tx.folders.update({
                where: {id},
                data: {
                    is_deleted: true,
                    deleted_at: new Date(),
                    updated_at: new Date()
                }
            });

            return {
                softDeletedCount: softDeleted.count,
                folderName: folder.name
            };
        });

        return res.json({
            message: 'Folder deleted and contents moved to trash',
            ...result
        });
    } catch (error: unknown) {
        console.error('folders delete error:', error);
        return res.status(500).json({error: 'Could not delete folder'});
    }
});

router.patch('/folders/:id/restore', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const folder = await prisma.folders.findUnique({
            where: {id},
            select: {owner_empid: true, is_deleted: true}
        });

        if (!folder) {
            return res.status(404).json({error: 'Folder not found'});
        }

        if (!isAdminPersona(employee.persona) && folder.owner_empid !== employee.empid) {
            return res.status(403).json({error: 'Not allowed to restore this folder'});
        }

        if (!folder.is_deleted) {
            return res.status(409).json({error: 'Folder is not in trash'});
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.folders.update({
                where: {id},
                data: {
                    is_deleted: false,
                    deleted_at: null,
                    updated_at: new Date()
                }
            });

            const restoredDocs = await tx.contentform.updateMany({
                where: {folder_id: id, is_deleted: true},
                data: {is_deleted: false, deleted_at: null}
            });

            return {restoredDocsCount: restoredDocs.count};
        });

        return res.json({message: 'Folder restored', ...result});
    } catch (error) {
        return res.status(500).json({error: 'Could not restore folder'});
    }
});

router.delete('/folders/:id/permanent', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const folder = await prisma.folders.findUnique({
            where: {id},
            select: {owner_empid: true, is_deleted: true}
        });

        if (!folder) {
            return res.status(404).json({error: 'Folder not found'});
        }

        if (!isAdminPersona(employee.persona) && folder.owner_empid !== employee.empid) {
            return res.status(403).json({error: 'Not allowed to permanently delete this folder'});
        }

        if (!folder.is_deleted) {
            return res.status(409).json({error: 'Folder must be in trash before permanent delete'});
        }

        const result = await prisma.$transaction(async (tx) => {
            const deletedDocs = await tx.contentform.deleteMany({where: {folder_id: id}});
            await tx.folders.delete({where: {id}});
            return {deletedDocsCount: deletedDocs.count};
        });

        return res.json({message: 'Folder permanently deleted', ...result});
    } catch (error) {
        return res.status(500).json({error: 'Could not permanently delete folder'});
    }
});

router.post('/folders/:id', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });
        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const folderToCopy = await prisma.folders.findUnique({
            where: {id},
            include: {contentform: true}
        });

        if (!folderToCopy) {
            return res.status(404).json({error: 'Folder to copy not found'});
        }

        if (folderToCopy.is_deleted) {
            return res.status(409).json({error: 'Cannot duplicate a folder in trash'});
        }

        const hasPersonaAccess = !!employee.persona && folderToCopy.persona.includes(employee.persona);
        const hasUserAccess = folderToCopy.allowed_users.includes(employee.username);

        if (!isAdminPersona(employee.persona) && folderToCopy.owner_empid !== employee.empid && !hasPersonaAccess && !hasUserAccess) {
            return res.status(403).json({error: 'Not allowed to duplicate this folder'});
        }

        const buildCopyFolderName = async () => {
            const baseName = folderToCopy.name;
            let counter = 1;
            let candidate = `${baseName} (Copy)`;

            while (await prisma.folders.findFirst({
                where: {
                    owner_empid: employee.empid,
                    name: candidate
                },
                select: {id: true}
            })) {
                counter++;
                candidate = `${baseName} (Copy ${counter})`;
            }

            return candidate;
        };

        const buildCopyContentName = async (baseName: string) => {
            let counter = 1;
            let candidate = `${baseName} (Copy)`;

            while (await prisma.contentform.findUnique({where: {name: candidate}, select: {id: true}})) {
                counter++;
                candidate = `${baseName} (Copy ${counter})`;
            }

            return candidate;
        };

        const buildCopyUrl = async (sourceUrl: string) => {
            let counter = 1;
            let candidate = sourceUrl;

            while (await prisma.contentform.findUnique({where: {url: candidate}, select: {id: true}})) {
                try {
                    const parsed = new URL(sourceUrl);
                    parsed.searchParams.set('copy', String(counter));
                    candidate = parsed.toString();
                } catch {
                    const separator = sourceUrl.includes('?') ? '&' : '?';
                    candidate = `${sourceUrl}${separator}copy=${counter}`;
                }
                counter++;
            }

            return candidate;
        };

        const newFolderName = await buildCopyFolderName();

        const newFolder = await prisma.folders.create({
            data: {
                name: newFolderName,
                owner_empid: employee.empid,
                parent_folder_id: (folderToCopy as any).parent_folder_id ?? null,
                persona: folderToCopy.persona,
                allowed_users: folderToCopy.allowed_users,
                updated_at: new Date()
            },
            include: {
                employee: {select: {username: true}}
            }
        });

        const copiedContentForms = await Promise.all(folderToCopy.contentform.map(async (content) => {
            const copiedName = await buildCopyContentName(content.name);
            const copiedUrl = await buildCopyUrl(content.url);

            const newContent = await prisma.contentform.create({
                data: {
                    name: copiedName,
                    url: copiedUrl,
                    owner: content.owner,
                    persona: content.persona,
                    date_modified: content.date_modified,
                    expiration_date: content.expiration_date,
                    content_type: content.content_type,
                    status: content.status,
                    review_date: content.review_date,
                    empid: content.empid,
                    folder_id: newFolder.id
                }
            });
            return newContent;
        }));

        return res.json({
            message: 'Folder copied successfully',
            folder: formatFolder({
                ...newFolder,
                contentform: copiedContentForms.map((content) => ({id: content.id}))
            }),
            contentForms: copiedContentForms.map(formatContentFormWithFolder)
        });
    } catch (error) {
        console.error('folders copy error:', error);
        return res.status(500).json({error: 'Could not copy folder'});
    }
    
});

router.patch('/contentforms/folder/bulk', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const {ids, folderId} = req.body as { ids?: number[]; folderId?: number | null };

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({error: 'Document ids are required'});
    }

    if (folderId !== null && folderId !== undefined && Number.isNaN(Number(folderId))) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const normalizedFolderId = folderId === null || folderId === undefined ? null : Number(folderId);

        if (normalizedFolderId !== null) {
            const folder = await prisma.folders.findUnique({
                where: {id: normalizedFolderId},
                select: {id: true, owner_empid: true, persona: true, allowed_users: true}
            });

            if (!folder) {
                return res.status(404).json({error: 'Folder not found'});
            }

            const hasPersonaAccess = !!employee.persona && folder.persona.includes(employee.persona);
            const hasUserAccess = folder.allowed_users.includes(employee.username);

            if (!isAdminPersona(employee.persona) && folder.owner_empid !== employee.empid && !hasPersonaAccess && !hasUserAccess) {
                return res.status(403).json({error: 'Not allowed to use this folder'});
            }
        }

        const updated = await prisma.contentform.updateMany({
            where: {id: {in: ids}},
            data: {folder_id: normalizedFolderId}
        });

        return res.json({updated: updated.count});
    } catch (error) {
        return res.status(500).json({error: 'Could not move documents'});
    }
});

router.patch('/contentforms/:id/folder', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const {folderId} = req.body as { folderId?: number | null };

    if (Number.isNaN(id)) {
        return res.status(400).json({error: 'Invalid document id'});
    }

    if (folderId !== null && folderId !== undefined && Number.isNaN(Number(folderId))) {
        return res.status(400).json({error: 'Invalid folder id'});
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: {auth0Id},
            select: {empid: true, persona: true, username: true}
        });

        if (!employee) {
            return res.status(404).json({error: 'Employee not found'});
        }

        const normalizedFolderId = folderId === null || folderId === undefined ? null : Number(folderId);

        if (normalizedFolderId !== null) {
            const folder = await prisma.folders.findUnique({
                where: {id: normalizedFolderId},
                select: {owner_empid: true, persona: true, allowed_users: true}
            });

            if (!folder) {
                return res.status(404).json({error: 'Folder not found'});
            }

            const hasPersonaAccess = !!employee.persona && folder.persona.includes(employee.persona);
            const hasUserAccess = folder.allowed_users.includes(employee.username);

            if (!isAdminPersona(employee.persona) && folder.owner_empid !== employee.empid && !hasPersonaAccess && !hasUserAccess) {
                return res.status(403).json({error: 'Not allowed to use this folder'});
            }
        }

        const updated = await prisma.contentform.update({
            where: {id},
            data: {status}
        });

        return res.json(formatContentFormWithFolder(updated));
    } catch (error) {
        return res.status(500).json({error: 'Could not move document'});
    }
});

router.get('/contentforms/:id', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const id = parseInt(req.params.id);
        const contentForm = await prisma.contentform.findUnique({
            where: {id},
            include: {
                folder: {
                    select: {name: true}
                }
            }
        });
        if (!contentForm) return res.status(404).json({error: 'Not found'});
        res.json(formatContentFormWithFolder(contentForm));
    } catch (error) {
        res.status(500).json({error: 'Something went wrong'});
    }
});

router.post('/contentforms/:id/checkout', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const id = parseInt(req.params.id);
    const {username} = req.body;
    console.log('checkout hit', {id, username});

    if (!username) {
        return res.status(400).send('Requires username');
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
            return res.status(200).json({message: 'Document checked out successfully'});
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
    const {username} = req.body;

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

            return res.status(200).json({message: 'Document checked in successfully'});
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
            status
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
            name,
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

export default router;

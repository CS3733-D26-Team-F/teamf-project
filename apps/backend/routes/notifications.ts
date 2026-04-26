import { Router } from 'express';
import {prisma} from '../setup/prisma.js';
import {checkJWT} from '../setup/auth0.js';

const router = Router();

export async function checkExpiringDocuments(senderEmpId: number) {
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const expiringDocs = await prisma.contentform.findMany({
        where: {
            expiration_date: { lte: fortyEightHoursFromNow, gte: now },
            is_deleted: false,
            owner: { not: null },
            OR: [
                { warning: false },
                { warning: null },
            ],
            status: { not: 'Expired' },
        },
    });

    if (expiringDocs.length === 0) {
        return 0;
    }

    const admins = await prisma.admin.findMany({
        select: { adid: true },
    });
    const adminEmpids = admins.map(a => a.adid);

    for (const doc of expiringDocs) {
        const owner = await prisma.employee.findUnique({
            where: { username: doc.owner! },
            select: { empid: true },
        });

        if (!owner) continue;

        const recipientEmpids = [owner.empid, ...adminEmpids].filter(
            (empid, index, arr) => arr.indexOf(empid) === index
        );

        const formattedDate = doc.expiration_date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        });

        const notification = await prisma.notifications.create({
            data: {
                title: 'Document Expiring Soon',
                message: `Document ${doc.name} is going to expire at ${formattedDate} (less than 48 hours)`,
                send_date: new Date(),
                importance: 1,
                sender: senderEmpId,
            }
        });

        await prisma.joinednotice.createMany({
            data: recipientEmpids.map(empid => ({
                empid,
                notid: notification.notid,
                read: false,
            })),
        });

        await prisma.contentform.update({
            where: { id: doc.id },
            data: { warning: true },
        });
    }

    return expiringDocs.length;
}

router.get('/notifications', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const employee = await prisma.employee.findUnique({ where: { auth0Id } });
        if (!employee)
            return res.status(404).json({ error: 'Employee not found' });

        const notifications = await prisma.joinednotice.findMany({
            where: { empid: employee.empid },
            include: {
                notifications: {
                    select: {
                        notid: true,
                        title: true,
                        message: true,
                        send_date: true,
                        importance: true,
                    }
                }
            },
            orderBy: {
                notifications: {
                    send_date: 'desc',
                }
            }
        });

        const result = notifications.map(jn => ({
            notid: jn.notifications.notid,
            title: jn.notifications.title,
            message: jn.notifications.message,
            send_date: jn.notifications.send_date,
            importance: jn.notifications.importance,
            read: jn.read,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.post('/notifications', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    try {
        const sender = await prisma.employee.findUnique({ where: { auth0Id } });
        if (!sender) return res.status(404).json({ error: 'Sender not found' });

        const { title, message, importance, recipientEmpids } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }

        const notification = await prisma.notifications.create({
            data: {
                title,
                message,
                send_date: new Date(),
                importance: importance ?? null,
                sender: sender.empid,
            }
        });

        if (recipientEmpids && Array.isArray(recipientEmpids) && recipientEmpids.length > 0) {
            await prisma.joinednotice.createMany({
                data: recipientEmpids.map((empid: number) => ({
                    empid,
                    notid: notification.notid,
                    read: false,
                })),
            });
        }

        res.status(201).json({
            message: 'Notification created',
            notification: {
                notid: notification.notid,
                title: notification.title,
                message: notification.message,
                send_date: notification.send_date,
                importance: notification.importance,
                read: false,
            }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.get('/notifications/check-expiring', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    try {
        const employee = await prisma.employee.findUnique({ where: { auth0Id } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const now = new Date();
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const expiringDocs = await prisma.contentform.findMany({
            where: {
                expiration_date: { lte: fortyEightHoursFromNow, gte: now },
                is_deleted: false,
                owner: { not: null },
                OR: [
                    { warning: false },
                    { warning: null },
                ],
                status: { not: 'Expired' },
            },
        });

        if (expiringDocs.length === 0) {
            return res.json({ message: 'No expiring documents found' });
        }

        const admins = await prisma.admin.findMany({
            select: { adid: true },
        });
        const adminEmpids = admins.map(a => a.adid);

        for (const doc of expiringDocs) {
            const owner = await prisma.employee.findUnique({
                where: { username: doc.owner! },
                select: { empid: true },
            });

            if (!owner) continue;

            const recipientEmpids = [owner.empid, ...adminEmpids].filter(
                (empid, index, arr) => arr.indexOf(empid) === index
            );

            const formattedDate = doc.expiration_date.toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
            });

            const notification = await prisma.notifications.create({
                data: {
                    title: 'Document Expiring Soon',
                    message: `Document ${doc.name} is going to expire at ${formattedDate} (less than 48 hours)`,
                    send_date: new Date(),
                    importance: 1,
                    sender: employee.empid,
                }
            });

            await prisma.joinednotice.createMany({
                data: recipientEmpids.map(empid => ({
                    empid,
                    notid: notification.notid,
                    read: false,
                })),
            });

            await prisma.contentform.update({
                where: { id: doc.id },
                data: { warning: true },
            });
        }

        res.json({
            message: `Processed ${expiringDocs.length} expiring document(s)`,
            count: expiringDocs.length,
        });
    } catch (error) {
        console.error('Error checking expiring documents:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.patch('/notifications/:notid/read', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const { notid } = req.params;
    const { read } = req.body;
    
    try {
        const employee = await prisma.employee.findUnique({ where: { auth0Id } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const updated = await prisma.joinednotice.update({
            where: {
                empid_notid: {
                    empid: employee.empid,
                    notid: parseInt(notid),
                }
            },
            data: { read }
        });

        res.json({ message: 'Notification read status updated', read: updated.read });
    } catch (error) {
        console.error('Error updating notification read status:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

router.delete('/notifications/:notid', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const { notid } = req.params;

    try {
        const employee = await prisma.employee.findUnique({ where: { auth0Id } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        await prisma.joinednotice.delete({
            where: {
                empid_notid: {
                    empid: employee.empid,
                    notid: parseInt(notid),
                }
            },
        });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;

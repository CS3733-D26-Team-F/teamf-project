import { Router } from 'express';
import {prisma} from '../setup/prisma.js';
import {supabase} from '../setup/supabase.js';
import {upload} from '../setup/upload.js';
import {checkJWT, management, getManagementToken} from '../setup/auth0.js';
import path from 'path';

const distPath = path.resolve("../frontend/dist");

const router = Router();

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
            }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

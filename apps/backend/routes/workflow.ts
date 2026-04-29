import {Router, Request, Response} from "express";
import {prisma} from '../setup/prisma.js'
import {checkJWT} from '../setup/auth0.js'

const router = Router();

//all workflows

router.get('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {empid, role} = req.query;

    try {
        let workflows;

        if (role === 'creator') {
            workflows = await prisma.workflow.findMany({
                where: {creator_id: Number(empid)},
                include: {creator: true, reviewer: true, approver: true}
            });
        } else if (role === 'reviewer') {
            workflows = await prisma.workflow.findMany({
                where: {reviewer_id: Number(empid)},
                include: {creator: true, reviewer: true, approver: true}
            });
        } else if (role === 'approver') {
            workflows = await prisma.workflow.findMany({
                where: {approver_id: Number(empid)},
                include: {creator: true, reviwer: true, approver: true}
            });
        } else {
            workflows = await prisma.workflow.findMany({
                include: {creator: true, reviewer: true, approver: true}
            });
        }
        res.json(workflows);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

// workflow creation

router.post('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {title, creator_id, reviewer_id, approver_id} = req.body;

    if (!title || !creator_id || !reviewer_id || !approver_id) {
        return res.status(400).send({error: 'id is required'});
    }

    try {
        const workflow = await prisma.workflow.create({
            data: {
                title,
                status: 'pending review',
                creator_id: Number(creator_id),
                reviewer_id: Number(reviewer_id),
                approver_id: Number(approver_id),
            }
        });
        res.status(200).json(workflow);
    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'no workflow found'});
    }
});

// reviewer submission
router.patch('/workflows/:id/review', checkJWT, async (req: Request, res: Response) => {
    const {id} = req.params;
    const {reviewer_status} = req.body;

    try {
        const workflow = await prisma.workflow.update({
            where: {id: Number(id)},
            data: {
                reviewer_status,
                reviewer_date: new Date(),
                status: reviewer_status === 'reviewed' ? 'pending_reviewed' : 'denied'
            }
        });
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

//approver submission
router.patch('/workflows/:id/approve', checkJWT, async (req: Request, res: Response) => {
    const {id} = req.params;
    const {approver_status} = req.body;

    try {
        const workflow = await prisma.workflow.update({
            where: {id: Number(id)},
            data: {
                approver_status,
                reviewer_date: new Date(),
                status: approver_status === 'approved' ? 'pending_approval' : 'rejected'
            }
        });
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

//get only one workflow
router.get('/workflows/:id', checkJWT, async (req: Request, res: Response) => {
    const {id} = req.params;
    try {
        const workflow = await prisma.workflow.findUnique({
            where: {id: Number(id)},
            include: {creator: true, reviewer: true, approver: true}
        });
        if (!workflow) return res.status(404).send({error: 'no workflow found'});
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

export default router;
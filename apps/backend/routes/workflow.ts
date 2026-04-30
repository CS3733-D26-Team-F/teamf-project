import {Router, Request, Response} from "express";
import {prisma} from '../setup/prisma.js'
import {checkJWT} from '../setup/auth0.js'

const router = Router();

//all workflows

router.get('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {empid, role} = req.query;

    try {
        let workflows;

        if (role === 'agent') {
            workflows = await prisma.workflow.findMany({
                where: {agent_id: Number(empid)},
                include: {agent: true, underwriter: true, approver: true}
            });
        } else if (role === 'underwriter') {
            workflows = await prisma.workflow.findMany({
                where: {underwriter_id: Number(empid)},
                include: {agent: true, underwriter: true, approver: true}
            });
        } else if (role === 'approver') {
            workflows = await prisma.workflow.findMany({
                where: {approver_id: Number(empid)},
                include: {agent: true, underwriter: true, approver: true}
            });
        } else {
            workflows = await prisma.workflow.findMany({
                include: {agent: true, underwriter: true, approver: true}
            });
        }
        res.json(workflows);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

// workflow creation

router.post('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {title, agent_id, underwriter_id, approver_id} = req.body;

    if (!title || !agent_id || !underwriter_id || !approver_id) {
        return res.status(400).send({error: 'id is required'});
    }

    try {
        const workflow = await prisma.workflow.create({
            data: {
                title,
                status: 'pending review',
                agent_id: Number(agent_id),
                underwriter_id: Number(underwriter_id),
                approver_id: Number(approver_id),
            }
        });
        res.status(200).json(workflow);
    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'no workflow found'});
    }
});

// underwriter submission
router.patch('/workflows/:id/review', checkJWT, async (req: Request, res: Response) => {
    const {id} = req.params;
    const {underwriter_status} = req.body;

    try {
        const workflow = await prisma.workflow.update({
            where: {id: Number(id)},
            data: {
                underwriter_status,
                status: underwriter_status === 'reviewed' ? 'pending_reviewed' : 'denied'
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
            include: {creator: true, underwriter: true, approver: true}
        });
        if (!workflow) return res.status(404).send({error: 'no workflow found'});
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

export default router;
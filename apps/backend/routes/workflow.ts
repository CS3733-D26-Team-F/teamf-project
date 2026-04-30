import {Router, Request, Response} from "express";
import {prisma} from '../setup/prisma.js'
import {checkJWT} from '../setup/auth0.js'

const router = Router();

//workflow creation

router.get('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {
        title,
        agent_id,
        underwriter_id,
        approver_id,
        name,
        carrier,
        policy_type,
        limits_liability,
        expiration_date
    } = req.body;

    if (!title || !agent_id || !underwriter_id || !approver_id) {
        return res.status(400).json({error: 'Missing fields'});
    }

    try {
        const workflows = await prisma.workflow.create({
            data: {
                title,
                status: ' pending_review',
                agent_id: Number(agent_id),
                underwriter_id: underwriter_id,
                approver_id: approver_id,
                agent_status: 'pending',
                form: {
                    create: {
                        name,
                        carrier,
                        policy_type,
                        limits_liability: Number(limits_liability),
                        expiration_date: new Date(expiration_date),
                    }
                }
            },
            include: {form: true}
        });
        res.status(200).json(workflows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'something wrong'});
    }
});

//

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

// underwriter reviewing
router.patch('/workflows/:id/review', checkJWT, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const {underwriter_status, rating, coverage, estimate} = req.body;

    try {
        const workflow = await prisma.workflow.update({
            where: {id},
            data: {
                underwriter_status,
                status: underwriter_status === 'approved' ? 'pending_review' : 'rejected',
                form: {
                    update: {
                        rating,
                        coverage: Number(coverage),
                        estimate: Number(estimate),
                    }
                }
            },
            include: {form: true}
        });
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'something wrong'});
    }
});

//approver approval ( ha ) + lock form
router.patch('/workflows/:id/approve', checkJWT, async (req: Request, res: Response) => {
    const {id} = req.params;
    const {approver_status} = req.body;

    try {
        const workflow = await prisma.workflow.update({
            where: {id: Number(id)},
            data: {
                approver_status,
                status: approver_status === 'approved' ? 'pending_approval' : 'rejected',
                is_locked: {form: true}
            },
            include: {form: true}
        });
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'no workflow found'});
    }
});

//get only one workflow
router.get('/workflows/:id', checkJWT, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
        const workflow = await prisma.workflow.findUnique({
            where: {id},
            include: {
                agent: true,
                underwriter: true,
                approver: true,
                form: true

            }
        });
        if (!workflow) return res.status(404).send({error: 'workflow not found'});
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'something wrong'});
    }
});

// get all

router.get('/workflows/:id', checkJWT, async (req: Request, res: Response) => {
    const {empid, persona} = req.query;

    try {
        let workflows;

        if (persona === 'Agent') {
            workflows = await prisma.workflow.findMany({
                where: {agent_id: Number(empid)},
                include: {agent: true, underwriter: true, approver: true, form: true}
            });
        } else if (persona === 'Underwriter') {
            workflows = await prisma.workflow.findMany({
                where: {underwriter_id: Number(empid)},
                include: {agent: true, underwriter: true, approver: true, form: true}
            });
        } else if (persona === 'Approver') {
            workflows = await prisma.workflow.findMany({
                where: {approver_id: Number(empid)},
                include: {agent: true, underwriter: true, approver: true, form: true}
            });
        }
        res.json(workflows);
    } catch (error) {
        res.status(500).send({error: 'something wrong'});
    }
})


export default router;
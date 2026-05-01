import {Router, Request, Response} from "express";
import {prisma} from '../setup/prisma.js'
import {checkJWT} from '../setup/auth0.js'
import {sendNotificationToUsers} from "./notifications.js";

const router = Router();

// get all workflows

router.get('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {empid, persona} = req.query;

    try {
        let workflows;

        if (persona === 'Agent') {
            workflows = await prisma.workflow.findMany({
                where: {agent_id: Number(empid)},
                include: {
                    employee_workflow_agent_idToemployee: true,
                    employee_workflow_underwriter_idToemployee: true,
                    approver: true,
                    workflow_form: true
                }
            });
        } else if (persona === 'Underwriter') {
            workflows = await prisma.workflow.findMany({
                where: {underwriter_id: Number(empid)},
                include: {
                    employee_workflow_agent_idToemployee: true,
                    employee_workflow_underwriter_idToemployee: true,
                    approver: true,
                    workflow_form: true

                }
            });
        } else if (persona === 'Approver') {
            workflows = await prisma.workflow.findMany({
                where: {approver_id: Number(empid)},
                include: {
                    employee_workflow_agent_idToemployee: true,
                    employee_workflow_underwriter_idToemployee: true,
                    approver: true,
                    workflow_form: true

                }
            });
        } else {
            workflows = await prisma.workflow.findMany({
                include: {
                    employee_workflow_agent_idToemployee: true,
                    employee_workflow_underwriter_idToemployee: true,
                    approver: true,
                    workflow_form: true
                }
            });
        }

        res.json(workflows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'something wrong'});
    }
});


// creating workflows

router.post('/workflows', checkJWT, async (req: Request, res: Response) => {
    const {title, agent_id, underwriter_id, approver_id, name, carrier, policy, liability, expiration_date} = req.body;

    if (!title || !agent_id || !underwriter_id || !approver_id) {
        return res.status(400).send({error: 'id is required'});
    }

    try {
        const workflow = await prisma.workflow.create({
            data: {
                title,
                status: 'pending_review',
                agent_id: Number(agent_id),
                underwriter_id: Number(underwriter_id),
                approver_id: Number(approver_id),
                agent_status: 'pending',
                workflow_form: {
                    create: {
                        name,
                        carrier,
                        policy_type: policy,
                        limits_liability: liability ? Number ( liability) : null,
                        expiration_date: expiration_date ? new Date(expiration_date) : null,
                    }
                }
            },
            include: {workflow_form: true}
        });
        await sendNotificationToUsers(
            'New Workflow',
            `a new workflow "${title}" has been created`,
            [Number(underwriter_id)],
            Number(agent_id)
        );
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
        const existing = await prisma.workflow.findUnique({where: {id}});
        const workflow = await prisma.workflow.update({
            where: {id},
            data: {
                underwriter_status,
                status: underwriter_status === 'approved' ? 'pending_review' : 'rejected',
                workflow_form: {
                    updateMany: {
                        where: {workflow_id: id},
                        data: {
                            rating,
                            coverage: Number(coverage),
                            estimate: Number(estimate),
                        }
                    }
                }
            },
            include: {workflow_form: true}
        });
        if (underwriter_status === 'approved') {
            await sendNotificationToUsers(
                'Workflow ready for approval',
                `Workflow "${existing?.title}" has been reviewed and is waiting approval`,
                [existing?.approver_id!],
                existing?.underwriter_id!
            );
        } else {
            await sendNotificationToUsers(
                'Workflow Rejected',
                `your workflow "${existing?.title}" has been rejected`,
                [existing?.approver_id!],
                existing?.underwriter_id!
            )
        }
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
        const existing = await prisma.workflow.findUnique({where: {id}});
        const workflow = await prisma.workflow.update({
            where: {id: Number(id)},
            data: {
                approver_status,
                status: approver_status === 'approved' ? 'pending_approval' : 'rejected',
                is_locked: true
            },
            include: {workflow_form: true}
        });
        await sendNotificationToUsers(
            approver_status === 'approved' ? 'Workflow Approved ' : 'Rejected',
            `Your workflow "${existing?.title}" has been ${approver_status} by an approver`,
            [existing?.approver_id!],
            existing?.underwriter_id!
        )

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
                employee_workflow_agent_idToemployee: true,
                employee_workflow_underwriter_idToemployee: true,
                approver: true,
                workflow_form: true

            }
        });
        if (!workflow) return res.status(404).send({error: 'workflow not found'});
        res.json(workflow);
    } catch (error) {
        res.status(500).send({error: 'something wrong'});
    }
});
export default router;
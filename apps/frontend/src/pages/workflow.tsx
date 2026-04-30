import {useEffect, useState} from "react";
import {Header} from "../components/Header.tsx";
import {Button, Modal, TextInput, Select, Table, Badge, Group, Text, Stack} from '@mantine/core'
import {useDisclosure} from "@mantine/hooks";
import {useApi} from "../components/api.ts";
import {DOMAIN} from '../const.ts'
import {useTranslation} from 'react-i18next'
import {FilledButton} from "../components/Buttons/FilledButton.tsx";

interface Workflow {
    id: number;
    title: string;
    status: string;
    agent_id: number;
    underwriter_id: number;
    approver_id: number;
    agent_status: string;
    underwriter_status: string;
    approver_status: string;
    agent: { username: string, persona: string };
    underwriter: { username: string, persona: string } | null;
    approver: { username: string, persona: string } | null
    form: workflowForm | null;
}

interface workflowForm {
    id: number;
    workflow_id: number;
    name: string | null,
    carrier: string | null,
    policy: string | null,
    liability: string | null,
    expiration_date: string | null,
    rating: string | null,
    coverage: string | null,
    estimate: string | null,
}

export function Workflow() {
    const api = useApi();
    const persona = localStorage.getItem('persona');
    const empid = localStorage.getItem('empid');
    const {t} = useTranslation();

    const [workflows, setWorkFlows] = useState<Workflow[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isAvailable, {open: openCreate, close: closeCreate}] = useDisclosure(false);
    const [isReviewAvailable, {open: openReview, close: closeReview}] = useDisclosure(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

    const [newWorkflow, setNewWorkflow] = useState({
        title: '',
        underwriter_id: '',
        approver_id: '',
        name: '',
        carrier: '',
        policy: '',
        liability: '',
        expiration_date: '',
        rating: '',
    });

    const loadWorkflows = async () => {
        const res = await api(`${DOMAIN}/workflows?empid=${empid}&persona=${persona}`);
        const data = await res.json();
        setWorkFlows(data);
    }
    const loadEmployees = async () => {
        const res = await api(`${DOMAIN}/employees`);
        const data = await res.json();
        setEmployees(data);
    }

    const [reviewData, setReviewData] = useState({
        rating: '',
        coverage: '',
        estimate: '',
    });

    useEffect(() => {
        loadWorkflows();
        loadEmployees();
    }, []);

    const handleCreateWorkflow = async () => {
        await api(`${DOMAIN}/workflows`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title: newWorkflow.title,
                agent_id: Number(empid),
                underwriter_id: Number(newWorkflow.underwriter_id),
                approver_id: Number(newWorkflow.approver_id),
                name: newWorkflow.name,
                carrier: newWorkflow.carrier,
                policy: newWorkflow.policy,
                liability: newWorkflow.liability,
                expiration_date: newWorkflow.expiration_date,
                rating: newWorkflow.rating,
            })
        });
        close();
        loadWorkflows();
    };

    const handleReview = async (status: string) => {
        if (!selectedWorkflow) return;
        await api(`${DOMAIN}/workflows/${selectedWorkflow.id}/review`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                underwriter_status: status,
                rating: reviewData.rating,
                coverage: reviewData.coverage,
                estimate: reviewData.estimate,
            })
        })
        closeReview();
        loadWorkflows();
    };

    const handleApprove = async (status: string) => {
        if (!selectedWorkflow) return;
        await api(`${DOMAIN}/workflows/${selectedWorkflow.id}/approve`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({approver_status: status}),
        });
        closeReview();
        loadWorkflows();
    };

    return (
        <>
            <Header/>
            <Stack p="md">
                <Group justify="space-betwen">
                    <Text fw={700} size="x1">Workflows</Text>
                    {persona === 'Agent' && (
                        <FilledButton leftSection="plus" onClick={openCreate}>Add Workflow</FilledButton>
                    )}
                </Group>
                {/* Workflow Table */}
                <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Title</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Agent</Table.Th>
                            <Table.Th>Underwriter</Table.Th>
                            <Table.Th>Approver</Table.Th>
                            <Table.Th>Actions Required:</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {workflows.map(w => (
                            <Table.Tr key={w.id}>
                                <Table.Td>{w.title}</Table.Td>
                                <Table.Td>
                                    <Badge color={
                                        w.status === 'approved' ? 'var(--color-yale-blue)' :
                                            w.status === 'denied' ? 'var(--color-yale-blue)' :
                                                w.status === 'pending_approval' ? 'yellow' : 'var(--color-yale-blue)'
                                    }>
                                        {w.status.replace('_', '').toUpperCase()}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>{w.agent?.username}</Table.Td>
                                <Table.Td>{w.underwriter?.username ?? '_'}</Table.Td>
                                <Table.Td>{w.approver?.username ?? '_'}</Table.Td>
                                <Table.Td>
                                    {(persona === 'Underwriter' && w.status === 'pending_review') && (
                                        <Button size="xs" onClick={() => {
                                            setSelectedWorkflow(w);
                                            openReview();
                                        }}>
                                            Review
                                        </Button>
                                    )}
                                    {(persona === 'Approver' && w.status === 'pending_approval') && (
                                        <Button size="xs" onClick={() => {
                                            setSelectedWorkflow(w);
                                            openReview();
                                        }}>
                                            Approve
                                        </Button>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>

                {/* Create Workflow Modal */}

                <Modal opened={isAvailable} onClose={closeCreate} title="New Workflow">
                    <Stack>
                        <TextInput
                            label="Title"
                            value={newWorkflow.title}
                            onChange={e => setNewWorkflow({...newWorkflow, title: e.target.value})}
                        />
                        <TextInput
                            label=" Policy Holder Name"
                            value={newWorkflow.name}
                            onChange={e => setNewWorkflow({...newWorkflow, name: e.target.value})}
                        />
                        <TextInput
                            label="Carrier"
                            value={newWorkflow.carrier}
                            onChange={e => setNewWorkflow({...newWorkflow, carrier: e.target.value})}
                        />
                        <TextInput
                            label="Policy Type"
                            value={newWorkflow.policy}
                            onChange={e => setNewWorkflow({...newWorkflow, policy: e.target.value})}
                        />
                        <TextInput
                            label="Limits of Liability"
                            value={newWorkflow.liability}
                            onChange={e => setNewWorkflow({...newWorkflow, liability: e.target.value})}
                        />
                        <TextInput
                            label="Rating"
                            value={newWorkflow.rating}
                            onChange={e => setNewWorkflow({...newWorkflow, rating: e.target.value})}
                        />
                        <TextInput
                            label="Expiration Date"
                            type="date"
                            value={newWorkflow.expiration_date}
                            onChange={e => setNewWorkflow({...newWorkflow, expiration_date: e.target.value})}
                        />
                        <Select
                            label="Underwriter"
                            value={newWorkflow.underwriter_id}
                            onChange={val => setNewWorkflow({...newWorkflow, underwriter_id: val ?? ''})}
                            data={employees
                                .filter(e => e.persona === 'Underwriter')
                                .map(e => ({value: String(e.empid), label: e.username}))
                            }
                        />
                        <Group justify="flex-end">
                            <Button
                                variant="outline"
                                color="var(--color-yale-blue)"
                                onClick={closeCreate}
                            >
                                Cancel
                            </Button>
                            <Button
                                style={{backgroundColor: 'var(--color-yale-blue) '}}
                                onClick={handleCreateWorkflow}
                            >
                                Submit
                            </Button>
                        </Group>
                    </Stack>
                </Modal>

                {/* Review/Approve moda*/}
                <Modal
                    opened={isReviewAvailable}
                    onClose={closeReview}
                    title={persona === 'Underwriter' ? 'Review Workflow' : 'Approve Workflow'}
                >
                    <Stack>
                        {/* Agent fields */}
                        <Text fw={700} size="sm">Agent Information</Text>
                        <TextInput label="Policy Holder Name" value={selectedWorkflow?.form?.name ?? ''} readOnly/>
                        <TextInput label="Carrier" value={selectedWorkflow?.form?.carrier ?? ''} readOnly/>
                        <TextInput label="Policy Type" value={selectedWorkflow?.form?.policy ?? ''} readOnly/>
                        <TextInput label="Limits of Liability" value={selectedWorkflow?.form?.liability ?? ''}
                                   readOnly/>
                        <TextInput label="Expiration Date" value={selectedWorkflow?.form?.expiration_date ?? ''}
                                   readOnly/>

                        {/* Underwriter fields */}
                        <>
                            <Text fw={700} size="sm"> Underwriter Edits </Text>
                            <Select
                                label="Risk Rating"
                                value={reviewData.rating}
                                onChange={val => setReviewData({...reviewData, rating: val ?? ''})}
                                data={['Low', 'Medium', 'High']}
                            />
                            <TextInput label="Recommended Coverage"
                                       value={reviewData.coverage}
                                       onChange={e => setReviewData({...reviewData, coverage: e.target.value})}
                            />
                            <TextInput label="Premium Estimate"
                                       value={reviewData.estimate}
                                       onChange={e => setReviewData({...reviewData, estimate: e.target.value})}
                            />
                        </>

                        {/* Approver read-onlys*/}
                        {persona === 'Approver' && (
                            <>
                                <Text fw={700} size="sm"> Approver Assessment </Text>
                                <TextInput label="Risk rating" value={selectedWorkflow?.form?.rating ?? ''} readOnly/>
                                <TextInput label="Recommended Coverage" value={selectedWorkflow?.form?.coverage ?? ''}
                                           readOnly/>
                                <TextInput label="Premium Estimate" value={selectedWorkflow?.form?.estimate ?? ''}
                                           readOnly/>
                            </>
                        )}
                        <Group>
                            <Button
                                color="green"
                                onClick={() => persona === 'Underwriter' ? handleReview('approved') : handleApprove('approved')}
                            >
                                Approve
                            </Button>
                            <Button
                                color="red"
                                onClick={() => persona === 'Underwriter' ? handleReview('rejected') : handleApprove('rejected')}
                            >
                                Rejected
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </>
    );
}



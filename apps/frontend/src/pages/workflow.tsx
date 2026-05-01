import {useEffect, useState} from "react";
import {Header} from "../components/Header.tsx";
import {
    Button,
    Modal,
    Card,
    Divider,
    TextInput,
    Select,
    Table,
    Badge,
    Group,
    Text,
    Stack,
    SegmentedControl
} from '@mantine/core'
import {useDisclosure} from "@mantine/hooks";
import {useApi} from "../components/api.ts";
import {DOMAIN} from '../const.ts'
import {useTranslation} from 'react-i18next'
import {FilledButton} from "../components/Buttons/FilledButton.tsx";

interface Workflow {
    id: number;
    title: string;
    status: string;
    is_locked: boolean;
    agent_id: number;
    underwriter_id: number | null;
    approver_id: number | null;
    agent_status: string | null;
    underwriter_status: string | null;
    approver_status: string | null;
    employee_workflow_agent_idToemployee: { username: string; persona: string };
    employee_workflow_underwriter_idToemployee: { username: string; persona: string } | null;
    approver: { username: string; persona: string } | null;
    workflow_form: WorkflowForm[] | null;
}

interface WorkflowForm {
    id: number;
    workflow_id: number;
    name: string | null,
    carrier: string | null,
    policy_type: string | null,
    limits_liability: string | null,
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
    const [workflowView, setWorkflowView] = useState<'card' | 'table'>('card')

    const [newWorkflow, setNewWorkflow] = useState({
        title: '',
        underwriter_id: '',
        approver_id: '',
        name: '',
        carrier: '',
        policy: '',
        liability: '',
        expiration_date: '',
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
        console.log('submitting workflow:', newWorkflow);
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
            })
        });
        closeCreate();
        loadWorkflows();
    };

    const handleReview = async (status: string) => {
        if (!selectedWorkflow) return;
        await api(`${DOMAIN}/workflows/${selectedWorkflow.id}/review`, {
            method: 'PATCH',
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
            method: 'PATCH',
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
                    <Group gap="xs">
                        <SegmentedControl
                            value={workflowView}
                            onChange={val => setWorkflowView(val as 'card' | 'table')}
                            data={[
                                {label: 'Card', value: 'card'},
                                {label: 'Table', value: 'table'},
                            ]}
                        />
                        {persona === 'Agent' && (
                            <FilledButton leftSection="plus" onClick={openCreate}>Add Workflow</FilledButton>
                        )}
                    </Group>
                </Group>

                {/* Workflow card */}
                {workflowView === 'table' ? (
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
                                            {w.status.replace(/_/g, '').toUpperCase()}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{w.employee_workflow_agent_idToemployee?.username}</Table.Td>
                                    <Table.Td>{w.employee_workflow_underwriter_idToemployee?.username ?? '_'}</Table.Td>
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
                ) : (
                    <Stack p="md">
                        {workflows.map(w => (
                            <Card key={w.id} shadow='sm' radius="md" withBorder padding="lg"
                                  style={{cursor: 'pointer', opacity: w.is_locked ? 0.8 : 1}}
                                  onClick={() => {
                                      setSelectedWorkflow(w);
                                      openReview();
                                  }}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Text fw={700} size="lg">{w.title}</Text>
                                    <Group gap="xs">
                                        {w.is_locked && <Badge color="gray">FORM IS LOCKED</Badge>}
                                        <Badge color={
                                            w.status === 'approved' ? 'var(--color-yale-blue)' :
                                                w.status === 'rejected' ? 'var(--color-yale-blue)' :
                                                    w.status === 'pending_approval' ? 'yellow' : 'var(--color-yale-blue)'}>
                                            {w.status.replace(/_/g, '').toUpperCase()}
                                        </Badge>
                                    </Group>
                                </Group>
                                <Group gap="xl">
                                    <Text size="sm" c="dimmed"> Agent: <strong> {w.employee_workflow_agent_idToemployee?.username}</strong></Text>
                                    <Text size="sm"
                                          c="dimmed"> Underwriter: <strong> {w.employee_workflow_underwriter_idToemployee?.username}</strong></Text>
                                    <Text size="sm"
                                          c="dimmed"> Approver: <strong> {w.approver?.username}</strong></Text>
                                </Group>
                            </Card>
                        ))}
                        {workflows.length === 0 && (
                            <Text c="dimmed" ta="center"> No Workflows Found</Text>
                        )}
                    </Stack>
                )
                }

                {/* Create Workflow Modal */
                }

                <Modal opened={isAvailable} onClose={closeCreate} title="New Workflow">
                    <Stack>
                        <TextInput
                            label="Title"
                            value={newWorkflow.title}
                            onChange={e => setNewWorkflow({...newWorkflow, title: e.target.value})}
                        />
                        <Divider label="Policy Information" labelPosition="center"/>
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
                            label="Expiration Date"
                            type="date"
                            value={newWorkflow.expiration_date}
                            onChange={e => setNewWorkflow({...newWorkflow, expiration_date: e.target.value})}
                        />
                        <Divider label=" Send Request To:" labelPosition="center"/>
                        <Select
                            label="Request Underwriter:"
                            value={newWorkflow.underwriter_id}
                            onChange={val => setNewWorkflow({...newWorkflow, underwriter_id: val ?? ''})}
                            data={employees
                                .filter(e => e.persona === 'Underwriter')
                                .map(e => ({value: String(e.empid), label: e.username}))
                            }
                        />
                        <Select
                            label="Request Approver:" value={newWorkflow.approver_id}
                            onChange={val => setNewWorkflow({...newWorkflow, approver_id: val ?? ''})}
                            data={employees.filter(e => e.persona === 'Approver')
                                .map(e => ({value: String(e.empid), label: e.username}))}
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

                {/* Review/Approve modals*/
                }
                <Modal
                    opened={isReviewAvailable}
                    onClose={closeReview}
                    title={persona === 'Underwriter' ? 'Review Workflow' : 'Approve Workflow'}
                >
                    <Stack>
                        {/* Agent fields */}
                        <Divider label="Agent Information" labelPosition="center"/>
                        <TextInput label="Policy Holder Name" value={selectedWorkflow?.workflow_form?.[0]?.name ?? ''} readOnly/>
                        <TextInput label="Carrier" value={selectedWorkflow?.workflow_form?.[0]?.carrier ?? ''} readOnly/>
                        <TextInput label="Policy Type" value={selectedWorkflow?.workflow_form?.[0]?.policy_type ?? ''} readOnly/>
                        <TextInput label="Limits of Liability" value={String(selectedWorkflow?.workflow_form?.[0]?.limits_liability ?? '')}
                                   readOnly/>
                        <TextInput label="Expiration Date" value={selectedWorkflow?.workflow_form?.[0]?.expiration_date ?? ''}
                                   readOnly/>

                        <Divider label="Underwriter Assessment" labelPosition="center"/>
                        {persona === 'Underwriter' && !selectedWorkflow?.is_locked ? (
                            <>
                                <Select label="Risk Rating" value={reviewData.rating}
                                        onChange={val => setReviewData({...reviewData, rating: val ?? ''})}
                                        data={['Low', 'Medium', 'High']}
                                />
                                <TextInput label="Recommended Coverage" value={reviewData.coverage}
                                           onChange={e => setReviewData({...reviewData, coverage: e.target.value})}
                                />
                                <TextInput label="Premium Estimate" value={reviewData.estimate}
                                           onChange={e => setReviewData({...reviewData, estimate: e.target.value})}
                                />
                            </>
                        ) : (
                            <>
                                <TextInput label="Risk Rating" value={selectedWorkflow?.workflow_form?.[0]?.rating ?? '-'} readOnly
                                />
                                <TextInput label="Recommended Coverage" value={selectedWorkflow?.workflow_form?.[0]?.coverage ?? '-'}
                                           readOnly
                                />
                                <TextInput label="Premium Estimate" value={selectedWorkflow?.workflow_form?.[0]?.estimate ?? '-'}
                                           readOnly
                                />
                            </>
                        )}
                        {/* Approvers portion*/}

                        {!selectedWorkflow?.is_locked && (
                            <Group justify="space-between">
                                {persona === 'Underwriter' && selectedWorkflow?.status === 'pending_review' && (
                                    <>
                                        <Button color="var(--color-yale-blue)"
                                                onClick={() => handleReview('rejected')}>Reject</Button>
                                        <Button color="var(--color-yale-blue)"
                                                onClick={() => handleReview('approved')}>Approve</Button>
                                    </>
                                )}
                                {persona === 'Approver' && selectedWorkflow?.status === 'pending_approval' && (
                                    <>
                                        <Button color="var(--color-yale-blue)"
                                                onClick={() => handleApprove('rejected')}>Reject</Button>
                                        <Button color="var(--color-yale-blue)"
                                                onClick={() => handleApprove('approved')}>Approve</Button>
                                    </>
                                )}
                            </Group>
                        )}
                        {selectedWorkflow?.is_locked && (
                            <Text ta="center" c="dimmed" size="sm"> This workflow is locked and can no longer be
                                edited. </Text>
                        )}

                    </Stack>
                </Modal>
            </Stack>
        </>
    )
        ;
}



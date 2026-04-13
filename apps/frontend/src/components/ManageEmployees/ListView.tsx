import '@mantine/core/styles.css';
import { useEffect, useState } from "react";
import {
    TextInput, PasswordInput, FileInput, Select, Button, Modal,
    Group, Text, Badge, Stack, Box
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconPlus, IconUser } from '@tabler/icons-react';
import { DOMAIN } from '../../const';

type Employee = {
    empid: number;
    first_name: string;
    last_name: string;
    username: string;
    persona: string;
    password: string;
    created_at: string;
    pfp_URL?: string | null;
}

const personas = ["Admin", "Underwriter", "Business Analyst"];

const personaColors: Record<string, string> = {
    "Admin": "var(--color-yale-blue)",
    "Underwriter": "var(--color-sapphire)",
    "Business Analyst": "var(--color-fresh-sky)",
};

export function EmployeeListView() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');

    // Add modal
    const [addOpen, setAddOpen] = useState(false);
    const [addPersona, setAddPersona] = useState('');
    const [addData, setAddData] = useState({ username: '', password: '', first_name: '', last_name: '', pfp_URL: null as File | null });


    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [editData, setEditData] = useState({ newUsername: '', password: '', persona: '', pfp_URL: null as File | null });

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

    const authorUsername = localStorage.getItem('username') ?? '';
    const today = new Date().toISOString().split('T')[0];

    function loadEmployees() {
        fetch(`${DOMAIN}/employees`)
            .then(res => res.json())
            .then(data => setEmployees(data));
    }

    useEffect(() => {
        loadEmployees();
    }, []);

    function openAdd(persona: string) {
        setAddPersona(persona);
        setAddData({ username: '', password: '', first_name: '', last_name: '', pfp_URL: null });
        setAddOpen(true);
    }

    async function handleAdd() {
        const addResponse = await fetch(`${DOMAIN}/addEmployee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: addData.username,
                password: addData.password,
                persona: addPersona,
                first_name: addData.first_name,
                last_name: addData.last_name,
            })
        });

        if (!addResponse.ok) {
            return;
        }

        const createdEmployee = await addResponse.json() as { data?: { empid?: number } };
        const createdEmpId = createdEmployee.data?.empid;

        if (addData.pfp_URL && createdEmpId) {
            const formData = new FormData();
            formData.append('file', addData.pfp_URL);

            const uploadResponse = await fetch(`${DOMAIN}/employees/${createdEmpId}/profile-picture`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                return;
            }
        }

        setAddOpen(false);
        loadEmployees();
    }

    function openEdit(emp: Employee) {
        setEditTarget(emp);
        setEditData({ newUsername: emp.username, password: '', persona: emp.persona, pfp_URL: null });
        setEditOpen(true);
    }

    async function handleEdit() {
        if (!editTarget) return;
        const updateResponse = await fetch(`${DOMAIN}/updateEmployee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: editTarget.username,
                newUsername: editData.newUsername !== editTarget.username ? editData.newUsername : undefined,
                password: editData.password || undefined,
                persona: editData.persona !== editTarget.persona ? editData.persona : undefined
            })
        });

        if (!updateResponse.ok) {
            return;
        }

        if (editData.pfp_URL) {
            const formData = new FormData();
            formData.append('file', editData.pfp_URL);

            const uploadResponse = await fetch(`${DOMAIN}/employees/${editTarget.empid}/profile-picture`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                return;
            }
        }

        setEditOpen(false);
        loadEmployees();
    }

    function openDelete(emp: Employee) {
        setDeleteTarget(emp);
        setDeleteOpen(true);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await fetch(`${DOMAIN}/deleteEmployee/${deleteTarget.username}`, {
            method: 'DELETE'
        });
        setDeleteOpen(false);
        loadEmployees();
    }

    const filtered = employees.filter(e =>
        e.username?.toLowerCase().includes(search.toLowerCase()) ||
        e.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.last_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box p="md">
            {/* Search bar */}
            <TextInput
                placeholder="Search for an employee..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                mb="lg"
            />

            {/* Grouped sections */}
            {personas.map(persona => {
                const group = filtered.filter(e => e.persona===persona).sort((a,b)=>a.last_name.localeCompare(b.last_name));
                return (
                    <Box
                        key={persona}
                        mb="lg"
                        style={{
                            border: '1px solid #dee2e6',
                            borderRadius: 8,
                            padding: 16,
                            background: 'white'
                        }}
                    >
                        <Group mb="sm">
                            <Text fw={700} size="xl" c="var(--color-yale-blue)">{persona}s</Text>
                            <Button
                                size="sm"
                                leftSection={<IconPlus size={14} />}
                                onClick={() => openAdd(persona)}
                                className="invert-hover"
                            >
                                Add Employee
                            </Button>
                        </Group>

                        <Stack gap="xs">
                            {group.length === 0 && (
                                <Text c="dimmed" size="sm">No employees found.</Text>
                            )}
                            {group.map(emp => (
                                <Group key={emp.empid} justify="space-between"
                                       style={{
                                           background: '#f8f9fa',
                                           borderRadius: 6,
                                           padding: '8px 12px'
                                       }}
                                >
                                    <Group>
                                        <Badge
                                            color={personaColors[emp.persona] ?? 'gray'}
                                            variant="light"
                                            size="lg"
                                        >
                                            {emp.first_name?.[0] ?? ''}{emp.last_name?.[0] ?? ''}
                                        </Badge>
                                        <Text>{emp.last_name}, {emp.first_name} ({emp.username})</Text>
                                        {emp.username === authorUsername && (
                                            <Badge color="var(--color-yale-blue)" variant="light" size="sm">You</Badge>
                                        )}
                                    </Group>
                                    <Group gap="xs">
                                        <Button
                                            size="xs"
                                            leftSection={<IconEdit size={14} />}
                                            onClick={() => openEdit(emp)}
                                            className="invert-hover"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="xs"
                                            className="invert-hover-red"
                                            leftSection={<IconTrash size={14} />}
                                            onClick={() => openDelete(emp)}
                                        >
                                            Delete
                                        </Button>
                                    </Group>
                                </Group>
                            ))}
                        </Stack>
                    </Box>
                );
            })}

            {/* Add */}
            <Modal
                opened={addOpen}
                onClose={() => setAddOpen(false)}
                title={
                    <Group>
                        <IconUser size={20} />
                        <Text fw={600}>Create {addPersona} Account</Text>
                    </Group>
                }
            >
                <Stack>
                    <TextInput
                        label = "First Name"
                        placeholder="e.g., John"
                        value={addData.first_name}
                        onChange={e => setAddData({...addData, first_name: e.target.value})}
                        />
                    <TextInput
                        label = "Last Name"
                        placeholder="e.g., Doe"
                        value={addData.last_name}
                        onChange={e => setAddData({...addData, last_name: e.target.value})}
                    />
                    <TextInput
                        label="Username"
                        placeholder={`e.g., ${addPersona.toLowerCase().replace(' ', '_')}_jdoe`}
                        value={addData.username}
                        onChange={e => setAddData({...addData, username: e.target.value})}
                    />
                    
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Profile Picture (Optional)</Text>
                        <FileInput
                            placeholder="Upload a profile picture"
                            accept="image/*"
                            value={addData.pfp_URL}
                            onChange={file => setAddData({...addData, pfp_URL: file})}
                        />
                    </Box>

                    <PasswordInput
                        label="Password"
                        value={addData.password}
                        onChange={e => setAddData({...addData, password: e.target.value})}
                    />
                    <TextInput
                        label="Employee Author"
                        value={authorUsername}
                        readOnly
                    />
                    <TextInput
                        label="Creation Date"
                        value={today}
                        readOnly
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setAddOpen(false)} className="invert-hover-outline">Cancel</Button>
                        <Button
                            onClick={handleAdd}
                            className="invert-hover"
                        >
                            + Save Account
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Edit */}
            <Modal
                opened={editOpen}
                onClose={() => setEditOpen(false)}
                title={
                    <Group>
                        <IconUser size={20} />
                        <Text fw={600}>Edit Employee Account</Text>
                    </Group>
                }
            >
                {editTarget && (
                    <Stack>
                        <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                            <Text fw={600} mb={4}>Current Details</Text>
                            <Text size="sm">Current Username: {editTarget.username}</Text>
                            <Text size="sm">Current Persona: {editTarget.persona}</Text>
                        </Box>
                        <Text fw={600}>New Details</Text>
                        <TextInput
                            label="New Username (Optional)"
                            value={editData.newUsername}
                            onChange={e => setEditData({...editData, newUsername: e.target.value})}
                        />
                        <Box>
                            <Text size="sm" fw={500} mb={4}>New Profile Picture (Optional)</Text>
                            <FileInput
                                placeholder="Upload a new profile picture"
                                accept="image/*"
                                onChange={file => setEditData({...editData, pfp_URL: file})}
                            />

                        </Box>
                        <PasswordInput
                            label="New Password (Optional)"
                            value={editData.password}
                            onChange={e => setEditData({...editData, password: e.target.value})}
                        />
                        <Select
                            label="New Persona (Optional)"
                            value={editData.persona}
                            onChange={val => setEditData({...editData, persona: val ?? ''})}
                            data={['Underwriter', 'Business Analyst', 'Admin']}
                        />
                        <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                            <Text fw={600} mb={4}>Account History</Text>
                            <Group>
                                <Text size="sm">{editTarget.first_name} {editTarget.last_name}</Text>
                                <Text size="sm" c="dimmed">Creation Date: {new Date(editTarget.created_at).toISOString().split('T')[0]}</Text>
                            </Group>
                        </Box>
                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={() => setEditOpen(false)} className="invert-hover-outline">Cancel</Button>
                            <Button
                                onClick={handleEdit}
                                className="invert-hover"
                            >
                                + Save Account
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Delete */}
            <Modal
                opened={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete Employee?"
                centered
            >
                <Text size="sm" mb="md">
                    Changes you made <strong>cannot be undone.</strong>
                </Text>
                <Group justify="flex-end">
                    <Button variant="outline" onClick={() => setDeleteOpen(false)} className="invert-hover-outline">Cancel</Button>
                    <Button className="invert-hover" onClick={handleDelete}>Confirm</Button>
                </Group>
            </Modal>
        </Box>
    );
}




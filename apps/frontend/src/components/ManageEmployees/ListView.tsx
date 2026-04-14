import '@mantine/core/styles.css';
import { useEffect, useState } from "react";
import {
    TextInput, PasswordInput, Select, Button, Modal,
    Group, Text, Badge, Stack, Box
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconPlus, IconUser } from '@tabler/icons-react';
//import {useAuth0} from "@auth0/auth0-react";
import { useApi } from "../api.ts";

type Employee = {
    empid: number;
    first_name: string;
    last_name: string;
    username: string;
    persona: string;
    password: string;
    created_at: string;
}

const personas = ["Admin", "Underwriter", "Business Analyst"];

const personaColors: Record<string, string> = {
    "Admin": "blue",
    "Underwriter": "teal",
    "Business Analyst": "cyan",
};

export function EmployeeListView() {
    const api = useApi();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');

    // Add modal
    const [addOpen, setAddOpen] = useState(false);
    const [addPersona, setAddPersona] = useState('');
    const [addData, setAddData] = useState({ username: '', password: '', first_name: '', last_name: ''});

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [editData, setEditData] = useState({ newUsername: '', password: '', persona: '' });

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

    const authorUsername = localStorage.getItem('username') ?? '';
    const today = new Date().toISOString().split('T')[0];

    function loadEmployees() {
        api("http://localhost:3000/employees")
            .then(res => res.json())
            .then(data => setEmployees(data));
    }

    useEffect(() => {
        loadEmployees();
    }, []);

    function openAdd(persona: string) {
        setAddPersona(persona);
        setAddData({ username: '', password: '', first_name: '', last_name: '' });
        setAddOpen(true);
    }

    async function handleAdd() {
        await api('http://localhost:3000/addEmployee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: addData.username,
                password: addData.password,
                persona: addPersona,
                first_name: addData.first_name,
                last_name: addData.last_name,
            },)
        });
        setAddOpen(false);
        loadEmployees();
    }

    function openEdit(emp: Employee) {
        setEditTarget(emp);
        setEditData({ newUsername: emp.username, password: '', persona: emp.persona });
        setEditOpen(true);
    }

    async function handleEdit() {
        if (!editTarget) return;
        await api('http://localhost:3000/updateEmployee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: editTarget.username,
                newUsername: editData.newUsername !== editTarget.username ? editData.newUsername : undefined,
                password: editData.password || undefined,
                persona: editData.persona !== editTarget.persona ? editData.persona : undefined,
            })
        });
        setEditOpen(false);
        loadEmployees();
    }

    function openDelete(emp: Employee) {
        setDeleteTarget(emp);
        setDeleteOpen(true);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await api(`http://localhost:3000/deleteEmployee/${deleteTarget.username}`, {
            method: 'DELETE',
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
                                style={{ background: 'var(--color-fresh-sky)' }}
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
                                            <Badge color="green" variant="light" size="sm">You</Badge>
                                        )}
                                    </Group>
                                    <Group gap="xs">
                                        <Button
                                            size="xs"
                                            leftSection={<IconEdit size={14} />}
                                            onClick={() => openEdit(emp)}
                                            style={{ background: 'var(--color-fresh-sky)' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="xs"
                                            color="red"
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
                        <Button variant="default" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleAdd}
                            style={{ background: 'var(--color-fresh-sky)' }}
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
                                <Badge color="teal" variant="light" size="lg">
                                    {editTarget.first_name?.[0] ?? ''}{editTarget.last_name?.[0] ?? ''}
                                </Badge>
                                <Text size="sm">{editTarget.first_name} {editTarget.last_name}</Text>
                                <Text size="sm" c="dimmed">Creation Date: {new Date(editTarget.created_at).toISOString().split('T')[0]}</Text>
                            </Group>
                        </Box>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleEdit}
                                style={{ background: 'var(--color-fresh-sky)' }}
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
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button color="blue" onClick={handleDelete}>Confirm</Button>
                </Group>
            </Modal>
        </Box>
    );
}
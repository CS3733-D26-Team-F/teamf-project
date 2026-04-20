import '@mantine/core/styles.css';
import { useEffect, useState } from "react";
import {
    TextInput, PasswordInput, Image, Center, FileInput, Select, Button, Modal,
    Group, Text, Badge, Stack, Box
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconPlus, IconUser } from '@tabler/icons-react';
import { DOMAIN } from '../../const';
//import {useAuth0} from "@auth0/auth0-react";
import { useApi } from "../api.ts";
import { FilledButton } from '../Buttons/FilledButton.tsx';
import {allPersonas} from "./personas.tsx";

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

const personas = allPersonas;
const MAX_PROFILE_PICTURE_SIZE = 80 * 1024;

const personaColors: Record<string, string> = {
    "Admin": "var(--color-admin)",
    "Underwriter": "var(--color-underwriter)",
    "Business Analyst": "var(--color-businessAnalyst)",
    "Actuarial Analyst": "var(--color-actuarialAnalyst)",
    "EXL Operations": "var(--color-exlOperations)",
};

function validateProfilePicture(file: File | null): File | null {
    if (file && file.size > MAX_PROFILE_PICTURE_SIZE) {
        window.alert('Profile picture must be 80 KB or smaller.');
        return null;
    }

    return file;
}

export function EmployeeListView() {
    const api = useApi();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');

    // Add modal
    const [addOpen, setAddOpen] = useState(false);
    const [addPersona, setAddPersona] = useState('');
    const [addData, setAddData] = useState({ username: '', password: '', first_name: '', last_name: '', pfp_URL: null as File | null });
    const [addSaving, setAddSaving] = useState(false);
    const [addError, setAddError] = useState('');


    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [editData, setEditData] = useState({ newUsername: '', password: '', persona: '', newPfp_URL: null as File | null });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

    // Employee Details modal
    const [employeeOpen, setEmployeeOpen] = useState(false);
    const [employeeTarget, setEmployeeTarget] = useState<Employee | null>(null);
    const [imageLoadError, setImageLoadError] = useState(false);

    const authorUsername = localStorage.getItem('username') ?? '';
    const today = new Date().toISOString().split('T')[0];

    function loadEmployees() {
        api(`${DOMAIN}/employees`)
            .then(res => res.json())
            .then(data => setEmployees(data));
    }

    useEffect(() => {
        loadEmployees();
    }, []);

    function openAdd(persona: string) {
        setAddPersona(persona);
        setAddData({ username: '', password: '', first_name: '', last_name: '', pfp_URL: null });
        setAddError('');
        setAddOpen(true);
    }

    async function handleAdd() {
        setAddSaving(true);
        setAddError('');

        try {
            const addResponse = await api(`${DOMAIN}/addEmployee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: addData.username.trim(),
                    password: addData.password,
                    persona: addPersona,
                    first_name: addData.first_name.trim(),
                    last_name: addData.last_name.trim(),
                    pfp_URL: addData.pfp_URL ? 'placeholder' : undefined
                })
            });

            const createdEmployee = await addResponse.json() as { data?: { empid?: number } };
            const createdEmpId = createdEmployee.data?.empid;

            if (addData.pfp_URL && createdEmpId) {
                const formData = new FormData();
                formData.append('file', addData.pfp_URL);

                const uploadResponse = await api(`${DOMAIN}/employees/${createdEmpId}/profile-picture`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    setAddError('Account was created, but the profile picture upload failed.');
                    return;
                }
            }

            setAddOpen(false);
            loadEmployees();
        } catch {
            setAddError('Could not save account. Please check the fields and try again.');
        } finally {
            setAddSaving(false);
        }
    }

    function openEdit(emp: Employee) {
        setEditTarget(emp);
        setEditData({ newUsername: emp.username, password: '', persona: emp.persona, newPfp_URL: null });
        setEditError('');
        setEditOpen(true);
    }

    async function handleEdit() {
        if (!editTarget) return;
        setEditSaving(true);
        setEditError('');

        try {
            const newUsername = editData.newUsername !== editTarget.username ? editData.newUsername : undefined;
            const newPassword = editData.password || undefined;
            const newPersona = editData.persona !== editTarget.persona ? editData.persona : undefined;
            const hasAccountChanges = Boolean(newUsername || newPassword || newPersona);
            const hasPictureChange = Boolean(editData.newPfp_URL);

            if (!hasAccountChanges && !hasPictureChange) {
                setEditError('No changes to save.');
                return;
            }

            if (hasAccountChanges) {
                const updateResponse = await api(`${DOMAIN}/updateEmployee`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: editTarget.username,
                        newUsername,
                        password: newPassword,
                        persona: newPersona,
                    })
                });

                if (!updateResponse.ok) {
                    setEditError('Could not save account changes. Please try again.');
                    return;
                }
            }

            if (hasPictureChange && editData.newPfp_URL) {
                const formData = new FormData();
                formData.append('file', editData.newPfp_URL);

                const uploadResponse = await fetch(`${DOMAIN}/employees/${editTarget.empid}/profile-picture`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    setEditError('Profile picture upload failed.');
                    return;
                }
            }

            setEditOpen(false);
            loadEmployees();
        } catch {
            setEditError('Could not save changes. Please try again.');
        } finally {
            setEditSaving(false);
        }
    }

    function openDelete(emp: Employee) {
        setDeleteTarget(emp);
        setDeleteOpen(true);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await api(`${DOMAIN}/deleteEmployee/${deleteTarget.username}`, {
            method: 'DELETE'
        });
        setDeleteOpen(false);
        loadEmployees();
    }

    function openEmployee(emp: Employee) {
        setEmployeeTarget(emp);
        setImageLoadError(false);
        setEmployeeOpen(true);
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
                            <FilledButton
                                size="sm"
                                leftSection="plus"
                                onClick={() => openAdd(persona)}
                            >
                                Add Employee
                            </FilledButton>
                        </Group>

                        <Stack gap="xs">
                            {group.length === 0 && (
                                <Text c="dimmed" size="sm">No employees found.</Text>
                            )}
                            {group.map(emp => (
                                <Group 
                                    key={emp.empid} justify="space-between"
                                    style={{
                                        background: '#f8f9fa',
                                        borderRadius: 6,
                                        padding: '8px 12px'
                                    }}
                                >
                                    <Group>
                                        <Badge
                                            component="button"
                                            onClick={() => openEmployee(emp)}
                                            className="invert-hover"
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
                                        <FilledButton
                                            size="xs"
                                            leftSection={<IconEdit size={14} />}
                                            onClick={() => openEdit(emp)}
                                        >
                                            Edit
                                        </FilledButton>
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
                            onChange={file => setAddData({...addData, pfp_URL: validateProfilePicture(file)})}
                        />
                    </Box>

                    <PasswordInput
                        label="Password"
                        autoComplete="new-password"
                        value={addData.password}
                        onChange={e => setAddData({...addData, password: e.target.value})}
                    />
                    {addError && (
                        <Text c="red" size="sm">{addError}</Text>
                    )}
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
                        <FilledButton
                            onClick={handleAdd}
                            leftSection="plus"
                            loading={addSaving}
                            disabled={addSaving}
                        >
                            Save Account
                        </FilledButton>
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
                                value={editData.newPfp_URL}
                                onChange={file => setEditData({...editData, newPfp_URL: validateProfilePicture(file)})}
                            />

                        </Box>
                        <PasswordInput
                            label="New Password (Optional)"
                            autoComplete="new-password"
                            value={editData.password}
                            onChange={e => setEditData({...editData, password: e.target.value})}
                        />
                        <Select
                            label="New Persona (Optional)"
                            value={editData.persona}
                            onChange={val => setEditData({...editData, persona: val ?? ''})}
                            data={['Underwriter', 'Business Analyst', 'Admin']}
                        />
                        {editError && (
                            <Text c="red" size="sm">{editError}</Text>
                        )}
                        <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                            <Text fw={600} mb={4}>Account History</Text>
                            <Group>
                                <Text size="sm">{editTarget.first_name} {editTarget.last_name}</Text>
                                <Text size="sm" c="dimmed">Creation Date: {new Date(editTarget.created_at).toISOString().split('T')[0]}</Text>
                            </Group>
                        </Box>
                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={() => setEditOpen(false)} className="invert-hover-outline" disabled={editSaving}>Cancel</Button>
                            <FilledButton
                                onClick={handleEdit}
                                leftSection="plus"
                                loading={editSaving}
                                disabled={editSaving}
                            >
                                Save Account
                            </FilledButton>
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

            {/* Employee Details */}
            <Modal
                opened={employeeOpen}
                onClose={() => setEmployeeOpen(false)}
                title={
                    <Group>
                        <IconUser size={20} />
                        <Text fw={600}>Employee Account Details</Text>
                    </Group>
                }
            >
                {employeeTarget && (
                    <>
                        <Center>
                            {imageLoadError ? (
                                <Badge
                                    color={personaColors[employeeTarget.persona] ?? 'gray'}
                                    variant="light"
                                    w="200px"
                                    h="200px"
                                    size="50px"
                                >
                                    {employeeTarget.first_name?.[0] ?? ''}{employeeTarget.last_name?.[0] ?? ''}
                                </Badge>
                                ):(
                                <Image
                                    ta="center"
                                    w="200px"
                                    h="200px"
                                    src={employeeTarget.pfp_URL}
                                    fallbackSrc = "invalid"
                                    radius="50%"
                                    style={{
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        backgroundColor: 'white',
                                        border: '1px solid #dee2e6',
                                    }}
                                    onError={() => setImageLoadError(true)}
                                />
                            )}
                        </Center>
                        <Stack>
                            <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                                <Text fw={600} mb={4}>{employeeTarget.first_name} {employeeTarget.last_name}</Text>
                                <Text>Username: {employeeTarget.username}</Text>
                                <Text>Role: {employeeTarget.persona}</Text>
                                <Text>Year Joined: {new Date(employeeTarget.created_at).getFullYear()}</Text>
                            </Box>
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={() => setEmployeeOpen(false)} className="invert-hover-outline">Close</Button>
                            </Group>
                        </Stack>
                    </>
                )}
            </Modal>
        </Box>
    );
}




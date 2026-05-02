import '@mantine/core/styles.css';
import { useEffect, useState } from "react";
import {
    TextInput, PasswordInput, Image, Center, FileInput, Select, Button, Modal,
    Group, Text, Badge, Stack, Box
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconUser } from '@tabler/icons-react';
import { DOMAIN } from '../../const';
//import {useAuth0} from "@auth0/auth0-react";
import { useApi } from "../api.ts";
import { FilledButton } from '../Buttons/FilledButton.tsx';
import {allPersonas} from "./personas.tsx";
import {useTranslation} from "react-i18next";

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

// Persona-specific badge colors keep the list easy to scan at a glance.
const personaColors: Record<string, string> = {
    "Admin": "var(--color-admin)",
    "Underwriter": "var(--color-underwriter)",
    "Business Analyst": "var(--color-businessAnalyst)",
    "Actuarial Analyst": "var(--color-actuarialAnalyst)",
    "EXL Operations": "var(--color-exlOperations)",
};

// Prevent oversized image uploads before they reach the backend.
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
    const {t} = useTranslation();

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

    // Used to highlight the current user's own row with a "You" badge.
    const authorUsername = localStorage.getItem('username') ?? '';
    const today = new Date().toISOString().split('T')[0];

    // Fetch the full employee directory from the backend.
    function loadEmployees() {
        api(`${DOMAIN}/employees`)
            .then(res => res.json())
            .then(data => setEmployees(data));
    }

    useEffect(() => {
        loadEmployees();
    }, []);

    // Prepare a clean form state whenever the Add Employee modal opens.
    function openAdd(persona: string) {
        setAddPersona(persona);
        setAddData({ username: '', password: '', first_name: '', last_name: '', pfp_URL: null });
        setAddError('');
        setAddOpen(true);
    }

    // Create the account first, then upload the optional profile image if needed.
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
                    setAddError(t('admin_cant_create'));
                    return;
                }
            }

            setAddOpen(false);
            loadEmployees();
        } catch {
            setAddError(t('admin_couldnt_save'));
        } finally {
            setAddSaving(false);
        }
    }

    // Copy the selected employee into the edit form so only changed fields are saved.
    function openEdit(emp: Employee) {
        setEditTarget(emp);
        setEditData({ newUsername: emp.username, password: '', persona: emp.persona, newPfp_URL: null });
        setEditError('');
        setEditOpen(true);
    }

    // Save account changes and optional photo upload in separate steps.
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

            // Avoid sending an update when the user hasn't changed anything.
            if (!hasAccountChanges && !hasPictureChange) {
                setEditError(t('admin_no_changes'));
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
                    setEditError(t('admin_cant_save'));
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
                    setEditError(t('admin_pfp_fail'));
                    return;
                }
            }

            setEditOpen(false);
            loadEmployees();
        } catch {
            setEditError(t('admin_pfp_fail_two'));
        } finally {
            setEditSaving(false);
        }
    }

    // Open a delete confirmation modal before permanently removing the employee.
    function openDelete(emp: Employee) {
        setDeleteTarget(emp);
        setDeleteOpen(true);
    }

    // Delete the selected employee and refresh the list afterwards.
    async function handleDelete() {
        if (!deleteTarget) return;
        await api(`${DOMAIN}/deleteEmployee/${deleteTarget.username}`, {
            method: 'DELETE'
        });
        setDeleteOpen(false);
        loadEmployees();
    }

    // Open the detail modal and reset any previous broken-image state.
    function openEmployee(emp: Employee) {
        setEmployeeTarget(emp);
        setImageLoadError(false);
        setEmployeeOpen(true);
    }

    // Filter the employee list by username or name as the user types.
    const filtered = employees.filter(e =>
        e.username?.toLowerCase().includes(search.toLowerCase()) ||
        e.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.last_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box p="md">
            {/* Search bar */}
            <TextInput
                placeholder={t('admin_search')}
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                mb="lg"
            />

            {/* Grouped sections */}
            {personas.map(persona => {
                // Split employees by persona and sort each group alphabetically by last name.
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
                            <Text fw={700} size="xl" c="var(--color-yale-blue)">{persona}</Text>
                            <FilledButton
                                size="sm"
                                leftSection="plus"
                                onClick={() => openAdd(persona)}
                            >
                                {t('admin_add_emp')}
                            </FilledButton>
                        </Group>

                        <Stack gap="xs">
                            {group.length === 0 && (
                                <Text c="dimmed" size="sm">{t('admin_no_emp')}</Text>
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
                                        {/* Clickable initials badge opens the employee detail modal. */}
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
                                            <Badge color="var(--color-yale-blue)" variant="light" size="sm">{t('you')}</Badge>
                                        )}
                                    </Group>
                                    <Group gap="xs">
                                        {/* Edit and delete actions are grouped together for quick admin workflows. */}
                                        <FilledButton
                                            size="xs"
                                            leftSection={<IconEdit size={14} />}
                                            onClick={() => openEdit(emp)}
                                        >
                                            {t('edit')}
                                        </FilledButton>
                                        <Button
                                            size="xs"
                                            className="invert-hover-red"
                                            leftSection={<IconTrash size={14} />}
                                            onClick={() => openDelete(emp)}
                                        >
                                            {t('delete')}
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
                        <Text fw={600}>{t('create')} {addPersona} {t('account')}</Text>
                    </Group>
                }
            >
                <Stack>
                    <TextInput
                        label = {t('admin_firstname')}
                        placeholder="e.g., John"
                        value={addData.first_name}
                        onChange={e => setAddData({...addData, first_name: e.target.value})}
                        />
                    <TextInput
                        label = {t('admin_lastname')}
                        placeholder="e.g., Doe"
                        value={addData.last_name}
                        onChange={e => setAddData({...addData, last_name: e.target.value})}
                    />
                    <TextInput
                        label= {t('username')}
                        placeholder={`e.g., ${addPersona.toLowerCase().replace(' ', '_')}_jdoe`}
                        value={addData.username}
                        onChange={e => setAddData({...addData, username: e.target.value})}
                    />
                    
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Profile Picture (Optional)</Text>
                        <FileInput
                            placeholder={t('admin_add_pfp')}
                            accept="image/*"
                            value={addData.pfp_URL}
                            onChange={file => setAddData({...addData, pfp_URL: validateProfilePicture(file)})}
                        />
                    </Box>

                    <PasswordInput
                        label= {t('password')}
                        autoComplete="new-password"
                        value={addData.password}
                        onChange={e => setAddData({...addData, password: e.target.value})}
                    />
                    {addError && (
                        <Text c="red" size="sm">{addError}</Text>
                    )}
                    <TextInput
                        label={t('emp_author')}
                        value={authorUsername}
                        readOnly
                    />
                    <TextInput
                        label={t('create_date')}
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
                            {t('save_account')}
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
                        <Text fw={600}>Edit {t('employee_acount')}</Text>
                    </Group>
                }
            >
                {editTarget && (
                    <Stack>
                        {/* Show current values so admins can compare before saving changes. */}
                        <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                            <Text fw={600} mb={4}>{t('employee_details')}</Text>
                            <Text size="sm">{t('current_username')} {editTarget.username}</Text>
                            <Text size="sm">{t('current_persona')} {editTarget.persona}</Text>
                        </Box>
                        <Text fw={600}>{t('new_details')}</Text>
                        <TextInput
                            label={t('new_username_optional')}
                            value={editData.newUsername}
                            onChange={e => setEditData({...editData, newUsername: e.target.value})}
                        />
                        <Box>
                            <Text size="sm" fw={700} mb={4}>{t('pfp_upload')}</Text>
                            <FileInput
                                placeholder={t('pfp_upload')}
                                accept="image/*"
                                value={editData.newPfp_URL}
                                onChange={file => setEditData({...editData, newPfp_URL: validateProfilePicture(file)})}
                            />

                        </Box>
                        <PasswordInput
                            label={t('password_optional')}
                            autoComplete="new-password"
                            value={editData.password}
                            onChange={e => setEditData({...editData, password: e.target.value})}
                        />
                        <Select
                            label={t('persona_optional')}
                            value={editData.persona}
                            onChange={val => setEditData({...editData, persona: val ?? ''})}
                            data={['Underwriter', 'Business Analyst', 'Admin']}
                        />
                        {editError && (
                            <Text c="red" size="sm">{editError}</Text>
                        )}
                        {/* Show audit-style metadata for the selected employee. */}
                        <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                            <Text fw={600} mb={4}>{t('account_history')}</Text>
                            <Group>
                                <Text size="sm">{editTarget.first_name} {editTarget.last_name}</Text>
                                <Text size="sm" c="dimmed">{t('creation_date')} {new Date(editTarget.created_at).toISOString().split('T')[0]}</Text>
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
                                {t('save_account')}
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
                    {t('changes_you_made')}<strong> {t('cannot_be_undone')}</strong>
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
                        <Text fw={600}>{t('employee_details')}</Text>
                    </Group>
                }
            >
                {employeeTarget && (
                    <>
                        <Center>
                            {imageLoadError ? (
                                // Fall back to initials if the profile image fails to load.
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
                            {/* Read-only summary of the selected employee's account details. */}
                            <Box style={{ background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
                                <Text fw={600} mb={4}>{employeeTarget.first_name} {employeeTarget.last_name}</Text>
                                <Text>{t('username')}: {employeeTarget.username}</Text>
                                <Text>{t('role')}: {employeeTarget.persona}</Text>
                                <Text>{t('year_joined')}: {new Date(employeeTarget.created_at).getFullYear()}</Text>
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

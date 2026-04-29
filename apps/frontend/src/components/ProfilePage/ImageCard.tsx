import '@mantine/core/styles.css';
import {
    Image, Box, Text, Group, Stack, Button, Modal, TextInput, FileInput, PasswordInput, Badge, Divider
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { DOMAIN } from '../../const.ts';
import { useTranslation } from 'react-i18next';
import {IconUser, IconEdit, IconAt, IconCalendar} from "@tabler/icons-react";
import {FilledButton} from "../Buttons/FilledButton.tsx";
import {useApi} from "../api.ts";
import type {Employee} from "../interfaces/DocumentsInterfaces.tsx";

// Fallback image shown when the user does not have a stored profile picture yet.
const placeholder = '/default-profile-picture.png';

export function ProfileComponent() {
    const {t} = useTranslation();
    const api = useApi();
    // Initialize from localStorage so the profile card can render immediately
    // without waiting for the network request.
    const [profileImage, setProfileImage] = useState<string>(() => (
        localStorage.getItem('pfp_URL') || localStorage.getItem('profilePicture') || placeholder
    ));

    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [editData, setEditData] = useState({
        newUsername: '',
        password: '',
        persona: '',
        newPfp_URL: null as File | null
    });
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    const [lastName, setLastName] = useState<string>(
        localStorage.getItem('last_name') || ''
    );

    const [username, setUsername] = useState(localStorage.getItem('username') || '');

    const [creationDate, setCreationDate] = useState<string>(
        localStorage.getItem('created_at') || ''
    );

    const [editOpen, setEditOpen] = useState(false);

    const placeholderProfilePicture =
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="#D8E0EA"/><circle cx="60" cy="48" r="20" fill="#8FA3B7"/><path d="M28 98c6-18 20-27 32-27s26 9 32 27" fill="#8FA3B7"/></svg>'
        );

    useEffect(() => {
        // Username is required to look up the employee record on the backend.
        const username = localStorage.getItem('username');
        if (!username) {
            return;
        }

        // Fetch the latest profile image URL so local storage stays in sync
        // with the backend if the user updated their picture elsewhere.
        api(`${DOMAIN}/getEmployee`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username}),
        })
            .then((res) => {
                if (!res.ok) {
                    return null;
                }
                return res.json();
            })
            .then((payload) => {
                const data = payload?.data;
                const imageUrl = data?.pfp_URL;
                if (imageUrl) {
                    setProfileImage(imageUrl);
                    localStorage.setItem('pfp_URL', imageUrl);
                } else {
                    setProfileImage(placeholderProfilePicture);
                }
                if (data?.last_name) {
                    setLastName(data.last_name);
                    localStorage.setItem('last_name', data.last_name);
                }
                if (data?.created_at) {
                    setCreationDate(data.created_at);
                    localStorage.setItem('created_at', data.created_at);
                }
            })
            .catch(() => {
                // Keep existing localStorage fallback if the request fails.
            });
    }, []);

    function openEdit() {
        const emp = {
            empid: localStorage.getItem('empid') || '',
            username: localStorage.getItem('username') || '',
            persona: localStorage.getItem('persona') || '',
            first_name: localStorage.getItem('first_name') || '',
            last_name: lastName,
            created_at: creationDate,
        };
        setEditTarget(emp);
        setEditData({newUsername: emp.username, password: '', persona: emp.persona, newPfp_URL: null});
        setEditError('');
        setEditOpen(true);
    }

    function validateProfilePicture(file: File | null) {
        return file;
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
                setEditError('No changes to save.');
                return;
            }

            if (hasAccountChanges) {
                const updateResponse = await api(`${DOMAIN}/updateEmployee`, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
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

                if (newUsername) {
                    localStorage.setItem('username', newUsername);
                    setUsername(newUsername);
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

                const uploadData = await uploadResponse.json();
                const newPfpUrl = uploadData?.data?.pfp_URL;
                if (newPfpUrl) {
                    localStorage.setItem('pfp_URL', newPfpUrl);
                    localStorage.setItem('profilePicture', newPfpUrl);
                    setProfileImage(newPfpUrl);
                }

            }


            setEditOpen(false);
        } catch {
            setEditError('Could not save changes. Please try again.');
        } finally {
            setEditSaving(false);
        }
    }

        return (
            <>
                <Box px="xl" pb="xl" pt={0}>
                    <Group justify="space-between" align="center" mb="xl">
                        <Group gap="xs">
                            <IconUser size={25} color="var(--color-yale-blue, #00356b)"/>
                            <Text fw={700} size="md" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-yale-blue, #00356b)' }}>
                                Employee Profile
                            </Text>
                        </Group>
                        <Button
                            variant="subtle"
                            size="md"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => openEdit()}
                            className="invert-hover"
                            style={{ borderRadius: 8 }}
                        >
                            Edit
                        </Button>
                    </Group>

                    <Group align="center" gap="xl">

                        <Box
                            w={110}
                            h={110}
                            style={{
                                borderRadius: '50%',
                                border: '3px solid var(--color-yale-blue, #00356b)',
                                overflow: 'hidden',
                                flexShrink: 0,
                                boxShadow: '0 4px 16px rgba(0,53,107,0.15)',
                            }}
                        >
                            <Image src={profileImage ?? placeholderProfilePicture} style={{ width: 110, height: 110, objectFit: 'cover' }} alt="Profile" />
                        </Box>

                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Box>
                                <Text fw={700} size="xl" lh={1.2}>
                                    {localStorage.getItem('first_name')} {lastName}
                                </Text>
                                <Badge mt={6} size="sm" variant="light" color="blue" style={{ textTransform: 'none', fontWeight: 500 }}>
                                    {localStorage.getItem('persona')}
                                </Badge>
                            </Box>
                            <Divider my={4} />
                            <Group gap="lg" wrap="wrap">
                                <Group gap={6}>
                                    <IconAt size={14} color="gray" />
                                    <Text size="sm" c="dimmed">{t('username')}:</Text>
                                    <Text size="sm" fw={500}>{username}</Text>
                                </Group>
                                <Group gap={6}>
                                    <IconCalendar size={14} color="gray" />
                                    <Text size="sm" c="dimmed">Joined:</Text>
                                    <Text size="sm" fw={500}>{new Date(creationDate).getFullYear()}</Text>
                                </Group>
                            </Group>
                        </Stack>
                    </Group>
                </Box>

                {/* Edit */}
                <Modal
                    opened={editOpen}
                    onClose={() => setEditOpen(false)}
                    title={
                        <Group>
                            <IconUser size={20}/>
                            <Text fw={600}>Edit Employee Account</Text>
                        </Group>
                    }
                >
                    {editTarget && (
                        <Stack>
                            {/* Show current values so admins can compare before saving changes. */}
                            <Box style={{background: '#f8f9fa', borderRadius: 6, padding: 12}}>
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
                                    onChange={file => setEditData({
                                        ...editData,
                                        newPfp_URL: validateProfilePicture(file)
                                    })}
                                />

                            </Box>
                            <PasswordInput
                                label="New Password (Optional)"
                                autoComplete="new-password"
                                value={editData.password}
                                onChange={e => setEditData({...editData, password: e.target.value})}
                            />
                            {editError && (
                                <Text c="red" size="sm">{editError}</Text>
                            )}
                            {/* Show audit-style metadata for the selected employee. */}
                            <Box style={{background: '#f8f9fa', borderRadius: 6, padding: 12}}>
                                <Text fw={600} mb={4}>Account History</Text>
                                <Group>
                                    <Text size="sm">{editTarget.first_name} {editTarget.last_name}</Text>
                                    <Text size="sm" c="dimmed">Creation
                                        Date: {new Date(editTarget.created_at).toISOString().split('T')[0]}</Text>
                                </Group>
                            </Box>
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={() => setEditOpen(false)}
                                        className="invert-hover-outline" disabled={editSaving}>Cancel</Button>
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
            </>
        );
}

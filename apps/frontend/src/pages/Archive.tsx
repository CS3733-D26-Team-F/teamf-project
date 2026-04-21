import '@mantine/core/styles.css';
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { AccessDenied } from "../components/AccessDenied.tsx";
import {
    Box, Text, Table, Group, Tabs,
    ActionIcon, Tooltip, Stack
} from '@mantine/core';
import { IconArchive, IconClock, IconRestore, IconTrash } from '@tabler/icons-react';
import { DOMAIN } from '../const.ts';
import {PersonaBadges} from "../components/Badges/PersonaBadge.tsx";
import { useApi } from "../../src/components/api.ts";

import { PageTitle } from "../components/Title.tsx"

type ContentForm = {
    id: number;
    name: string;
    url: string;
    owner: string;
    persona: string[];
    date_modified: string;
    expiration_date: string;
    content_type: string;
    status: string;
};

// ─── Module-level component — must NOT be defined inside Archive() ────────────
// Keeping this table outside Archive() avoids recreating the component on every render
// and keeps the list rendering logic reusable for both archive tabs.
interface DocTableProps {
    docs: ContentForm[];
    userPersona: string | null;
    onRestore: (id: number) => void;
    onTrash: (id: number) => void;
}

function DocTable({ docs, userPersona, onRestore, onTrash }: DocTableProps) {
    // Show a friendly empty state instead of rendering an empty table body.
    if (docs.length === 0) {
        return <Text c="dimmed" ta="center" py="xl">No documents here.</Text>;
    }

    return (
        <>
            <Table highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Document Name</Table.Th>
                        <Table.Th>Persona</Table.Th>
                        <Table.Th>Owner</Table.Th>
                        <Table.Th>Content Type</Table.Th>
                        <Table.Th>Date Modified</Table.Th>
                        <Table.Th>Expiration Date</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {docs.map(doc => (
                        <Table.Tr key={doc.id}>
                            <Table.Td fw={500}>{doc.name}</Table.Td>
                            <Table.Td>
                                <PersonaBadges personas={doc.persona} />
                            </Table.Td>
                            <Table.Td>{doc.owner}</Table.Td>
                            <Table.Td>{doc.content_type}</Table.Td>
                            <Table.Td>{doc.date_modified?.split('T')[0]}</Table.Td>
                            <Table.Td>{doc.expiration_date?.split('T')[0]}</Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    {/* Restore returns the document to the active workflow. */}
                                    <Tooltip label="Restore to In Progress">
                                        <ActionIcon variant="subtle" color="var(--color-yale-blue)" onClick={() => onRestore(doc.id)}>
                                            <IconRestore size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    {/* Only Admins can permanently move archived items to trash. */}
                                    {userPersona === 'Admin' && (
                                        <Tooltip label="Move to Trash">
                                            <ActionIcon variant="subtle" color="var(--color-neutral-red)" onClick={() => onTrash(doc.id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </>
    );
}

export function Archive() {
    // Persona is used for access control and to decide whether trash actions are allowed.
    const persona = localStorage.getItem('persona');
    const [expired, setExpired] = useState<ContentForm[]>([]);
    const [archived, setArchived] = useState<ContentForm[]>([]);
    const api = useApi();

    // Load documents whose expiration date has passed.
    function loadExpired() {
        api(`${DOMAIN}/contentforms/expired`)
            .then(res => res.json())
            .then(data => setExpired(data));
    }

    // Load documents that were archived manually.
    function loadArchived() {
        api(`${DOMAIN}/contentforms/archived`)
            .then(res => res.json())
            .then(data => setArchived(data));
    }

    useEffect(() => {
        // Auto-expire documents first so the lists stay in sync with the backend state.
        api(`${DOMAIN}/contentforms/autoexpire`, { method: 'PATCH' });
        loadExpired();
        loadArchived();
    }, []);

    // Uses PATCH /contentforms/:id/status — a simple status-only update.
    // Do NOT use PUT /:id here; that handler expects multipart/form-data for file uploads.
    async function restoreDoc(id: number) {
        await api(`${DOMAIN}/contentforms/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'In Progress' })
        });
        loadExpired();
        loadArchived();
    }

    // Soft-delete moves the document out of archive without fully removing it.
    async function trashDoc(id: number) {
        await api(`${DOMAIN}/contentforms/${id}/softdelete`, {
            method: 'PATCH'
        });
        loadExpired();
        loadArchived();
    }

    // Only authenticated users with a persona can access this page.
    const allowedAccess = persona !== null;
    if (!allowedAccess) return <AccessDenied />;

    return (
        <>
            <Header />
            <Box p="md">
                <PageTitle title="Archive" />

                <Tabs defaultValue="expired">
                    <Tabs.List mb="md">
                        {/* Documents sorted here by expiration status. */}
                        <Tabs.Tab value="expired" leftSection={<IconClock size={16} />}>
                            Expired ({expired.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="archived" leftSection={<IconArchive size={16} />}>
                            Archived ({archived.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="expired">
                        <Stack gap="sm">
                            {/* Expired items can be restored or trashed depending on role. */}
                            <Text size="sm" c="dimmed">
                                Documents whose expiration date has passed. Restore them to put them back in active circulation, or move them to trash.
                            </Text>
                            <DocTable docs={expired} userPersona={persona} onRestore={restoreDoc} onTrash={trashDoc} />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="archived">
                        <Stack gap="sm">
                            {/* Manually archived items can be restored back to active status. */}
                            <Text size="sm" c="dimmed">
                                Documents that have been manually archived. Restore them to put them back in active circulation.
                            </Text>
                            <DocTable docs={archived} userPersona={persona} onRestore={restoreDoc} onTrash={trashDoc} />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Box>
        </>
    );
}

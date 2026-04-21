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
import {useTranslation} from "react-i18next";

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
interface DocTableProps {
    docs: ContentForm[];
    userPersona: string | null;
    onRestore: (id: number) => void;
    onTrash: (id: number) => void;
}

function DocTable({ docs, userPersona, onRestore, onTrash }: DocTableProps) {
    const {t} = useTranslation();
    if (docs.length === 0) {
        return <Text c="dimmed" ta="center" py="xl">No documents here.</Text>;
    }
    return (
        <>
            <Table highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>{t('doc_name')}</Table.Th>
                        <Table.Th>{t('persona')}</Table.Th>
                        <Table.Th>{t('owner')}</Table.Th>
                        <Table.Th>{t('content_type')}</Table.Th>
                        <Table.Th>{t('date_modified')}</Table.Th>
                        <Table.Th>{t('expiration_date')}</Table.Th>
                        <Table.Th>{t('actions')}</Table.Th>
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
                                    <Tooltip label= {t('restore')}>
                                        <ActionIcon variant="subtle" color="var(--color-yale-blue)" onClick={() => onRestore(doc.id)}>
                                            <IconRestore size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    {userPersona === 'Admin' && (
                                        <Tooltip label={t('trash')}>
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
    const {t} = useTranslation();
    const persona = localStorage.getItem('persona');
    const [expired, setExpired] = useState<ContentForm[]>([]);
    const [archived, setArchived] = useState<ContentForm[]>([]);
    const api = useApi();

    function loadExpired() {
        api(`${DOMAIN}/contentforms/expired`)
            .then(res => res.json())
            .then(data => setExpired(data));
    }

    function loadArchived() {
        api(`${DOMAIN}/contentforms/archived`)
            .then(res => res.json())
            .then(data => setArchived(data));
    }

    useEffect(() => {
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

    async function trashDoc(id: number) {
        await api(`${DOMAIN}/contentforms/${id}/softdelete`, {
            method: 'PATCH'
        });
        loadExpired();
        loadArchived();
    }

    const allowedAccess = persona !== null;
    if (!allowedAccess) return <AccessDenied />;

    return (
        <>
            <Header />
            <Box p="md">
                <PageTitle title= {t('archive')} />

                <Tabs defaultValue="expired">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="expired" leftSection={<IconClock size={16} />}>
                            {t('expired')} ({expired.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="archived" leftSection={<IconArchive size={16} />}>
                            {t('archived')} ({archived.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="expired">
                        <Stack gap="sm">
                            <Text size="sm" c="dimmed">
                                {t('trash_message')}
                            </Text>
                            <DocTable docs={expired} userPersona={persona} onRestore={restoreDoc} onTrash={trashDoc} />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="archived">
                        <Stack gap="sm">
                            <Text size="sm" c="dimmed">
                                {t('archive_message')}
                            </Text>
                            <DocTable docs={archived} userPersona={persona} onRestore={restoreDoc} onTrash={trashDoc} />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Box>
        </>
    );
}

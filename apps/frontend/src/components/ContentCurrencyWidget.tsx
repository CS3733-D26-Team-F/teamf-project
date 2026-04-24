import type {ContentForm} from "./interfaces/DocumentsInterfaces.tsx"
import {Title, Text, Box, Table, Stack, Paper, Group} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import * as React from "react";
import Switch from "@mui/material/Switch";
import {useApi} from "./api.ts";

export function ContentCurrencyWidget() {
    const [ownerModified, setOwnerModified] = React.useState<ContentForm[]>([]);
    const [roleModified, setRoleModified] = React.useState<ContentForm[]>([]);
    const currentUsername = localStorage.getItem('username');
    const currentPersona = localStorage.getItem('persona');
    const [value, toggle] = useToggle(['Owner', 'Role'] as const);
    const token = localStorage.getItem('token');
    const api = useApi();

    React.useEffect(() => {
        async function fetchOwnerModified() {
            const res = await api(`/contentforms`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token} `
                }
            });

            const data: ContentForm[] = await res.json()

            const now = new Date();
            const past48hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const nowDay = now.toISOString().split('T')[0];
            const past48hoursDay = past48hours.toISOString().split('T')[0];

            const modifiedRecently = data
                .filter(form => {
                    const lastModified = new Date(form.date_modified);
                    const lastModifiedDate = lastModified.toISOString().split('T')[0];
                    return (
                        lastModifiedDate >= past48hoursDay &&
                        lastModifiedDate <= nowDay &&
                        form.owner === currentUsername
                    );
                })
                .sort((a, b) =>
                    new Date(a.date_modified).getTime() - new Date(b.date_modified).getTime()
                );


            setOwnerModified(modifiedRecently)
        }

        fetchOwnerModified();
    }, []);

    React.useEffect(() => {
        async function fetchRoleModified() {
            const res = await api(`/contentforms`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token} `
                }
            });

            const data: ContentForm[] = await res.json()

            const now = new Date();
            const past48hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const nowDay = now.toISOString().split('T')[0];
            const past48hoursDay = past48hours.toISOString().split('T')[0];

            const modifiedRecently = data
                .filter(form => {
                    const lastModified = new Date(form.date_modified);
                    const lastModifiedDate = lastModified.toISOString().split('T')[0];
                    return (
                        lastModifiedDate >= past48hoursDay &&
                        lastModifiedDate <= nowDay &&
                        (form.persona.includes(currentPersona as string) || currentPersona === 'Admin')
                    );
                })
                .sort((a, b) =>
                    new Date(a.date_modified).getTime() - new Date(b.date_modified).getTime()
                );


            setRoleModified(modifiedRecently)
        }

        fetchRoleModified();
    }, []);

    const displayed = value === 'Owner' ? ownerModified : roleModified;

    return (
        <>
            <Paper shadow="sm" radius="md" withBorder p="2xl">
                <Stack gap="md" style={{ padding: '1.25rem' }}>
                    <Title order={3}>Documents Modified Within the Past 48 Hours</Title>
                    <Group>
                        <Text>View: {value}</Text>
                        <Switch
                            checked={value === 'Owner'}
                            onChange={() => toggle()}
                        />
                    </Group>

                    <Box>
                        <Table highlightOnHover withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Owner</Table.Th>
                                    <Table.Th>Content Type</Table.Th>
                                    <Table.Th>Persona</Table.Th>
                                    <Table.Th>Last Modified</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {displayed.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={5}>No documents modified within the past 48 hours</Table.Td>
                                    </Table.Tr>
                                ) : (
                                    displayed.map(form => (
                                        <Table.Tr key={form.id}>
                                            <Table.Td>{form.name}</Table.Td>
                                            <Table.Td>{form.owner}</Table.Td>
                                            <Table.Td>{form.content_type}</Table.Td>
                                            <Table.Td>{form.persona}</Table.Td>
                                            <Table.Td>{new Date(form.date_modified).toLocaleDateString()}</Table.Td>
                                            <Table.Td>{form.status}</Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.Tbody>
                        </Table>
                    </Box>
                </Stack>
            </Paper>
        </>
    )
}
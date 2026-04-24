import type {ContentForm} from "./interfaces/DocumentsInterfaces.tsx"
import {Title, Text, Box, Table, Stack, Paper, Group} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import * as React from "react";
import Switch from "@mui/material/Switch";
import {useApi} from "./api.ts";

export function ExpirationWidget() {
    const [ownerExpiring, setOwnerExpiring] = React.useState<ContentForm[]>([]);
    const [roleExpiring, setRoleExpiring] = React.useState<ContentForm[]>([]);
    const currentUsername = localStorage.getItem('username');
    const currentPersona = localStorage.getItem('persona');
    const [value, toggle] = useToggle(['Owner', 'Role'] as const);
    const token = localStorage.getItem('token');
    const api = useApi();

    React.useEffect(() => {
        async function fetchOwnerExpiring() {
            const res = await api(`/contentforms`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token} `
                }
            });

            const data: ContentForm[] = await res.json()

            const now = new Date();
            const in48hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
            const nowDay = now.toISOString().split('T')[0];
            const in48hoursDay = in48hours.toISOString().split('T')[0];

            const expiringSoon = data
                .filter(form => {
                    const expiration = new Date(form.expiration_date);
                    const expirationDay = expiration.toISOString().split('T')[0];
                    return (
                        expirationDay > nowDay &&
                        expirationDay <= in48hoursDay &&
                        form.owner === currentUsername &&
                        form.status !== 'Expired'
                    );
                })
                .sort((a, b) =>
                    new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
                );


            setOwnerExpiring(expiringSoon)
        }

        fetchOwnerExpiring();
    }, []);

    React.useEffect(() => {
        async function fetchRoleExpiring() {
            const res = await api(`/contentforms`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token} `
                }
            });
            const data: ContentForm[] = await res.json()

            const now = new Date();
            const in48hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

            const expiringSoon = data
                .filter(form => {
                    const expiration = new Date(form.expiration_date);
                    return (
                        expiration > now &&
                        expiration <= in48hours &&
                        (form.persona.includes(currentPersona as string) || currentPersona === 'Admin') &&
                        form.status !== 'Expired'
                    );
                })
                .sort((a, b) =>
                    new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
                );

            setRoleExpiring(expiringSoon)
        }

        fetchRoleExpiring();
    }, []);

    const displayed = value === 'Owner' ? ownerExpiring : roleExpiring;

    return (
        <>
            <Paper shadow="sm" radius="md" withBorder p="2xl">
                <Stack gap="md" style={{ padding: '1.25rem' }}>
                <Title>Documents Expiring in the Next 48 Hours</Title>
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
                                <Table.Th>Expiration Date</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {displayed.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>No documents expiring in the next 48 hours</Table.Td>
                                </Table.Tr>
                            ) : (
                                displayed.map(form => (
                                    <Table.Tr key={form.id}>
                                        <Table.Td>{form.name}</Table.Td>
                                        <Table.Td>{form.owner}</Table.Td>
                                        <Table.Td>{form.content_type}</Table.Td>
                                        <Table.Td>{form.persona}</Table.Td>
                                        <Table.Td>{new Date(form.expiration_date).toLocaleString()}</Table.Td>
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
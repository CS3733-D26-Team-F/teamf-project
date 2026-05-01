import type {ContentForm} from "../interfaces/DocumentsInterfaces.tsx"
import {Text, Paper, Group, Pagination} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import * as React from "react";
import Switch from "@mui/material/Switch";
import {useApi} from "../api.ts";
import {IconClock} from "@tabler/icons-react";
import dayjs from "dayjs";
import {FileTypeBadge} from "../Badges/FileTypeBadge.tsx";
import {getFileType} from "../content/Functions.tsx";
import {PersonaBadges} from "../Badges/PersonaBadge.tsx";
import {useTranslation} from "react-i18next";
import {HelpModal} from "./StatsPopup.tsx";

export function ExpirationWidget() {
    const [ownerExpiring, setOwnerExpiring] = React.useState<ContentForm[]>([]);
    const [roleExpiring, setRoleExpiring] = React.useState<ContentForm[]>([]);
    const currentUsername = localStorage.getItem('username');
    const currentPersona = localStorage.getItem('persona');
    const [value, toggle] = useToggle(
        currentPersona === 'Admin' ? ['Role', 'Owner'] as const : ['Owner', 'Role'] as const
    );
    const [page, setPage] = React.useState(1);
    const {t} = useTranslation();
    const PAGE_SIZE = 3;

    React.useEffect(() => {
        setPage(1);
    }, [value]);

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
            const nowDay = now.toISOString().split('T')[0];
            const in48hoursDay = in48hours.toISOString().split('T')[0];

            const expiringSoon = data
                .filter(form => {
                    const expiration = new Date(form.expiration_date);
                    const expirationDay = expiration.toISOString().split('T')[0];
                    return (
                        expirationDay > nowDay &&
                        expirationDay <= in48hoursDay &&
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

    const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(displayed.length / PAGE_SIZE);

    return (
        <>
            <Paper
                withBorder
                radius="md"
                p="md"
                style={{
                    marginLeft: 20,
                    marginTop: 20,
                    position: 'relative'
                }}
            >
                <HelpModal title= {t('expiring_soon')}>
                    <Text>{t('expiring_soon_tip')}</Text>
                </HelpModal>
                <Group gap={6} mb="xs">
                    <IconClock size={14} color="gray" />
                    <Text fw={700} size="sm" c="dimmed">{t('expire_widget')}</Text>
                </Group>

                {currentPersona === 'Admin' ? (
                    <Text fw={700} size="sm" c="dimmed">{t('view')}: {t('all_personas')}</Text>
                ) : (
                    <Group>
                        <Text fw={700} size="sm" c="dimmed">View: {value}</Text>
                        <Switch
                            checked={value === 'Owner'}
                            onChange={() => toggle()}
                        />
                    </Group>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {paginated.length === 0 ? (
                        <Text c="dimmed">{t('noExpire_widget')}</Text>
                    ) : (
                        paginated.map(doc => (
                            <Paper
                                withBorder
                                radius="md"
                                p="md"
                                key={doc.id}
                                onClick={() => window.open(doc.url, "_blank")}
                                style={{ cursor: "pointer" }}
                            >

                                <Group justify="space-between">
                                    <Text fw={600} size="sm">{doc.name}</Text>
                                    <Text size="sm" c="dimmed">
                                        {t('expiration_date')}: {dayjs(doc.expiration_date).format("MMM D, YYYY")}
                                    </Text>
                                </Group>

                                <Group mt="xs">
                                    <FileTypeBadge fileType={getFileType(doc.url)} size="sm" />
                                    <PersonaBadges personas={doc.persona} />
                                </Group>
                            </Paper>
                        )))}

                    {totalPages > 1 && (
                        <Group justify="center" mt="sm">
                            <Pagination
                                value={page}
                                onChange={setPage}
                                total={totalPages}
                                size="sm"
                            />
                        </Group>
                    )}
                </div>
            </Paper>
        </>
    )
}
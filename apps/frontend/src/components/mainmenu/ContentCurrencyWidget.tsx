import type {ContentForm} from "../interfaces/DocumentsInterfaces.tsx"
import {Text, Paper, Group, Pagination} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import * as React from "react";
import Switch from "@mui/material/Switch";
import {useApi} from "../api.ts";
import {IconClock} from "@tabler/icons-react";
import dayjs from "dayjs";
import {FileTypeBadge} from "../Badges/FileTypeBadge.tsx";
import {PersonaBadges} from "../Badges/PersonaBadge.tsx";
import {getFileType} from "../content/Functions.tsx";
import {useTranslation} from "react-i18next";
import {HelpModal} from "./StatsPopup.tsx";

export function ContentCurrencyWidget() {
    const [ownerModified, setOwnerModified] = React.useState<ContentForm[]>([]);
    const [roleModified, setRoleModified] = React.useState<ContentForm[]>([]);
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

            const modifiedRecently = data
                .filter(form => {
                    const lastModified = new Date(form.date_modified).getTime();
                    return (
                        lastModified >= past48hours.getTime() &&
                        form.owner === currentUsername
                    );
                })
                .sort((a, b) =>
                    new Date(b.date_modified).getTime() - new Date(a.date_modified).getTime()
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

            const modifiedRecently = data
                .filter(form => {
                    const lastModified = new Date(form.date_modified).getTime();
                    return (
                        lastModified >= past48hours.getTime() &&
                        (form.persona.includes(currentPersona as string) || currentPersona === 'Admin')
                    );
                })
                .sort((a, b) =>
                    new Date(b.date_modified).getTime() - new Date(a.date_modified).getTime()
                );


            setRoleModified(modifiedRecently)
        }

        fetchRoleModified();
    }, []);

    const displayed = value === 'Owner' ? ownerModified : roleModified;

    const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(displayed.length / PAGE_SIZE);

    return (
    <>
        <Paper
            withBorder
            radius="md"
            p="md"
            style={{
                marginTop: 20,
                position: 'relative'
            }}
        >
            <HelpModal title="Recently Modified">
                <Text>Shows documents modified in the last 48 hours, filtered by your ownership or role.</Text>
            </HelpModal>
            <Group gap={6} mb="xs">
                <IconClock size={14} color="gray" />
                <Text fw={700} size="sm" c="dimmed">{t('modify_widget')}</Text>
            </Group>

            {currentPersona === 'Admin' ? (
                <Text fw={700} size="sm" c="dimmed">View: All Personas</Text>
            ) : (
                <Group>
                    <Text fw={700} size="sm" c="dimmed">{t('view')}: {value}</Text>
                    <Switch
                        checked={value === 'Owner'}
                        onChange={() => toggle()}
                    />
                </Group>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {paginated.length === 0 ? (
                    <Text c="dimmed">{t('noModify_widget')}</Text>
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
                                {t('lastModify')}: {dayjs(doc.date_modified).format("MMM D, YYYY")}
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
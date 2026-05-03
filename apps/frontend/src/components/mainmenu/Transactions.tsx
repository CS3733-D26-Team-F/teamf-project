import { useEffect, useState } from "react";
import { DOMAIN } from "../../const.ts";
import { useApi } from "../api.ts";
import dayjs from "dayjs";
import {Group, Paper, Text, Select, ScrollArea, Stack, Badge } from "@mantine/core";
import {FilePlusIcon, NotePencilIcon, TrashIcon} from "@phosphor-icons/react";
import {HelpModal} from "./StatsPopup.tsx";
import {useTranslation} from "react-i18next";
import Switch from "@mui/material/Switch";

type Change = {
    chad: number;
    id: number;
    empid: number;
    change: string;
    date: string;
};
export function Transactions() {
    const {t} = useTranslation();
    const [changes, setChanges] = useState<Change[]>([]);
    const [allChanges, setAllChanges] = useState<Change[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null); // just a string, not Auth0 User
    const [adminView, setAdminView] = useState(false);
    const [empNames, setEmpNames] = useState<Record<number, string>>({});
    const [docNames, setDocNames] = useState<Record<number, string>>({});

    const api = useApi();
    const isAdmin = localStorage.getItem('persona') === 'Admin';

    useEffect(() => {
        const fetchData = async () => {
            const form = new FormData();
            form.append('username', localStorage.getItem('username') || '');

            const res = await api(`${DOMAIN}/changes`, {
                method: "POST",
                body: form,
            });
            const data: Change [] = await res.json();
            setChanges(data);
        };
        void fetchData()
    }, [])

    const todaysChanges = changes.filter((c) => {
        const itemDate = dayjs.utc(c.date).format("YYYY-MM-DD");
        const today = dayjs()
            .subtract(4, "hour")
            .format("YYYY-MM-DD");
        return itemDate === today;
    });

    useEffect(() => {
        if (!isAdmin || !adminView) return;
        const fetchAllData = async () => {
            const res = await api(`${DOMAIN}/changes`, {
                method: "POST",
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ empid: Number(localStorage.getItem('empid')) })
            });
            const data: Change[] = await res.json();

            setAllChanges(data);
            const uniqueEmps = [...new Set(data.map(c => c.empid))];
            setSelectedUser(uniqueEmps[0]?.toString() ?? null);
        };
        void fetchAllData();
    }, [adminView]);

    useEffect(() => {
        if (!isAdmin || !adminView || allChanges.length === 0) return;
        const fetchEmpNames = async () => {
            const uniqueEmpIds = [...new Set(allChanges.map(c => c.empid))];
            const results = await Promise.all(
                uniqueEmpIds.map(id =>
                    api(`${DOMAIN}/employeenames/${id}`).then(r => r.json()).then(name => ({ id, name }))
                )
            );
            const map: Record<number, string> = {};
            results.forEach(({ id, name }) => { map[id] = name; });
            setEmpNames(map);
        };
        void fetchEmpNames();
    }, [adminView, allChanges]);

    useEffect(() => {
        if (!isAdmin || !adminView || allChanges.length === 0) return;
        const fetchDocNames = async () => {
            const uniqueDocIds = [...new Set(allChanges.map(c => c.id))];
            const results = await Promise.all(
                uniqueDocIds.map(id =>
                    api(`${DOMAIN}/contentnames/${id}`).then(r => r.json()).then(name => ({ id, name }))
                )
            );
            const map: Record<number, string> = {};
            results.forEach(({ id, name }) => { map[id] = name; });
            setDocNames(map);
        };
        void fetchDocNames();
    }, [adminView, allChanges]);

    useEffect(() => {
        if (todaysChanges.length === 0) return;
        const fetchMyDocNames = async () => {
            const uniqueDocIds = [...new Set(todaysChanges.map(c => c.id))];
            const results = await Promise.all(
                uniqueDocIds.map(id =>
                    api(`${DOMAIN}/contentnames/${id}`)
                        .then(r => r.json())
                        .then(name => ({ id, name }))
                        .catch(() => ({ id, name: null }))
                )
            );
            const map: Record<number, string> = {};
            results.forEach(({ id, name }) => { if (name) map[id] = name; });
            setDocNames(map);
        };
        void fetchMyDocNames();
    }, [changes]);


    const addedToday = todaysChanges.filter(c => c.change === "Added Document").length;
    const editedToday = todaysChanges.filter(c => c.change === "Updated Document").length;
    const deletedToday = todaysChanges.filter(c => c.change === "Deleted Document").length;


    const oneWeekAgo = dayjs().subtract(7, 'day');
    const users = [...new Set(allChanges.map(c => c.empid).filter(Boolean))].map(id => ({
        value: id.toString(),
        label: empNames[id] ?? `Employee ${id}`
    }));
    const filteredChanges = allChanges.filter(c =>
        dayjs.utc(c.date).isAfter(oneWeekAgo) && c.empid.toString() === selectedUser
    );
    const checkoutHistory = filteredChanges.filter(c =>
        c.change === "Checked Out Document" || c.change === "Checked In Document"
    );

    const getBadgeColor = (action: string) => {
        if (action === "Checked Out Document") return "var(--pacific-blue)";
        if (action === "Checked In Document") return "var(--yale-blue)";
        return "gray";
    };

    return (
        <Paper withBorder p="md" radius="md"
               mx="auto"
               style={{ width: adminView ? 1000 : 700,
                   height: adminView ? 700 : 400,
                   position: "relative",
                   transition: 'width 0.3s ease'}}>



            <Group justify="space-between" mb="md" mt="xl">
                <Group mb = "md">
                    <Text fw={700} size="lg">
                        {adminView ? t('admin_activity_today'): isAdmin ? t('two_activity_today'): t('activity_today')}
                    </Text>
                    <HelpModal title={t('transactions')} inline>
                        <Text>{t('transactions_tip')}</Text>
                    </HelpModal>
                </Group>
                {isAdmin && (
                    <Group gap={4}>
                        <Text size="xs" c="dimmed">{t('admin_view')}</Text>
                        <Switch
                            checked={adminView}
                            onChange={(e) => setAdminView(e.currentTarget.checked)}
                            size="small"
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: 'var(--light-gray)',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '--sapphire',
                                },
                            }}
                        />
                    </Group>
                )}
            </Group>

            {!adminView ? (
                // normal user view
                <>
                    <Group align="flex-start" gap="md">
                        <div style={{ flex: 1, height: 400 }}>
                            <Group justify="space-between" mb="xs">
                                <Text>{t('files_added')}</Text>
                                <Group gap={4}>
                                    <Text fw={700}>{addedToday}</Text>
                                    <FilePlusIcon size={18} />
                                </Group>
                            </Group>
                            <Group justify="space-between" mb="xs">
                                <Text>{t('files_edited')}</Text>
                                <Group gap={4}>
                                    <Text fw={700}>{editedToday}</Text>
                                    <NotePencilIcon size={18} />
                                </Group>
                            </Group>
                            <Group justify="space-between" mb="md">
                                <Text>{t('files_deleted')}</Text>
                                <Group gap={4}>
                                    <Text fw={700}>{deletedToday}</Text>
                                    <TrashIcon size={18} />
                                </Group>
                            </Group>
                        </div>
                        <div style={{ flex: 1 , height: 400}}>
                            <Text fw={600} size="sm" mb="xs" c="dimmed">
                                {t('doc_activity_today')}
                            </Text>
                            <ScrollArea h={250}>
                                <Stack gap="xs">
                                    {todaysChanges.filter(c =>
                                        c.change === "Added Document" ||
                                        c.change === "Updated Document" ||
                                        c.change === "Deleted Document"
                                    ).length === 0 ? (
                                        <Text c="dimmed" size="sm">{t('no_doc_activity')}</Text>
                                    ) : (
                                        todaysChanges
                                            .filter(c =>
                                                c.change === "Added Document" ||
                                                c.change === "Updated Document" ||
                                                c.change === "Deleted Document"
                                            )
                                            .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
                                            .map((c, i) => (
                                                <Paper withBorder p="xs" radius="sm" key={i} mih={75}>
                                                    <Group justify="space-between">
                                                        <Text size="sm" fw={500}>
                                                            {docNames[c.id] ?? c.id}
                                                        </Text>
                                                        <Badge color={
                                                            c.change === "Added Document" ? "var(--sapphire)" :
                                                                c.change === "Updated Document" ? "var(--fresh-sky)" : "var(--neutral-red)"
                                                        } size="sm">
                                                            {c.change === "Added Document" ? t('added') :
                                                                c.change === "Updated Document" ? t('edited') : t('deleted')}
                                                        </Badge>
                                                    </Group>
                                                    <Text size="xs" c="dimmed">
                                                        {dayjs.utc(c.date).format("MMM D, YYYY h:mm A")}
                                                    </Text>
                                                </Paper>
                                            ))
                                    )}
                                </Stack>
                            </ScrollArea>
                        </div>
                    </Group>
                </>
            ) : (
                // admin view
                <>
                    <Select
                        label= {t('admin_select_emp')}
                        data={users}
                        value={selectedUser}
                        onChange={setSelectedUser}
                        mb="md"
                        size="sm"
                    />
                    <Group align="flex-start" gap="md">
                        {/* checkout history */}
                        <div style={{ flex: 1, height: 700 }}>
                            <Text fw={600} size="sm" mb="xs" c="dimmed">
                                {t('check_history')}
                            </Text>
                            <ScrollArea h={430}>
                                <Stack gap="xs">
                                    {checkoutHistory.length === 0 ? (
                                        <Text c="dimmed" size="sm">No checkout activity this week.</Text>
                                    ) : (
                                        checkoutHistory.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
                                            .map((c, i) => (
                                            <Paper withBorder p="xs" radius="sm" key={i} style={{ minHeight: 75}}>
                                                <Group justify="space-between">
                                                    <Text size="sm" fw={500}>
                                                        {docNames[c.id] ?? c.id}
                                                    </Text>
                                                    <Badge color={getBadgeColor(c.change)} size="sm">
                                                        {c.change === "Checked Out Document" ? t('out') : t('in')}
                                                    </Badge>
                                                </Group>

                                                <Text size="xs" c="dimmed">
                                                    {dayjs.utc(c.date).format("MMM D, YYYY h:mm A")}
                                                </Text>
                                            </Paper>
                                        ))
                                    )}
                                </Stack>
                            </ScrollArea>
                        </div>

                        {/* document activity */}
                        <div style={{ flex: 1 }}>
                            <Text fw={600} size="sm" mb="xs" c="dimmed">
                                {t('doc_activity_past')}
                            </Text>
                            <ScrollArea h={430}>
                                <Stack gap="xs">
                                    {filteredChanges.filter(c =>
                                        c.change === "Added Document" ||
                                        c.change === "Updated Document" ||
                                        c.change === "Deleted Document"
                                    ).length === 0 ? (
                                        <Text c="dimmed" size="sm">No document activity this week.</Text>
                                    ) : (
                                        filteredChanges
                                            .filter(c =>
                                                c.change === "Added Document" ||
                                                c.change === "Updated Document" ||
                                                c.change === "Deleted Document"
                                            )
                                            .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
                                            .map((c, i) => (
                                                <Paper withBorder p="xs" radius="sm" key={i} style={{ minHeight: 75}}>
                                                    <Group justify="space-between">
                                                        <Text size="sm" fw={500}>
                                                            {docNames[c.id] ?? c.id}
                                                        </Text>
                                                        <Badge color={
                                                            c.change === "Added Document" ? "var(--sapphire)" :
                                                                c.change === "Updated Document" ? "var(--fresh-sky)" : "var(--neutral-red)"
                                                        } size="sm">
                                                            {c.change === "Added Document" ? t('added') :
                                                                c.change === "Updated Document" ? t('edited') : t('deleted')}
                                                        </Badge>
                                                    </Group>
                                                    <Text size="xs" c="dimmed">
                                                        {dayjs.utc(c.date).format("MMM D, YYYY h:mm A")}
                                                    </Text>
                                                </Paper>
                                            ))
                                    )}
                                </Stack>
                            </ScrollArea>
                        </div>
                    </Group>
                </>
            )}
        </Paper>
    );
}
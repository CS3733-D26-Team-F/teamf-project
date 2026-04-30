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
            console.log("RAW CHANGES FROM BACKEND:", data);
            console.log("EACH DATE:", data.map(c => dayjs(c.date).format("YYYY-MM-DD")));
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
        <Paper withBorder p="md" radius="md" style={{ width: 500, position: "relative" }}>
            <HelpModal title={t('transactions')} position ="top">
                <Text>{t('transactions_tip')}</Text>
            </HelpModal>

            <Group justify="space-between" mb="md" mt="xl">
                <Text fw={700} size="lg">
                    {adminView ? t('admin-activity_today'): isAdmin ? t('two_activity_today'): t('activity_today')}
                </Text>
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
                    <Group justify="space-between">
                        <Text>{t('files_deleted')}</Text>
                        <Group gap={4}>
                            <Text fw={700}>{deletedToday}</Text>
                            <TrashIcon size={18} />
                        </Group>
                    </Group>
                </>
            ) : (
                // admin view
                <>
                    <Select
                        label="Select Employee"
                        data={users}
                        value={selectedUser}
                        onChange={setSelectedUser}
                        mb="md"
                        size="sm"
                    />
                    <Text fw={600} size="sm" mb="xs" c="dimmed">
                        {t("check_history")}
                    </Text>
                    <ScrollArea h={200}>
                        <Stack gap="xs">
                            {checkoutHistory.length === 0 ? (
                                <Text c="dimmed" size="sm">{t('no_checkout_activity')}</Text>
                            ) : (
                                checkoutHistory.map((c, i) => (
                                    <Paper withBorder p="xs" radius="sm" key={i}>
                                        <Group justify="space-between">
                                            <Text size="sm" fw={500}>
                                                {docNames[c.id] ?? c.id}
                                            </Text>
                                            <Badge color={getBadgeColor(c.change)} size="sm">
                                                {c.change === "Checked Out Document" ? "Out" : "In"}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed" mb={2}>
                                            {empNames[c.empid] ?? `Employee ${c.empid}`}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {dayjs.utc(c.date).format("MMM D, YYYY h:mm A")}
                                        </Text>
                                    </Paper>
                                ))
                            )}
                        </Stack>
                    </ScrollArea>
                </>
            )}
        </Paper>
    );
}
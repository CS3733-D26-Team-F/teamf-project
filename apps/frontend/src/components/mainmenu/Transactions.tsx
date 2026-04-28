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
    name: string;
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

    const api = useApi();
    const isAdmin = localStorage.getItem('persona') === 'Admin';

    useEffect(() => {
        const fetchData = async () => {
            const res = await api(`${DOMAIN}/changes`, {
                method: "POST",
                headers: {'content-type': 'application/json'},
                body: JSON.stringify(localStorage.getItem('username'))
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
        const today = dayjs().format("YYYY-MM-DD");
        console.log(today);
        return itemDate === today;
    });

    useEffect(() => {
        if (!isAdmin || !adminView) return;
        const fetchAllData = async () => {
            const res = await api(`${DOMAIN}/changes`, {
                method: "POST",
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(localStorage.getItem('empid'))
            });
            const data: Change[] = await res.json();

            console.log("ALL CHANGES:", data);                                    // is data coming back?
            console.log("UNIQUE USERS:", [...new Set(data.map(c => c.empid))]); // are there users?
            console.log("CHECKOUT EVENTS:", data.filter(c =>                       // any checkout events?
                c.change === "Checked Out Document" || c.change === "Checked In Document"
            ));

            setAllChanges(data);
            const uniqueEmps = [...new Set(data.map(c => c.empid))];
            setSelectedUser(uniqueEmps[0]?.toString() ?? null);
        };
        void fetchAllData();
    }, [adminView]);


    //const accessedToday = todaysChanges.filter(c => c.change === "access").length;
    const addedToday = todaysChanges.filter(c => c.change === "Added Document").length;
    const editedToday = todaysChanges.filter(c => c.change === "Updated Document").length;
    const deletedToday = todaysChanges.filter(c => c.change === "Deleted Document").length;


    const oneWeekAgo = dayjs().subtract(7, 'day');
    const users = [...new Set(allChanges.map(c => c.empid).filter(Boolean))].map(id => ({
        value: id.toString(),
        label: `Employee ${id}`  // or just the id if you don't have names
    }));
    const filteredChanges = allChanges.filter(c =>
        dayjs.utc(c.date).isAfter(oneWeekAgo) && c.empid.toString() === selectedUser
    );
    const checkoutHistory = filteredChanges.filter(c =>
        c.change === "Checked Out Document" || c.change === "Checked In Document"
    );

    const getBadgeColor = (action: string) => {
        if (action === "Checked Out Document") return "orange";
        if (action === "Checked In Document") return "green";
        return "gray";
    };
    console.log("isAdmin:", isAdmin);
    console.log("adminView:", adminView);
    console.log("selectedUser:", selectedUser);
    console.log("filteredChanges:", filteredChanges);
    console.log("checkoutHistory:", checkoutHistory);

    return (
        <Paper withBorder p="md" radius="md" style={{ width: 300, position: "relative" }}>
            <HelpModal title="Transactions">
                <Text>Number of transactions of documents added, edited, and deleted today.</Text>
            </HelpModal>

            <Group justify="space-between" mb="md">
                <Text fw={700} size="lg">
                    {adminView ? "Employee Activity" : "My Activity Today"}
                </Text>
                {isAdmin && (
                    <Group gap={4}>
                        <Text size="xs" c="dimmed">Admin View</Text>
                        <Switch
                            checked={adminView}
                            onChange={(e) => setAdminView(e.currentTarget.checked)}
                            size="small"
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
                        Check In / Out History (Past Week)
                    </Text>
                    <ScrollArea h={200}>
                        <Stack gap="xs">
                            {checkoutHistory.length === 0 ? (
                                <Text c="dimmed" size="sm">No checkout activity this week.</Text>
                            ) : (
                                checkoutHistory.map((c, i) => (
                                    <Paper withBorder p="xs" radius="sm" key={i}>
                                        <Group justify="space-between">
                                            <Text size="sm" fw={500}>{c.name}</Text>
                                            <Badge color={getBadgeColor(c.change)} size="sm">
                                                {c.change === "Checked Out Document" ? "Out" : "In"}
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
                </>
            )}
        </Paper>
    );
}
import { useEffect, useState } from "react";
import { DOMAIN } from "../../const.ts";
import { useApi } from "../api.ts";
import dayjs from "dayjs";
import {Group, Paper, Text} from "@mantine/core";

type Change = {
    chad: number;
    name: string;
    username: string;
    change: string;
    date: Date; // or Date if your backend returns ISO strings
};
export function Transactions() {
    const [changes, setChanges] = useState<Change[]>([]);

    const api = useApi();

    useEffect(() => {
        const fetchData = async () => {
            const res = await api(`${DOMAIN}/changes`, {
                method: "POST",
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    username: localStorage.getItem('username')
                })
            });
            const data: Change [] = await res.json();
            setChanges(data);
        };
        void fetchData() // This line breaks something, API call is fine
    }, [api])

    const today = dayjs().startOf("day");
    const todaysChanges = changes.filter(c =>
    dayjs(c.date).isAfter(today)
    );

    const accessedToday = todaysChanges.filter(c => c.change === "access").length;
    const addedToday = todaysChanges.filter(c => c.change === "Added Document").length;
    const editedToday = todaysChanges.filter(c => c.change === "Updated Document").length;
    const deletedToday = todaysChanges.filter(c => c.change === "Deleted Document").length;

    return (
        <Paper withBorder p="md" radius="md" style={{ width: 300 }}>
            <Text fw={700} size="lg" mb="md">Today's Activity</Text>

            <Group justify="space-between" mb="xs">
                <Text>Files Added</Text>
                <Text fw={700}>{addedToday}</Text>
            </Group>

            <Group justify="space-between" mb="xs">
                <Text>Files Edited</Text>
                <Text fw={700}>{editedToday}</Text>
            </Group>

            <Group justify="space-between">
                <Text>Files Deleted</Text>
                <Text fw={700}>{deletedToday}</Text>
            </Group>
        </Paper>
    )
}
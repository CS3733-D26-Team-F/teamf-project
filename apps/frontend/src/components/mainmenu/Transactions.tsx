import { useEffect, useState } from "react";
import { DOMAIN } from "../../const.ts";
import { useApi } from "../api.ts";
import dayjs from "dayjs";
import {Group, Paper, Text} from "@mantine/core";
import {FilePlusIcon, NotePencilIcon, TrashIcon} from "@phosphor-icons/react";
import {useTranslation} from "react-i18next";

type Change = {
    chad: number;
    name: string;
    username: string;
    change: string;
    date: string;
};
export function Transactions() {
    const {t} = useTranslation();
    const [changes, setChanges] = useState<Change[]>([]);

    const api = useApi();

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
    }, [api])

    const todaysChanges = changes.filter((c) => {
        const itemDate = dayjs.utc(c.date).format("YYYY-MM-DD");
        const today = dayjs().format("YYYY-MM-DD");
        console.log(today);
        return itemDate === today;
    });


    //const accessedToday = todaysChanges.filter(c => c.change === "access").length;
    const addedToday = todaysChanges.filter(c => c.change === "Added Document").length;
    const editedToday = todaysChanges.filter(c => c.change === "Updated Document").length;
    const deletedToday = todaysChanges.filter(c => c.change === "Deleted Document").length;

    return (
        <Paper withBorder p="md" radius="md" style={{ width: 300 }}>
            <Text fw={700} size="lg" mb="md">{t('activity_today')}</Text>

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
        </Paper>
    )
}
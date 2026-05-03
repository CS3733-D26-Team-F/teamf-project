import {useState, useEffect, useRef} from "react";
import { ActionIcon, Badge, Button, Checkbox, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconTrash, IconClipboardList } from "@tabler/icons-react";
import {useTranslation} from "react-i18next";
import {HelpModal} from "./StatsPopup.tsx";
import {useApi} from "../api.ts";
import { DOMAIN } from "../../const.ts";

interface ToDoItem {
    id: string;
    label: string;
    checked: boolean;
}

export function ToDoList() {
    const [value, setValue] = useState('');
    const [items, setItems] = useState<ToDoItem[]>([]);
    const {t} = useTranslation();
    const name = localStorage.getItem('username');
    const api = useApi();
    const itemsRef = useRef<ToDoItem[]>([]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    const syncToBackend = async (next: ToDoItem[]) => {
        await api(`${DOMAIN}/updateToDo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: name,
                todo: next.map(item => JSON.stringify(item))
            })
        });
    };

    const getTasks = async () => {
        if (!name) return;
        try {
            const res = await api(`${DOMAIN}/getToDo?username=${name}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const parsed = data.map((item, index) => {
                    if (typeof item === "object" && item !== null) return item;
                    try {
                        const obj = JSON.parse(item);
                        if (obj && obj.label) return obj;
                    } catch {
                        return { id: `legacy-${index}`, label: item, checked: false };
                    }
                    return { id: `err-${index}`, label: "Invalid Task", checked: false };
                });

                const undupe = parsed.reduceRight((acc, item) => {
                    if (!acc.find((i: ToDoItem) => i.id === item.id)) acc.push(item);
                    return acc;
                }, [] as ToDoItem[]).reverse();

                setItems(undupe);

                if (parsed.length > undupe.length) {
                    await syncToBackend(undupe);
                }
            }
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        }
    };

    useEffect(() => {
        getTasks();
    }, [name]);

    const addTask = async () => {
        if (!value.trim() || !name) return;
        const prev = itemsRef.current;
        const newTask: ToDoItem = { id: crypto.randomUUID(), label: value.trim(), checked: false };
        const next = [newTask, ...prev];
        setItems(next);
        setValue('');
        try {
            await syncToBackend(next);
        } catch (err) {
            console.error("Failed to add task:", err);
            getTasks();
        }
    };

    const removeTask = async (itemToRemove: ToDoItem) => {
        if (!name) return;
        const prev = itemsRef.current;
        const next = prev.filter(i => i.id !== itemToRemove.id);
        setItems(next);
        try {
            await syncToBackend(next);
        } catch (err) {
            console.error("Failed to remove task:", err);
            getTasks();
        }
    };

    const toggleTask = async (itemToToggle: ToDoItem) => {
        if (!name) return;
        const previous = itemsRef.current;
        const current = previous.find(i => i.id === itemToToggle.id);
        if (!current) return;
        const updated = { ...current, checked: !current.checked };
        const next = [updated, ...previous.filter(i => i.id !== itemToToggle.id)];
        setItems(next);
        try {
            await syncToBackend(next);
        } catch (err) {
            console.error("Failed to toggle task:", err);
            getTasks();
        }
    };

    const renderItemText = (item: ToDoItem) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.label) return item.label;
        return "Unknown Task";
    };

    const pending = items.filter(i => !i.checked).length;
    const done = items.filter(i => i.checked).length;

    return (
        <div>


        <Stack gap="md" h="100%" style={{ padding: '1.25rem' }}>
            <Group justify="space-between" align="center">


                <Group mb = "md">
                    <Group gap="xs">
                        <IconClipboardList size={20} color="var(--yale-blue)" />
                        <Title order={3} style={{ color: 'var(--yale-blue)', margin: 0 }}>{t('task')}</Title>
                    </Group>
                    <HelpModal title= {t("todo_list")} inline>
                        <Text>{t("todo_list_tip")}</Text>
                    </HelpModal>
                </Group>

                <Group gap="xs">
                    {pending > 0 && <Badge color="blue" variant="light">{pending} {t('pending')}</Badge>}
                    {done > 0 && <Badge color="var(--pacific-blue)" variant="light">{done} {t('done')}</Badge>}
                </Group>
            </Group>

            <Group gap="xs">
                <TextInput
                    placeholder={t('add_task')}
                    value={value}
                    onChange={(e) => setValue(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    style={{ flex: 1 }}
                    styles={{ input: { borderColor: 'var(--pacific-blue)' } }}
                />
                <Button
                    onClick={addTask}
                    style={{ backgroundColor: 'var(--yale-blue)' }}>
                    {t('add')}
                </Button>
            </Group>

            <Stack gap="xs" style={{ overflowY: 'auto', flex: 1 }}>
                {items.length === 0 && (
                    <Text c="dimmed" size="sm" ta="center" mt="md">
                        {t('no_task')}
                    </Text>
                )}
                {items.map((item) => (
                    <Paper
                        key={item.id}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{
                            borderColor: item.checked ? 'var(--light-gray)' : 'var(--pacific-blue)',
                            opacity: item.checked ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                        }}>
                        <Group justify="space-between" wrap="nowrap">
                            <Checkbox
                                checked={item.checked}
                                label={
                                    <Text
                                        size="sm"
                                        style={{
                                            textDecoration: item.checked ? 'line-through' : 'none',
                                            color: item.checked ? 'var(--light-gray)' : 'inherit',
                                            transition: 'all 0.2s ease',
                                        }}>
                                        {renderItemText(item)}
                                    </Text>
                                }
                                onChange={() => toggleTask(item)}
                                color="var(--pacific-blue)"
                            />
                            <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => removeTask(item)}>
                                <IconTrash size={14} />
                            </ActionIcon>
                        </Group>
                    </Paper>
                ))}
            </Stack>
        </Stack>
        </div>
    );
}
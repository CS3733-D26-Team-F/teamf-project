import {useState, useEffect, useRef} from "react";
import { ActionIcon, Badge, Button, Checkbox, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconTrash, IconClipboardList } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { HelpModal } from "./StatsPopup.tsx";
import { DOMAIN } from "../../const.ts";
import { useApi } from "../../components/api.ts";

interface ToDoItem {
    id: string;
    label: string;
    checked: boolean;
}

export function ToDoList() {
    const [value, setValue] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const { t } = useTranslation();
    const name = localStorage.getItem('username');
    const api = useApi();

    const getTasks = async () => {
        if (!name) return;
        try {
            const res = await api(`${DOMAIN}/getToDo?username=${name}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const parsed = data.map((item, index) => {
                    if (typeof item === "object" && item !== null) return item;

                    try{
                        const obj = JSON.parse(item);
                        if (obj && obj.label) return obj;
                    }
                    catch (err){
                        return {
                            id: `legacy-${index}`,
                            label: item,
                            checked: false
                        };
                    }
                    return { id: `err-${index}`, label: "Invalid Task", checked: false };
                })
                setItems(parsed);
            }
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        }
    };

    useEffect(() => {
        getTasks();
    }, [name]);

    const addTask = async (task?: ToDoItem) => {
        const taskToSave = task || { id: crypto.randomUUID(), label: value.trim(), checked: false };
        if (!taskToSave.label || !name) return;

        try {
            await api(`${DOMAIN}/addToDo`, {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    username: name,
                    todo: [JSON.stringify(taskToSave)]
                })
            });
            setItems((current) => [taskToSave, ...current]);
            setValue('');
        }
        catch (err) {
            console.error("Failed to add task:", err);
        }
    };


    const removeTask = async (itemToRemove) => {
            if (!name) return;
            try {
                const payload = itemToRemove.id.startsWith('legacy')
                    ? itemToRemove.label
                    : JSON.stringify(itemToRemove);

                await api(`${DOMAIN}/removeToDo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: name,
                        todo: [payload]
                    })
                });
                setItems((current) => current.filter((item) => item.id !== itemToRemove.id));
            }
            catch (err) {
                console.error("Failed to remove task:", err);
            }
        };

    const renderItemText = (item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.label) return item.label;
        return "Unknown Task";
    };

    const toggleTask = async (itemToToggle: ToDoItem) => {
        if (!name) return;
        const updated = {...itemToToggle, checked: !itemToToggle.checked};

        setItems(prev => [updated, ...prev.filter(i => i.id !== itemToToggle.id)]);

        try {
            await removeTask(itemToToggle, true);
            await addTask(updated);
        }
        catch (err) {
            getTasks();
        }

    };

    const pending = items.filter(i => !i.checked).length;
    const done = items.filter(i => i.checked).length;

    return (
        <Stack gap="md" h="100%" style={{ padding: '1.25rem' }}>
            <Group justify="space-between" align="center">
                <Group mb="md">
                    <Group gap="xs">
                        <IconClipboardList size={20} color="var(--yale-blue)" />
                        <Title order={3} style={{ color: 'var(--yale-blue)', margin: 0 }}>{t('task')}</Title>
                    </Group>
                    <HelpModal title={t("todo_list")} inline>
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
                                        }}>
                                        {renderItemText(item)}
                                    </Text>
                                }
                                onChange={() => toggleTask(item)}
                                color="var(--pacific-blue)" />
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
    );
}
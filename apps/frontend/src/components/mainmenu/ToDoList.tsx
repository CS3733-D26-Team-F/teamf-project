import { useState, useEffect } from "react";
import { useListState } from "@mantine/hooks";
import { ActionIcon, Badge, Button, Checkbox, Group, Paper, ScrollArea, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconTrash, IconClipboardList } from "@tabler/icons-react";
import {useTranslation} from "react-i18next";

interface ToDoItem {
    id: string;
    label: string;
    checked: boolean;
}

export function ToDoList() {
    const [value, setValue] = useState('');
    const [initialized, setInitialized] = useState(false);
    const [items, handlers] = useListState<ToDoItem>([]);
    const {t} = useTranslation();

    useEffect(() => {
        try {
            const saved = localStorage.getItem('todo-list');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) handlers.setState(parsed);
            }
        } catch (e) {
            console.error(t('todo_fail'), e);
        }
        setInitialized(true);
    }, []);

    useEffect(() => {
        if (initialized) {
            localStorage.setItem('todo-list', JSON.stringify(items));
        }
    }, [items, initialized]);

    const addTask = () => {
        if (value.trim()) {
            handlers.append({ id: Date.now().toString(), label: value, checked: false });
            setValue('');
        }
    };

    const pending = items.filter(i => !i.checked).length;
    const done = items.filter(i => i.checked).length;

    return (
        <div style={{height: '292px', width: '100%', minWidth: 0}}>
            <Paper
                withBorder
                p="md"
                radius="md"
                h="100%"
                w="100%"
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                <Stack gap="md" h="100%">
                    <Group justify="space-between" align="center">
                        <Group gap="xs">
                            <IconClipboardList size={20} color="var(--yale-blue)" />
                            <Title order={3} style={{ color: 'var(--yale-blue)', margin: 0, fontSize: '1.1rem' }}>
                                {t('task')}
                            </Title>
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

                    <ScrollArea offsetScrollbars style={{ flex: 1 }}>
                        <Stack gap="xs">
                            {items.length === 0 && (
                                <Text c="dimmed" size="sm" ta="center" mt="md">
                                    {t('no_task')}
                                </Text>
                            )}
                            {items.map((item, index) => (
                                <Paper
                                    key={item.id}
                                    withBorder
                                    p="xs"
                                    radius="sm"
                                    style={{
                                        borderColor: item.checked ? 'var(--light-gray)' : 'var(--pacific-blue)',
                                        opacity: item.checked ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Checkbox
                                            checked={item.checked}
                                            label={
                                                <Text
                                                    size="sm"
                                                    style={{
                                                        textDecoration: item.checked ? 'line-through' : 'none',
                                                        color: item.checked ? 'var(--light-gray)' : 'inherit',
                                                    }}
                                                >
                                                    {item.label}
                                                </Text>
                                            }
                                            onChange={(e) =>
                                                handlers.setItemProp(index, 'checked', e.currentTarget.checked)
                                            }
                                            color="var(--pacific-blue)"
                                        />
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={() => handlers.remove(index)}
                                        >
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </Paper>
        </div>
    );
}
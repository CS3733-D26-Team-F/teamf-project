import { Box, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { useState, useEffect, useRef } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FilledButton } from "../components/Buttons/FilledButton.tsx";
import { DOMAIN } from "../const";
import { useApi } from "../components/api.ts";
import {useTranslation} from "react-i18next";

interface NotificationProps {
    title: string;
    message: string;
    send_date: string | Date
    notid: number;
    importance: number | null;
    read: boolean;
    onToggleRead: (notid: number, read: boolean) => void;
    onDelete: (notid: number) => void;
}

function Notification({ title, message, send_date, importance: _importance, read, notid, onToggleRead, onDelete }: NotificationProps) {
    const {t} = useTranslation();
    const [opened, { open, close }] = useDisclosure(false);
    const [confirmed, { open: confirmOpen, close: confirmClose }] = useDisclosure(false);
    return (
        <Box
            mb="lg"
            style={{
                opacity: read ? 0.5 : 1 ,
                border: '1px solid #dee2e6',
                borderRadius: 8,
                padding: 16,
                background: 'white'
            }}
        >
            {/* Notification Title */}
            <Group 
                justify="space-between"
                style={{
                    padding: '0 0 1rem 0',
                }}
            >
                <Group>
                    <Text 
                        fw={700} 
                        size="xl" 
                        c="var(--color-yale-blue)"
                    >
                        {title}
                    </Text>

                    <Text
                        fw={400}
                        size="md"
                        c="var(--color-light-gray)"
                    >
                        {send_date.toString()}
                    </Text>
                </Group>

                <Group>
                    <FilledButton onClick={open}>
                        {t('view_noti')}
                    </FilledButton>

                    <Button variant="default" onClick={() => onToggleRead(notid, !read)}>
                        {read ? t('noti_unmark') : t('noti_mark')}
                    </Button>

                    <Button variant="default" onClick={confirmOpen} className="invert-hover-red">
                        {t('delete')}
                    </Button>

                </Group>
            </Group>

            <Modal
                opened={opened}
                onClose={close}
                size="xl"
                title={
                    <Group>
                        <Text fw={700} size="lg" c="var(--color-yale-blue)">
                            {title}
                        </Text>
                        <Text fw={400} size="md" c="var(--color-light-gray)">
                            {send_date.toString()}
                        </Text>
                    </Group>
                }
                centered
            >
                <Stack>
                    {message}
                </Stack>
            </Modal>

            <Modal
                opened={confirmed}
                onClose={confirmClose}
                size="xl"
                title={
                    <Text fw={700} size="lg" c="var(--color-yale-blue)">
                        {t('delete')}
                    </Text>
                }
                centered
            >
                <Stack>
                    <Text>{t('noti_delete_confirm_two')}</Text>
                    <Group justify="center" mt="md">
                        <Button variant="default" onClick={confirmClose}>{t("cancel")}</Button>
                        <Button className="invert-hover-red" onClick={() => {
                            confirmClose();
                            onDelete(notid);
                        }}>{t('delete')}</Button>
                    </Group>
                </Stack>
            </Modal>

            <Text style={{
               background: '#f8f9fa',
               borderRadius: 6,
               padding: '8px 12px'
            }}>
                {message}
            </Text>
        </Box>
    );
}

export function Notifications() {
    const [search, setSearch] = useState('');
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);
    const [loading, setLoading] = useState(true);
    const api = useApi();
    const fetched = useRef(false);
    const {t} = useTranslation();

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;

        const fetchNotifications = async () => {
            try {
                await api(`${DOMAIN}/notifications/check-expiring`);

                const response = await api(`${DOMAIN}/notifications`);
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [api]);

    const filteredNotifications = notifications.filter(n => 
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase())
    );

    const [markAllReadModalOpened, { open: openMarkAllRead, close: closeMarkAllRead }] = useDisclosure(false);
    const [clearAllModalOpened, { open: openClearAll, close: closeClearAll }] = useDisclosure(false);

    const handleMarkAllRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            const promises = unreadNotifications.map(n => 
                api(`${DOMAIN}/notifications/${n.notid}/read`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ read: true }),
                })
            );
            await Promise.all(promises);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            closeMarkAllRead();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleClearAll = async () => {
        try {
            const promises = notifications.map(n => 
                api(`${DOMAIN}/notifications/${n.notid}`, {
                    method: 'DELETE',
                })
            );
            await Promise.all(promises);
            setNotifications([]);
            closeClearAll();
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
        }
    };

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    const handleToggleRead = async (notid: number, read: boolean) => {
        try {
            console.log('[handleToggleRead] notid:', notid, 'read:', read);
            const response = await api(`${DOMAIN}/notifications/${notid}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read }),
            });

            console.log('[handleToggleRead] response ok:', response.ok);

            if (response.ok) {
                setNotifications(prev => prev.map(n => 
                    n.notid === notid ? { ...n, read } : n
                ));
            }
        } catch (error) {
            console.error(t('noti_fail_read'), error);
        }
    };

    const handleDelete = async (notid: number) => {
        try {
            const response = await api(`${DOMAIN}/notifications/${notid}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.notid !== notid));
            }
        } catch (error) {
            console.error(t('noti_fail_delete'), error);
        }
    };

    return (
        <>
            <Header />
            <PageTitle title={t("notifications")} />
            <Group justify="flex-end" p="md">
                <Button variant="default" onClick={openMarkAllRead}>
                    Mark All as Read
                </Button>
                <Button variant="default" className="invert-hover-red" onClick={openClearAll}>
                    Clear All
                </Button>
            </Group>

            <Modal
                opened={markAllReadModalOpened}
                onClose={closeMarkAllRead}
                size="xl"
                title={
                    <Text fw={700} size="lg" c="var(--color-yale-blue)">
                        Mark All as Read
                    </Text>
                }
                centered
            >
                <Stack>
                    <Text>Are you sure you want to mark all notifications as read?</Text>
                    <Group justify="center" mt="md">
                        <Button variant="default" onClick={closeMarkAllRead}>Cancel</Button>
                        <Button onClick={() => {
                            closeMarkAllRead();
                            handleMarkAllRead();
                        }}>Confirm</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={clearAllModalOpened}
                onClose={closeClearAll}
                size="xl"
                title={
                    <Text fw={700} size="lg" c="var(--color-yale-blue)">
                        Clear All Notifications
                    </Text>
                }
                centered
            >
                <Stack>
                    <Text>Are you sure you want to delete all notifications? This action cannot be undone.</Text>
                    <Group justify="center" mt="md">
                        <Button variant="default" onClick={closeClearAll}>Cancel</Button>
                        <Button className="invert-hover-red" onClick={() => {
                            closeClearAll();
                            handleClearAll();
                        }}>Delete All</Button>
                    </Group>
                </Stack>
            </Modal>

            <Box p="md">
                <TextInput 
                    placeholder= {t('noti_search')}
                    leftSection={<IconSearch size={16} />} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    mb="lg"
                />

                <Stack>
                    {loading 
                        ? (<Text>{t("noti_load")}</Text>)
                        : filteredNotifications.length === 0 
                            ? (<Text>{t('no_noti_found')}</Text>)
                            : (filteredNotifications.map((notification) => (
                                <Notification
                                    key={notification.notid}
                                    notid={notification.notid}
                                    title={notification.title}
                                    message={notification.message}
                                    send_date={formatDate(notification.send_date)}
                                    importance={notification.importance}
                                    read={notification.read}
                                    onToggleRead={handleToggleRead}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                </Stack>
            </Box>
        </>
    );
}

import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { useState, useEffect, useCallback, useRef } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FilledButton } from "../components/Buttons/FilledButton.tsx";
import { DOMAIN } from "../const";
import { useApi } from "../components/api.ts";

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
    const [opened, { open, close }] = useDisclosure(false);
    const [confirmed, { open: confirmOpen, close: confirmClose }] = useDisclosure(false);
    return (
        <Box
            mb="lg"
            style={{
                opacity: read ? 0.7 : 1 ,
                border: '1px solid #dee2e6',
                borderRadius: 8,
                padding: 16,
                background: read ? 'grey' : 'white'
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
                        View Notification
                    </FilledButton>

                    <Button variant="default" onClick={() => onToggleRead(notid, !read)}>
                        {read ? 'Mark Unread' : 'Mark as Read'}
                    </Button>

                    <Button variant="default" onClick={confirmOpen} className="invert-hover-red">
                        Delete
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
                        Confirm Deletion
                    </Text>
                }
                centered
            >
                <Stack>
                    <Text>Are you sure you want to delete this notification?</Text>
                    <Group justify="center" mt="md">
                        <Button variant="default" onClick={confirmClose}>Cancel</Button>
                        <Button color="red" onClick={() => {
                            confirmClose();
                            onDelete(notid);
                        }}>Delete</Button>
                    </Group>
                </Stack>
            </Modal>

            <Text style={{
               background: read ? 'var(--color-light-gray)' : '#f8f9fa',
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

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    const handleToggleRead = async (notid: number, read: boolean) => {
        try {
            const response = await api(`${DOMAIN}/notifications/${notid}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read }),
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => 
                    n.notid === notid ? { ...n, read } : n
                ));
            }
        } catch (error) {
            console.error('Failed to toggle read status:', error);
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
            console.error('Failed to delete notification:', error);
        }
    };

    const handleSendTestNotification = async () => {
        const empid = localStorage.getItem('empid');
        if (!empid) {
            console.error('User not logged in');
            return;
        }

        try {
            const response = await api(`${DOMAIN}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Notification',
                    message: `This is a test notification sent at ${new Date().toLocaleString()}`,
                    importance: 1,
                    recipientEmpids: [parseInt(empid)],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(prev => [data.notification, ...prev]);
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
        }
    };

    return (
        <>
            <Header />
            <PageTitle title="Notifications" />
            <FilledButton onClick={handleSendTestNotification}>
                Send Notification
            </FilledButton>
            <Box p="md">
                <TextInput 
                    placeholder="Search for notification..." 
                    leftSection={<IconSearch size={16} />} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    mb="lg"
                />

                <Stack>
                    {loading 
                        ? (<Text>Loading notifications...</Text>)
                        : filteredNotifications.length === 0 
                            ? (<Text>No notifications found.</Text>) 
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

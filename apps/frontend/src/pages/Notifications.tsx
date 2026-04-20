import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { useState, useEffect } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FilledButton } from "../components/Buttons/FilledButton.tsx";
import { DOMAIN } from "../const";

interface NotificationProps {
    title: string;
    message: string;
    send_date: string | Date
    notid: number;
    importance: number | null;
}

function Notification({ title, message, send_date, importance: _importance }: NotificationProps) {
    const [opened, { open, close }] = useDisclosure(false);
    return (
        <Box
            mb="lg"
            style={{
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
                        View Notification
                    </FilledButton>

                    <Button variant="default" onClick={() => {}}>
                        Mark as Read
                    </Button>
                </Group>
            </Group>

            <Modal
                opened={opened}
                onClose={close}
                size="xl"
                title={
                    <Group>
                        <Title
                            fw={700}
                            size="md"
                            c="var(--color-yale-blue)"
                        >
                            {title}
                        </Title>
                        <Text
                            fw={400}
                            size="md"
                            c="var(--color-light-gray)"
                        >
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

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${DOMAIN}/notifications`, {
                    credentials: 'include',
                });
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
    }, []);

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    return (
        <>
            <Header />
            <PageTitle title="Notifications" />
            <FilledButton>
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
                                />
                            ))
                        )}
                </Stack>
            </Box>
        </>
    );
}

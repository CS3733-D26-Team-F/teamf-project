import { Box, Group, Stack, Text, TextInput } from "@mantine/core";
import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { useState } from "react";
import { IconSearch, IconUser } from "@tabler/icons-react";
import { Modal } from "@mantine/core";

function Notification() {
    return (
        <Box
            mb="lg"
            style={{
                border: '1px solid #dee2e6',
                borderRadius: 8,
                padding: 16,
                background: 'white'
        }}>
            <Group>
                <Text 
                    fw={700} 
                    size="xl" 
                    c="var(--color-yale-blue)"
                >
                    Notification Title
                </Text>
                <Modal
                    opened={false}
                    onClose={() => {}}
                    title={
                        <Group>
                            <IconUser size={20} />
                            <Text fw={600}>View Notification</Text>
                        </Group>
                    }
                >
                    <Stack></Stack>
                </Modal>
            </Group>

            <Text style={{
               background: '#f8f9fa',
               borderRadius: 6,
               padding: '8px 12px'
            }}>
                Lorem ipsum dolor sit amet.
            </Text>
        </Box>
    );
}

export function Notifications() {
    const [search, setSearch] = useState('');

    return (
        <>
            <Header />
            <PageTitle title="Notifications" />
            <Box p="md">
                <TextInput 
                    placeholder="Search for notification..." 
                    leftSection={<IconSearch size={16} />} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    mb="lg"
                />

                <Stack>
                    <Notification />
                    <Notification />
                    <Notification />
                </Stack>
            </Box>
        </>
    );
}

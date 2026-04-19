import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { useState } from "react";
import { IconSearch, IconUser } from "@tabler/icons-react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FilledButton } from "../components/Buttons/FilledButton.tsx";

function Notification() {
    let exampleContent = "";
    for (let i = 0; i < 20; i++)
        exampleContent += "Lorem ipsum dolor sit amet. ";

    const [opened, { open, close }] = useDisclosure(false);
    return (
        <Box
            mb="lg"
            style={{
                border: '1px solid #dee2e6',
                borderRadius: 8,
                padding: 16,
                background: 'white'
        }}>
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
                        Notification Title
                    </Text>

                    <Text
                        fw={400}
                        size="md"
                        c="var(--color-light-gray)"
                    >
                        04/21/26
                    </Text>
                </Group>

                <Group>
                    <FilledButton onClick={open}>
                        View Notification
                    </FilledButton>

                    <Button variant="default" onClick={open}>
                        Mark as Read
                    </Button>
                </Group>
            </Group>

            <Modal
                opened={opened}
                onClose={close}
                title={
                    <Group>
                        <Title
                            fw={700}
                            size="md"
                            c="var(--color-yale-blue)"
                        >
                            Notification Title
                        </Title>
                        <Text
                            fw={400}
                            size="md"
                            c="var(--color-light-gray)"
                        >
                            04/21/26
                        </Text>
                    </Group>
                }
                centered
            >
                <Stack>
                    {exampleContent}
                </Stack>
            </Modal>

            <Text style={{
               background: '#f8f9fa',
               borderRadius: 6,
               padding: '8px 12px'
            }}>
                {exampleContent}
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

import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import ThemeToggle from "./ThemeToggle.tsx";

export function SettingsModal() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Modal opened={opened} onClose={close} title={
                <Text fw={700} size="xl" c="var(--color-yale-blue)">Settings</Text>
            }>
                <ThemeToggle />
            </Modal>

            <Button
                variant="default"
                onClick={open}
                className="invert-hover"
                bd="none"
            >
                <IconSettings color="var(--color-white)"/>
            </Button>
        </>
    );
}
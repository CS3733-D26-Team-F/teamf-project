import { Modal, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHelp } from "@tabler/icons-react";
import type { ReactNode } from "react";

type Props = {
    title: string;
    children: ReactNode;
    position?: 'top' | 'bottom';
};

export function HelpModal({ title, children, position = 'bottom' }: Props) {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Modal opened={opened} onClose={close} title={title}>
                {children}
            </Modal>
            <ActionIcon variant="subtle" color = "var(--light-gray)" onClick={open} style={{
                position: 'absolute',
                [position === 'top' ? 'top' : 'bottom']: 8,
                right: 8
            }}>
                <IconHelp />
            </ActionIcon>
        </>
    );
}
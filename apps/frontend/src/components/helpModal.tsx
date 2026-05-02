import { Modal, Group, Text } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';

type HelpProps = {
    title: string;
    opened: boolean;
    onClose: () => void;

    popupContent: React.ReactNode;
}

export function HelpModal(props: HelpProps) {
    return(
        <Modal
            opened={props.opened}
            onClose={props.onClose}
            title={
                <Group>
                    <IconHelp
                        size={20}
                        style={{
                            color: "var(--color-yale-blue)",
                        }}
                    />
                    <Text>{props.title}</Text>
                </Group>
            }
        >
            {props.popupContent}
        </Modal>
    );
}


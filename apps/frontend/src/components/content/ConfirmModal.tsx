import { Modal, Group, Button, Text } from '@mantine/core';

type ConfirmProps = {
    opened: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal(props: ConfirmProps) {
    return (
        <Modal opened={props.opened} onClose={props.onClose} title={props.title} centered>
            <Text size="sm" mb="md">{props.message}</Text>
            <Group justify="flex-end">
                <Button className="invert-hover-outline" onClick={props.onCancel}>Cancel</Button>
                <Button className="invert-hover" onClick={async () => await props.onConfirm()}>Confirm</Button>
            </Group>
        </Modal>
    )
}
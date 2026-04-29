import { Modal, Group, Button, Text } from '@mantine/core';
import {useTranslation} from "react-i18next";


type ConfirmProps = {
    opened: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal(props: ConfirmProps) {
    const {t} = useTranslation();
    return (
        <Modal opened={props.opened} onClose={props.onClose} title={props.title} centered>
            <Text size="sm" mb="md">{props.message}</Text>
            <Group justify="flex-end">
                <Button className="invert-hover-outline" onClick={props.onCancel}>{t('cancel')}</Button>
                <Button
                    className="invert-hover"
                    onClick={async () => {
                        console.debug('[ConfirmModal] Confirm clicked', { title: props.title });
                        await props.onConfirm();
                    }}
                >
                    {t('confirm')}
                </Button>
            </Group>
        </Modal>
    )
}
import { Modal } from '@mantine/core';

type HelpProps = {
    opened: boolean;
    sessionId: string | null;
    helpPopupSessionId: string | null;
    helpPopupContent: React.ReactNode;
    onClose: () => void;
}

export function HelpModal(props: HelpProps) {
    return(
        <Modal
            opened={props.opened}
            onClose={props.onClose}
            title="Help"
        >
            {props.helpPopupContent}
        </Modal>
    );
}


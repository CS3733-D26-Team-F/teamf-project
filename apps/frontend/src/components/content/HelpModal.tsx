import { Modal, Group, Button, Text } from '@mantine/core';

type HelpProps = {
    opened: boolean;
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
            {}
        </Modal>
    );
}


function generateHelpContent(sessionId: string | null): React.ReactNode {
    if(!sessionId) {
        return <Text size="sm">No help content available.</Text>;
    }

    if(sessionId === 'employeePage') {
        return (
            <div>
                <Text size="sm" mb="md">This is the employee page. Here you can view and edit your profile information, including your profile picture and personal details.</Text>
                <Text size="sm" mb="md">To update your profile picture, click on the current picture and follow the prompts to upload a new image.</Text>
                <Text size="sm" mb="md">Make sure to save any changes you make to your profile before navigating away from the page.</Text>
            </div>
        );
    }
    else if(sessionId === 'contentPage') {
        return(
            <div>
                <Text size="sm" mb="md">This is the content page. Here you can view and manage the content for your website.</Text>
                <Text size="sm" mb="md">To add new content, click the "Add Content" button and follow the prompts.</Text>
                <Text size="sm" mb="md">Make sure to save any changes you make before navigating away from the page.</Text>
            </div>
        );
    }
    
}

/*
helpPopupSessionID:
 - employee page
    
 - content page
*/
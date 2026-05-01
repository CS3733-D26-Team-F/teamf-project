import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { EmployeeListView } from "../components/ManageEmployees/ListView.tsx"
import { PageTitle } from "../components/Title.tsx";
import { usePersona } from "../hooks/usePersona";
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Group } from "@mantine/core";
import { HelpModal } from "../components/helpModal.tsx";
import { Text } from "@mantine/core";
import {useTranslation} from "react-i18next";
import { IconHelp } from "@tabler/icons-react";
import { useState } from "react";

export function ManageEmployeesForm() {
    const { t } = useTranslation();

    const [ openHelpModal, setOpenHelpModal ] = useState(false);

    // Persona from the auth/session layer determines whether the user is an Admin.
    const persona = usePersona();
    // Auth0 loading state is used so we can show a brief access-check message
    // before deciding whether to render the page or deny access.
    const { isLoading } = useAuth0();
    const {t} = useTranslation();

    // Allow access if the current persona is Admin; localStorage is used as a fallback
    // for cases where the session state is still being resolved.
    const allowedAccess = persona === 'Admin' || localStorage.getItem('persona') === 'Admin';

    // While Auth0 is still resolving and we do not yet know the final access result,
    // show a lightweight loading state instead of flashing the wrong screen.
    if (isLoading && !allowedAccess) {
        return (
            <>
                <Header />
                <PageTitle title={t('employees')} />
                <p style={{ textAlign: 'center' }}>Checking access...</p>
            </>
        );
    }

    // Admin users get the employee management list view.
    if (allowedAccess) {
        return (
            <>
                <title>
                    {t('employees')} - Hanover Insurance
                </title>
                <Header />
                <Group>
                    <PageTitle title={t('employees')} />
                    <Button
                        variant="default"
                        onClick={() => setOpenHelpModal(true)}
                    >
                        <IconHelp />
                    </Button>
                </Group>

                <HelpModal
                    title={t('employee_page')}
                    opened={openHelpModal}
                    onClose={() => setOpenHelpModal(false)}
                    popupContent={t('emp_help_content')}
                                  />
                <PageTitle title={t('employees')}/>
                <EmployeeListView />
            </>
        );
    } else {
        // Non-admin users are blocked from this page.
        return <AccessDenied />;
    }
}

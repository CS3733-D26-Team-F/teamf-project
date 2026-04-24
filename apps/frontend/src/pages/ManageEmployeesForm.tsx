import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { EmployeeListView } from "../components/ManageEmployees/ListView.tsx"
import { PageTitle } from "../components/Title.tsx";
import { usePersona } from "../hooks/usePersona";
import { useAuth0 } from "@auth0/auth0-react";

export function ManageEmployeesForm() {
    // Persona from the auth/session layer determines whether the user is an Admin.
    const persona = usePersona();
    // Auth0 loading state is used so we can show a brief access-check message
    // before deciding whether to render the page or deny access.
    const { isLoading } = useAuth0();

    // Allow access if the current persona is Admin; localStorage is used as a fallback
    // for cases where the session state is still being resolved.
    const allowedAccess = persona === 'Admin' || localStorage.getItem('persona') === 'Admin';

    // While Auth0 is still resolving and we do not yet know the final access result,
    // show a lightweight loading state instead of flashing the wrong screen.
    if (isLoading && !allowedAccess) {
        return (
            <>
                <Header />
                <PageTitle title="Employees"/>
                <p style={{ textAlign: 'center' }}>Checking access...</p>
            </>
        );
    }

    // Admin users get the employee management list view.
    if (allowedAccess) {
        return (
            <>
                <title>
                    Employees - Hanover Insurance
                </title>
                <Header />
                <PageTitle title="Employees"/>
                <EmployeeListView />
            </>
        );
    } else {
        // Non-admin users are blocked from this page.
        return <AccessDenied />;
    }
}
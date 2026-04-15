import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { EmployeeListView } from "../components/ManageEmployees/ListView.tsx"
import { PageTitle } from "../components/Title.tsx";
import { usePersona } from "../hooks/usePersona";
import { useAuth0 } from "@auth0/auth0-react";

export function ManageEmployeesForm() {
    const persona = usePersona();
    const { isLoading } = useAuth0();

    const allowedAccess = persona === 'Admin' || localStorage.getItem('persona') === 'Admin';

    if (isLoading && !allowedAccess) {
        return (
            <>
                <Header />
                <PageTitle title="Employees"/>
                <p style={{ textAlign: 'center' }}>Checking access...</p>
            </>
        );
    }

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
        return <AccessDenied />;
    }
}
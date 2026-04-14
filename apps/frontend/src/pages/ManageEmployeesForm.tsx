import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { EmployeeListView } from "../components/ManageEmployees/ListView.tsx"
import { PageTitle } from "../components/Title.tsx"

export function ManageEmployeesForm() {
    const allowedAccess = localStorage.getItem('persona') === 'Admin';
    if (allowedAccess) {
        return (
            <>
                <title>
                    Employee - Hanover Insurance
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
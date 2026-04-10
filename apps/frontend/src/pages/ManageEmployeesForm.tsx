import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { EmployeeListView } from "../components/ManageEmployees/ListView.tsx"
import { EmployeesTitle } from "../components/ManageEmployees/Title.tsx";

export function ManageEmployeesForm() {
    const allowedAccess = localStorage.getItem('persona') === 'Admin';
    if (allowedAccess) {
        return (
            <>
                <Header />
                <EmployeesTitle />
                <EmployeeListView />
            </>
        );
    } else {
        return <AccessDenied />;
    }
}
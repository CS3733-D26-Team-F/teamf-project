import '@mantine/core/styles.css';
import { useEffect, useState } from "react";
import { ListView } from "../ListView.tsx";
import { Badge } from '@mantine/core';

type Employee = {
    empid: number;
    first_name: string;
    last_name: string;
    username: string;
    persona: string;
}

const personas = ["Admin", "Underwriter", "Business Analyst"];


export function EmployeeListView() {
    const [employees, setEmployee] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch("http://localhost:3000/employees")
        .then(res => res.json())
        .then(data => setEmployee(data))
            .finally(() => setLoading(false));
    }, [])

    const personaColors: Record<string, string> = {
        "Admin": "var(--yale-blue)",
        "Underwriter": "var(--pale-sky)",
        "Business Analyst": "var(--fresh-sky)",
    };

    const getPersonaColor = (persona: string) =>
        personaColors[persona] ?? "gray";

    return (
        <ListView<Employee>
            data={employees}
            columns={[
                { key: "first_name", label: "First Name", sortable: true },
                { key: "last_name", label: "Last Name", sortable: true },
                { key: "username", label: "Username", sortable: true },
                {
                    key: "persona",
                    label: "Persona",
                    sortable: true,
                    renderCell: (row) => (
                        <Badge color={getPersonaColor(row.persona)} variant="light">
                            {row.persona}
                        </Badge>
                    ),
                },
            ]}
        />
    )
}
import '@mantine/core/styles.css';
import {Loader, Center, Text, List, ThemeIcon} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { useEffect, useState } from "react";

type Employee = {
    empid: number;
    username: string;
    persona: string;
}

export function EmployeeListView() {
    const [employees, setEmployee] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("http://localhost:3000/employees")
        .then(res => res.json())
        .then(data => setEmployee(data))
            .finally(() => setLoading(false));
    }, [])

    if (loading) {
        return (
            <Center mt="xl">
                <Loader />
            </Center>
        )
    }

    return (
        <List
            spacing="lg"
            icon={
                <ThemeIcon color="blue" size={28} radius="xl">
                    <IconUser size={18} />
                </ThemeIcon>
            }
        >
            {employees.map((emp) => (
                <List.Item key={emp.empid}>
                    <Text fw={600}>{emp.username}</Text>
                    <Text size="sm" c="dimmed">
                        {emp.persona}
                    </Text>
                </List.Item>
            ))}
        </List>
    )
}
import '@mantine/core/styles.css';
import {Loader, Center, Text, Table} from "@mantine/core";
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
        <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>
                        <Text fw={700} size="lg" c="var(--color-yale-blue)">Username</Text>
                    </Table.Th>
                    <Table.Th>
                        <Text fw={700} size="lg" c="var(--color-yale-blue)">Persona</Text>
                    </Table.Th>
                </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
                {employees.map((emp) => (
                    <Table.Tr key={emp.empid}>
                        <Table.Td>
                            <Text fw={600}>{emp.username}</Text>
                        </Table.Td>
                        <Table.Td>{emp.persona}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
            </Table>
    )
}
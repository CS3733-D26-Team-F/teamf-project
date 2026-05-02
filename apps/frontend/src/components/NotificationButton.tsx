import {Button, Group, Modal, MultiSelect, Stack, Textarea, TextInput} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import { FaPlus } from "react-icons/fa";
import { useForm } from '@mantine/form';
import {useEffect, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";


export function NotificationButton() {
    const [opened, {open, close}] = useDisclosure(false);
    const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
    // const name = localStorage.getItem('username');
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const res = await fetch('/api/employees');
                const data = await res.json();

                if (!data || !Array.isArray(data)) {
                    console.error("Data is not an array:", data);
                    return;
                }

                const newEmployeeList = [];

                for (const emp of data) {
                    if (emp.empid && emp.first_name) {
                        newEmployeeList.push({
                            value: String(emp.empid),
                            label: `${emp.first_name} ${emp.last_name}`
                        });
                    }
                }

                setEmployees(newEmployeeList);
            } catch (err) {
                console.error("Fetch failed:", err);
            }
        };

        loadEmployees();
    }, []);

    const form = useForm({
        initialValues: {
            title: '',
            message: '',
            recipientEmpids: [] as string[],
        },
    })

    const handleSubmit = async (values: typeof form.values) => {
        const token = await getAccessTokenSilently();

        const payload = {
            title: values.title,
            message: values.message,
            recipientEmpids: values.recipientEmpids.map(Number),
            importance: 1
        };

        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                form.reset();
                close();
            }
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    };

    return (
        <>
            <Modal opened={opened} onClose={close} title={"Send New Notification"} centered>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <TextInput
                            label="Notification Title"
                            placeholder="Enter Title"
                            required {...form.getInputProps('title')}
                        />
                        <Textarea
                            label="Message"
                            placeholder="Enter Message"
                            required {...form.getInputProps('message')}
                        />
                        <MultiSelect
                            label="Reciever"
                            placeholder="Select Employees"
                            data={employees || []}
                            searchable
                            nothingFoundMessage="No employees found"
                            {...form.getInputProps('recipientEmpids')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={close} style={{color:'var(--yale-blue)'}} >
                                Cancel
                            </Button>
                            <Button type="submit" style={{backgroundColor: 'var(--yale-blue)'}}>
                                Send
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Button
                className="invert-hover"
                onClick={open}
                style={{
                    marginLeft: '24px',
                    width: '42px',
                    padding: 0
                }}
            >
                <FaPlus />
            </Button>
        </>
    );
}
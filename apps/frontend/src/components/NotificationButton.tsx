import {Button, Group, Modal, MultiSelect, Stack, Textarea, TextInput} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import { FaPlus } from "react-icons/fa";
import { useForm } from '@mantine/form';
import {useEffect, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {useTranslation} from "react-i18next";
import {useApi} from "./api.ts";
import {DOMAIN} from "../const.ts";


export function NotificationButton() {
    const [opened, {open, close}] = useDisclosure(false);
    const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
    const {t} = useTranslation();
    const { getAccessTokenSilently } = useAuth0();
    const api = useApi();

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const res = await api(`${DOMAIN}/employees`);
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
        //const token = await getAccessTokenSilently();

        const payload = {
            title: values.title,
            message: values.message,
            recipientEmpids: values.recipientEmpids.map(Number),
            importance: 1
        };

        try {
            const response = await api(`${DOMAIN}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
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
            <Modal opened={opened} onClose={close} title={t('send_new_noti')} centered>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <TextInput
                            label={t('noti_title')}
                            placeholder={t('noti_title_fill')}
                            required {...form.getInputProps('title')}
                        />
                        <Textarea
                            label={t('noti_message')}
                            placeholder={t('noti_message_filler')}
                            required {...form.getInputProps('message')}
                        />
                        <MultiSelect
                            label={t('noti_reciever')}
                            placeholder={t('noti_reciever_filler')}
                            data={employees || []}
                            searchable
                            nothingFoundMessage="No employees found"
                            {...form.getInputProps('recipientEmpids')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={close} style={{color:'var(--yale-blue)'}} >
                                {t('cancel')}
                            </Button>
                            <Button type="submit" style={{backgroundColor: 'var(--yale-blue)'}}>
                                {t('send')}
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
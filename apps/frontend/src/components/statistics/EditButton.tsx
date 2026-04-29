import {Button, Drawer, MultiSelect, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks";
import {useEffect, useState } from "react";
import {useTranslation} from "react-i18next";

interface EditButtonProps {
    activeWidgets: string[];
    onSave: (newLayout: string[]) => void;
    allWidgets: Record<string, { labelKey: string; component?: React.ReactNode }>;
    setIsEditing?: (value: boolean) => void;
}

export function EditButton({ activeWidgets=[], onSave, allWidgets={}, setIsEditing }: EditButtonProps) {
    const {t} = useTranslation();
    const [opened, { open, close }] = useDisclosure(false);

    useEffect(() => {
        if (setIsEditing) {
            setIsEditing(opened);
        }
    }, [opened, setIsEditing]);
    const [selected, setSelected] = useState<string[]>(activeWidgets);

    useEffect(() => {
        if (activeWidgets && activeWidgets.length > 0) {
            setSelected(activeWidgets);
        }
    }, [activeWidgets]);

    const selectData = Object.entries(allWidgets).map(([key, value]) => ({
        value: key,
        label: value.labelKey,
    }));

    return(
        <div style={{ textAlign: 'right', margin: '24px' }}>
            <Drawer opened={opened} onClose={close} title={t('edit_stats')}>
                <Stack>
                    <MultiSelect
                        label={t('widgets')}
                        data={selectData}
                        value={selected}
                        onChange={setSelected}
                    />
                    <Button style={{ backgroundColor: 'var(--yale-blue)' }} onClick={() => {
                        console.log(t('save_keys'), selected);
                        onSave(selected);
                        close();
                    }}>
                        {t('save_change')}
                    </Button>
                </Stack>
            </Drawer>
            <Button onClick={open} style={{ backgroundColor: 'var(--yale-blue)' }}>{t('edit_layout')}</Button>
        </div>
    );
}
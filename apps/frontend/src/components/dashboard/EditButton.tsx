import {Button, Drawer, MultiSelect, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks";
import {useEffect, useState } from "react";

interface EditButtonProps {
    activeWidgets: string[];
    onSave: (newLayout: string[]) => void;
    allWidgets: Record<string, { label: string }>;
}

export function EditButton({ activeWidgets=[], onSave, allWidgets={} }: EditButtonProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const [selected, setSelected] = useState<string[]>(activeWidgets);

    useEffect(() => {
        if (activeWidgets && activeWidgets.length > 0) {
            setSelected(activeWidgets);
        }
    }, [activeWidgets]);

    const selectData = Object.entries(allWidgets).map(([key, value]) => ({
        value: key,
        label: value.label,
    }));

    return(
        <div style={{ textAlign: 'right', margin: '24px' }}>
            <Drawer opened={opened} onClose={close} title="Edit Dashboard">
                <Stack>
                    <MultiSelect
                        label="Widgets"
                        data={selectData}
                        value={selected}
                        onChange={setSelected}
                    />
                    <Button onClick={() => {
                        console.log("Saving these keys:", selected);
                        onSave(selected);
                        close();
                    }}>
                        Save Changes
                    </Button>
                </Stack>
            </Drawer>
            <Button onClick={open}>Edit Layout</Button>
        </div>
    );
}
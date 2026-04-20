import '@mantine/core/styles.css';
import {
    TextInput, Button, Group, Stack
} from '@mantine/core';
import {useState} from "react";
import {DOMAIN} from "../../const.ts";
import { useApi } from "../api.ts"

export function ManageTags() {
    const api = useApi();

    const [createTag, setCreateTag] = useState<string>("");
    const [deleteTag, setDeleteTag] = useState<string>("");


    async function runCreateTag() {
        console.log("add", createTag);
        await api(`${DOMAIN}/newtag`, {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({name: createTag}) });
        setCreateTag("");
    }

    async function runDeleteTag() {
        console.log("del", deleteTag)
        await api(`${DOMAIN}/deletetag`, {method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({name: deleteTag}) });
        setDeleteTag("");
    }

    return(
        <Stack>
        <Group>
            <TextInput label="Enter a New Tag" value={createTag} onChange={e => setCreateTag(e.target.value)}/>
            <Button className="invert-hover" onClick={runCreateTag} > Create Tag</Button>
        </Group>
        <Group>
            <TextInput label="Enter a tag to Delete" value={deleteTag} onChange={e => setDeleteTag(e.target.value)}/>
            <Button className="invert-hover" onClick={runDeleteTag} > Delete Tag</Button>
        </Group>
    </Stack>
    )
}
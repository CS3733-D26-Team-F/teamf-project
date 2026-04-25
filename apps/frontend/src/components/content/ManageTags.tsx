import '@mantine/core/styles.css';
import {
    TextInput, Button, Group, Stack, Select
} from '@mantine/core';
import {useState} from "react";
import {DOMAIN} from "../../const.ts";
import { useApi } from "../api.ts"
import type {Metatag} from "../interfaces/DocumentsInterfaces.tsx";

interface ManageTagsProps {
    allTags: string[];
}

export function ManageTags({allTags}: ManageTagsProps) {
    const api = useApi();

    const [createTag, setCreateTag] = useState<string>("");
    const [deleteTag, setDeleteTag] = useState<string>("");

    const [currentTags, setCurrentTags] = useState<string[]>([]);

    async function updateTags() {
        const response = await api(`${DOMAIN}/getTags`)
        const object: Metatag[] = await response.json();
        const tags: string[] = (object.data).map(tag => tag.tag_name);
        setCurrentTags(tags);
    }

    function getCurrentTags() {
        if (currentTags.length === 0) setCurrentTags(allTags);
        return currentTags
    }

    async function runCreateTag() {
        await api(`${DOMAIN}/newtag`, {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({name: createTag}) });
        await updateTags();
        setCreateTag("");

    }

    async function runDeleteTag() {
        await api(`${DOMAIN}/deletetag`, {method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({name: deleteTag}) });
        await updateTags();
        setDeleteTag(null);
    }

    return(
        <Stack>
            <label>
                Enter a New Tag:
                <Group>
                    <TextInput label="" value={createTag} onChange={e => setCreateTag(e.target.value)}/>
                    <Button className="invert-hover" onClick={runCreateTag} > Create Tag</Button>
                </Group>
            </label>
            <label>
                Enter a tag to Delete
                <Group>
                    <Select label="" placeholder="Select a Tag" value={deleteTag}
                                 onChange={val => setDeleteTag(val ?? "")} data={getCurrentTags()} />
                    <Button className="invert-hover" onClick={runDeleteTag} > Delete Tag</Button>
                </Group>
            </label>
    </Stack>
    )
}

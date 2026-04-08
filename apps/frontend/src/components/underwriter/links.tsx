
import {LinksWithProps, type MenuItem} from "../links/LinkBubbles.tsx";
import {useEffect, useState} from "react";

export function LinksDemo() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const persona = localStorage.getItem("persona");
    useEffect(() => {
        async function loadContent() {
            const res = await fetch(`http://localhost:3000/contentforms/persona/${persona}`);
            const data = await res.json();

            const mapped: MenuItem[] = data.map((item: any) => ({
                id: item.id,
                label: item.name,
                path: item.url
            }));
            setItems(mapped);
        }
        loadContent()
    }, [persona]);

    async function deleteItem(id: number) {
        const confirmed = window.confirm("Are you sure you want to delete this item?");
        if (!confirmed) return;

        await fetch(`http://localhost:3000/contentforms/${id}`, {
            method: "DELETE"
        });

        setItems(prev => prev.filter(item => item.id !== id));
    }

    return (
        <LinksWithProps
            items={items}
            col_lg={3}
            onDelete={deleteItem}/>
    );
}
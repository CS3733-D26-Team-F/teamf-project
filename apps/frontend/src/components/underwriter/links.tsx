
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
                label: item.name,
                path: item.url
            }));
            setItems(mapped);
        }
        loadContent()
    }, [persona]);
    return (
        <LinksWithProps items={items} col_lg={3}/>
    );
}
import {LinksWithProps, type MenuItem} from "../links/LinkBubbles.tsx";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

export function LinksDemo() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const persona = localStorage.getItem("persona");
    //const empid = localStorage.getItem("empid");
    const navigate = useNavigate();
    useEffect(() => {
        async function loadContent() {
            let data = []
            if (persona === 'Admin') {
                const res = await fetch(`http://localhost:3000/contentforms/persona/Underwriter`);
                data = await res.json();
            } else {
                const res = await fetch(`http://localhost:3000/contentforms/persona/${persona}`);
                data = await res.json();
            }
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

    function editItem(id: number) {
        navigate(`/managecontent?edit=${id}`);
    }
    return (
        <LinksWithProps
            items={items}
            col_lg={3}
            onDelete={deleteItem}
            onEdit={editItem}/>
    );
}
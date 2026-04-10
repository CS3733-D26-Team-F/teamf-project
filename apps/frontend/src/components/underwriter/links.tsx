import {LinksWithProps, type MenuItem} from "../links/LinkBubbles.tsx";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

export function LinksDemo() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const persona = localStorage.getItem("persona");
    const [fileType, setfileType] = useState<string>();
    const [allItems, setAllItems] = useState<MenuItem[]>([]);

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
            setAllItems(mapped);
            setItems(mapped);
        }
        loadContent()
    }, [persona]);

    const handleFilter = async (selectedType: string) => {
        setfileType(selectedType);
        if (!selectedType) {
            setItems(allItems);
            return;
        }
        const response = await fetch(`http://localhost:3000/contentforms/filter/${persona}/${selectedType}`);
        const data = await response.json();
        const mapped: MenuItem[] = data.map((item: any) => ({
            id: item.id,
            label: item.name,
            path: item.url
        }));
        setItems(mapped);
    };

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
        <>
            <select value={fileType} onChange={(e) => handleFilter(e.target.value)}>
                <option value="">All</option>
                <option value="pdf">PDF</option>
                <option value="xls">XLS</option>
                <option value="xlsx">XLSX</option>
                <option value="doc">DOC</option>
                <option value="docx">DOCX</option>
                <option value="csv">CSV</option>
            </select>
            <LinksWithProps
                items={items}
                col_lg={3}
                onDelete={deleteItem}
                onEdit={editItem}
            />
        </>
    );
}
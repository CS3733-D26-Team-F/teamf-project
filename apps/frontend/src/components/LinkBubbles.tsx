import {type ReactNode, useEffect, useState} from "react";
import { Link } from "react-router-dom";

export type MenuItem = {
    label: string;
    path: string;
};

type LinkProps = {
    items: MenuItem[];
    col_lg: number;

};

const colMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
};

export function LinksWithProps(props: LinkProps) {

    return (
        <div className="w-full flex justify-center">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${colMap[props.col_lg]} gap-6 w-full max-w-5xl`}>
                {props.items.map((item, i) => {
                    const card = (
                        <div
                            key={i}
                            className="
                            flex flex-col items-center justify-center
                            bg-pale-sky rounded-xl p-6 px-6 shadow
                            hover:bg-gray-300 hover:shadow-lg
                            transition-all duration-200 cursor-pointer
                            h-48 sm:h-56 lg:h-64
                        "
                        >
                            <br/>
                            <h3 className="text-center font-semibold text-yale-blue">
                                {item.label}
                            </h3>
                        </div>
                    );

                    return item.path ? (
                        <Link key={i} to={item.path}>
                            {card}
                        </Link>
                    ) : (
                        <div key={i}>{card}</div>

                    );
                })}
            </div>
        </div>
    )
}

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
        loadContent();
    }, [persona]);
    return (
        <LinksWithProps items={items} col_lg={3}/>
    );
}



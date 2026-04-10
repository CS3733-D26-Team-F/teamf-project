import {useState} from "react";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import DocViewer, {DocViewerRenderers} from "@iamjariwala/react-doc-viewer";


export type MenuItem = {
    id: number;
    label: string;
    path: string;
};

type LinkProps = {
    items: MenuItem[];
    col_lg: number;
    onDelete: (id: number) => void;
    onEdit: (id: number) => void;
};

const colMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
};

export function LinksWithProps(props: LinkProps) {
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string>('');

    function openViewer(url: string, label: string) {
        setSelectedUrl(url);
        setSelectedLabel(label);
    }

    function closeViewer() {
        setSelectedUrl(null);
        setSelectedLabel('');
    }

    return (
        <>
            {/* Popup viewer */}
            {selectedUrl && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={closeViewer}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-4/5 h-4/5 flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-4 py-2 border-b">
                            <h2 className="text-lg font-bold text-yale-blue">{selectedLabel}</h2>
                            <button
                                onClick={closeViewer}
                                className="text-gray-500 hover:text-gray-800 text-xl font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <DocViewer
                                documents={[{ uri: selectedUrl, fileName: selectedLabel }]}
                                pluginRenderers={DocViewerRenderers}
                                style={{ height: '100%' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Cards grid */}
            <div className="w-full flex justify-center">
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${colMap[props.col_lg]} gap-6 w-full max-w-5xl`}>
                    {props.items.map((item, i) => (
                        <div
                            key={i}
                            onClick={() => item.path && openViewer(item.path, item.label)}
                            className="
                                relative
                                flex flex-col items-center justify-center
                                bg-pale-sky rounded-xl p-6 px-6 shadow
                                hover:bg-gray-300 hover:shadow-lg
                                transition-all duration-200 cursor-pointer
                                h-48 sm:h-56 lg:h-64
                            "
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    props.onEdit(item.id);
                                }}
                                className="absolute bottom-3 left-3 bg-yale-blue text-fresh-sky px-3 py-1 rounded hover:bg-fresh-sky hover:text-yale-blue"
                            >
                                Edit
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    props.onDelete(item.id);
                                }}
                                className="absolute bottom-3 right-3 bg-yale-blue text-fresh-sky px-3 py-1 rounded hover:bg-fresh-sky hover:text-yale-blue"
                            >
                                Delete
                            </button>

                            <h3 className="text-center text-3xl font-bold text-yale-blue">
                                {item.label}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
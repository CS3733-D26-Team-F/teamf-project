export type ContentForm = {
    id: number;
    name: string;
    file_name: string;
    url: string;
    owner: string;
    persona: string[];
    date_modified: string;
    expiration_date: string;
    content_type: string;
    status: string;
    is_favorite: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
};

export interface RowCallbacks {
    persona: string | null;
    onView: (url: string, label: string, id: number, isUrl: boolean) => void;
    onFavorite: (doc: ContentForm) => void;
    onDownload: (url: string, name: string) => void;
    onEdit: (doc: ContentForm) => void;
    onDelete: (id: number) => void;
}

export interface SortThProps {
    field: keyof ContentForm;
    label: string;
    icon: React.ReactNode;
    onToggle: (f: keyof ContentForm) => void;
    currentField: keyof ContentForm | null;
    currentDir: 'asc' | 'desc';
}
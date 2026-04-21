export type ContentForm = {
    folder: string;
    id: number;
    name: string;
    file_name: string;
    url: string;
    owner: string;
    persona: string[];
    date_modified: string;
    expiration_date: string;
    content_type: string;
    review_date: string;
    status: string;
    folder_id: number | null;
    is_favorite: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
    jointagscontent: string[];
};

export type Folder = {
    id: number;
    name: string;
    owner: string;
    persona: string[]; // Access control based on user roles, can be null or empty for public folders or specific access lists
    associated_docsIDs: number[]; // List of document IDs that are contained within this folder
    date_modified: string;
    url: string;
};

export type StagedFile = {
    id: string;
    file: File;
    name: string;
    owner: string;
    persona: string[];
    content_type: string;
    status: string;
    folder_id: number | null;
    date_modified: string;
    expiration_date: string;
    review_date: string;
};

export type Employee = {
    empid: number;
    username: string;
    persona: string;
};

export type Metatag = {
    metid: number;
    tag_name: string;
};

export interface RowCallbacks {
    persona: string | null;
    onView: (url: string, label: string, id: number, isUrl: boolean) => void;
    onFavorite: (doc: ContentForm) => void;
    onDownload: (url: string, name: string) => void;
    onEdit: (doc: ContentForm) => void;
    onDelete: (id: number) => void;
}

export interface RowCallbacks {
    persona: string | null;
    onView: (url: string, label: string, id: number, isUrl: boolean) => void;
    onFavorite: (doc: ContentForm) => void;
    onDownload: (url: string, name: string) => void;
    onEdit: (doc: ContentForm) => void;
    onDelete: (id: number) => void;
}
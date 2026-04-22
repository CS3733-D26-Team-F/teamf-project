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
    review_date: string;
    status: string;
    is_favorite: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
    jointagscontent: string[];
};

export type StagedFile = {
    id: string;
    file: File;
    name: string;
    owner: string;
    persona: string[];
    content_type: string;
    status: string;
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
    isFavorited: (id: number) => boolean;
}

export interface RowCallbacks {
    persona: string | null;
    onView: (url: string, label: string, id: number, isUrl: boolean) => void;
    onFavorite: (doc: ContentForm) => void;
    onDownload: (url: string, name: string) => void;
    onEdit: (doc: ContentForm) => void;
    onDelete: (id: number) => void;
}
import type { Folder } from "../components/interfaces/DocumentsInterfaces";

export function Folders(){
    function createFolder(name: string, owner: string, persona: string[], associated_docsIDs: number[], date_modified: string, url: string): Folder {
        return {
            id: Date.now(), // Temporary ID generation, replace with backend-generated ID
            name,
            owner,
            persona,
            associated_docsIDs,
            date_modified,
            url
        };
    }

    function updateFolder(folder: Folder, updates: Partial<Omit<Folder, 'id'>>): Folder {
        return {
            ...folder,
            ...updates,
            date_modified: new Date().toISOString() // Update modification date on any change
        };
    }

    function deleteFolder(folderId: number, folders: Folder[]): Folder[] {
        return folders.filter(folder => folder.id !== folderId);
    }
}









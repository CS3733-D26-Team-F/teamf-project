import { ListViewTable } from '@gfazioli/mantine-list-view-table';

type ListViewData<T> = {
    data: T[];
    columns: { key: keyof T; label: string }[];
};

export function ListView<T>(props: ListViewData<T>) {
    return (
        <ListViewTable
            columns={props.columns}
            data={props.data}
            rowKey="id"
            withTableBorder
            highlightOnHover
            stickyHeader
            stickyHeaderOffset={60}
            headerTitleFontWeight={700}
        />
    );
}
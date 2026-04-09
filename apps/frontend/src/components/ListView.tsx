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
            withColumnBorders
            highlightOnHover
            horizontalSpacing={{ base: 'xs', md: 'sm', lg: 'md' }}
            verticalSpacing={{ base: 'xs', md: 'sm' }}
            headerTitleFontSize={{ base: 'xs', md: 'sm' }}
            headerTitleFontWeight={{ base: 500, lg: 600 }}
            cellFontSize={{ base: 'xs', md: 'sm' }}
            onRowClick={(record) => {
                alert(`Clicked: ${record.name}`);
            }}
        />
    );
}
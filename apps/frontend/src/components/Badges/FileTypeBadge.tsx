import {Badge} from "@mantine/core";

type FileTypeBadgeProps = {
    fileType: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function FileTypeBadge(props: FileTypeBadgeProps) {
    return (
        <Badge variant="outline" size={props.size}>{props.fileType}</Badge>
    )
}
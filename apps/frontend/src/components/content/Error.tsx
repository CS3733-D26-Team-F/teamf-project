import {Text} from "@mantine/core";

type ErrorProps = {
    message: string;
}
export function Error(props: ErrorProps) {
    return (
        <Text c="var(--color-neutral-red)" size="sm" ta="right">{props.message}</Text>
    )
}
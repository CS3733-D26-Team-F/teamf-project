import { Title } from "@mantine/core";

type TitleProps = {
    title: string;
}

export function PageTitle(props: TitleProps) {
    return (
        <Title
            order={1}
            ta="left"
            fw={10000}
            style={{ color: "var(--color-yale-blue)", fontFamily: "Roboto, sans-serif", padding: "28px"}}
        >
            {props.title}
        </Title>
    )
}
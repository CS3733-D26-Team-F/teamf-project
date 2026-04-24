import {Header} from "../components/Header.tsx";
import {PageTitle} from "../components/Title.tsx";
import {Center, Group, Stack, Text} from "@mantine/core";

export function Credit() {

    return (
        <>
            <title>
                About - Hanover Insurance
            </title>
            <Header />
            <PageTitle title="Credits"/>
            <Stack m={20} gap={40}>
                <Text size={"xl"}>
                    We utilized the PERN stack for this project.
                </Text>
                <br/>
                <Text size={"xl"}>
                    Our Tools Used:
                </Text>
            </Stack>
        </>
    )
}
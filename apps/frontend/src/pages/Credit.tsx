import {Header} from "../components/Header.tsx";
import {PageTitle} from "../components/Title.tsx";
import {Center, Group, Stack, Text} from "@mantine/core";
import {CreditCard} from "../components/CreditCard.tsx";

export function Credit() {

    const imageGap = 40;

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
                <Center>
                    <Stack gap={imageGap}>
                        <Group gap={imageGap}>
                            <CreditCard
                                tool="Github"
                                description="Github version 3.5.5"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                            <CreditCard
                                tool="Webstorm"
                                description="Webstorm version 25.5.3"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                            <CreditCard
                                tool="Tailwind"
                                description="Olsen"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                            <CreditCard
                                tool="Postman"
                                description="Olsen"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                            <CreditCard
                                tool="Postman"
                                description="Olsen"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                            <CreditCard
                                tool="Postman"
                                description="Olsen"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                        </Group>
                        <Group gap={imageGap}>
                            <CreditCard
                                tool="Postman"
                                description="Olsen"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                            <CreditCard
                                tool="Postman"
                                description="Olsen"
                                url="https://www.postman.com/login"
                                logo="https://www.postman.com/img/logo-white.svg">
                            </CreditCard>
                        </Group>
                    </Stack>
                </Center>
                <br/>
            </Stack>
        </>
    )
}
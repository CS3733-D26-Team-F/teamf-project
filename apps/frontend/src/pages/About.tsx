import { Header } from "../components/Header"
import { PageTitle } from "../components/Title.tsx";
import { PeopleCard } from "../components/PeopleCard";
import {Group, Stack, Text, Center} from "@mantine/core";
import {useTranslation} from "react-i18next";

export function About() {

    const imageGap = 40;
    const {t} = useTranslation();

    // Display the About Page
        return (
            <>
                <title>
                    About - Hanover Insurance
                </title>
                <Header />
                <PageTitle title={t('about_us')}/>
                <Stack m={20} gap={40}>
                    <Text size={"xl"}>
                        {t('footer_disclaimer')}
                    </Text>
                    <Text size={"xl"}>
                        {t('wong')}
                    </Text >
                    <Text size={"xl"}>
                        {t('coach')}
                    </Text>
                    <br/>
                    <Text size={"xl"}>
                        {t('meet_team')}
                    </Text>
                    <Center>

                        <Stack gap={imageGap}>
                            <Group gap={imageGap}>
                                <PeopleCard
                                    firstName="Molly"
                                    lastName="Olsen"
                                    position= {t("lead")}
                                    photoID="Molly.jpg"/>
                                <PeopleCard
                                    firstName="Jeremia"
                                    lastName="Leo"
                                    position={t('pm')}
                                    photoID="Jeremia.jpg"/>
                                <PeopleCard
                                    firstName="Milan"
                                    lastName="DeNicola"
                                    position={t('da')}
                                    photoID="Milan.jpg"/>
                                <PeopleCard
                                    firstName="Andrew"
                                    lastName="Phengthalasy"
                                    position={t('swe')}
                                    photoID="Andrew.jpg"/>
                                <PeopleCard
                                    firstName="John"
                                    lastName="Bernard"
                                    position={t('swe')}
                                    photoID="John.jpg"/>
                            </Group>
                            <Group gap={imageGap}>
                                <PeopleCard
                                    firstName="Adrian"
                                    lastName="Cervera"
                                    position={t('assist')}
                                    photoID="Adrian.jpg"/>
                                <PeopleCard
                                    firstName="Berenis"
                                    lastName="Tekin"
                                    position={t('assist')}
                                    photoID="Berenis.jpg"/>
                                <PeopleCard
                                    firstName="Chloe"
                                    lastName="Polit"
                                    position={t('swe')}
                                    photoID="Chloe.jpg"/>
                                <PeopleCard
                                    firstName="Ryan"
                                    lastName="Veith"
                                    position={t('sm')}
                                    photoID="Ryan.jpg"/>
                                <PeopleCard
                                    firstName="Bowen"
                                    lastName="Cassel"
                                    position={t('po')}
                                    photoID="Bowen.jpg"/>
                            </Group>
                        </Stack>
                    </Center>
                    <br/>
                    <Text size={"xl"}>
                        {t('footer_thanks')}
                    </Text>
                </Stack>
            </>
        )
}

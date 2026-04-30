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
                                    photoID="Molly.jpg"
                                    linkedIn="https://www.linkedin.com/in/molly-olsen-53182b28a/"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="Jeremia"
                                    lastName="Leo"
                                    position={t('pm')}
                                    photoID="Jeremia.jpg"
                                    linkedIn="https://www.linkedin.com/in/jeremia-leo/"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="Milan"
                                    lastName="DeNicola"
                                    position={t('da')}
                                    photoID="Milan.jpg"
                                    linkedIn="https://www.linkedin.com/in/milan-denicola-214a92267"
                                    quote='"When you eliminate the impossible, whatever remains, however improbable, must be the truth." - Spock'/>
                                <PeopleCard
                                    firstName="Andrew"
                                    lastName="Phengthalasy"
                                    position={t('swe')}
                                    photoID="Andrew.jpg"
                                    linkedIn="https://www.linkedin.com/in/andrew-phengthalasy/"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="John"
                                    lastName="Bernard"
                                    position={t('swe')}
                                    photoID="John.jpg"
                                    linkedIn="https://www.linkedin.com/in/john-bernard-8b8216370/"
                                    quote='"Words"'/>
                            </Group>
                            <div style={{ height: 30 }} />
                            <Group gap={imageGap}>
                                <PeopleCard
                                    firstName="Adrian"
                                    lastName="Cervera"
                                    position={t('assist')}
                                    photoID="Adrian.jpg"
                                    linkedIn="https://github.com/Phantomforce260"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="Berenis"
                                    lastName="Tekin"
                                    position={t('assist')}
                                    photoID="Berenis.jpg"
                                    linkedIn="https://www.linkedin.com/in/berenistekin/"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="Chloe"
                                    lastName="Polit"
                                    position={t('swe')}
                                    photoID="Chloe.jpg"
                                    linkedIn="https://www.linkedin.com/in/chloe-polit-5b680a293/"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="Ryan"
                                    lastName="Veith"
                                    position={t('sm')}
                                    photoID="Ryan.jpg"
                                    linkedIn="https://www.linkedin.com/in/ryan-veith-8389ba34a/"
                                    quote='"Words"'/>
                                <PeopleCard
                                    firstName="Bowen"
                                    lastName="Cassel"
                                    position={t('po')}
                                    photoID="Bowen.jpg"
                                    linkedIn="https://www.linkedin.com/in/bowen-cassel/"
                                    quote='"Words"'/>
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

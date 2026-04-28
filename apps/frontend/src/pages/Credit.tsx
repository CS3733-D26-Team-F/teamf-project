import {Header} from "../components/Header.tsx";
import {PageTitle} from "../components/Title.tsx";
import {Center, Group, Stack, Text} from "@mantine/core";
import {CreditCard} from "../components/CreditCard.tsx";
import {useTranslation} from "react-i18next";

export function Credit() {
    const {t} = useTranslation();
    const imageGap = 40;

    return (
        <>
            <title>
                About - Hanover Insurance
            </title>
            <Header />
            <PageTitle title={t('credits')}/>
            <Stack m={20} gap={40}>
                <Text size={"xl"}>
                    {t('pern')}
                </Text>
                <ul>
                    <li>Prisma 7.6.0</li>
                    <li>Express 5.2.1</li>
                    <li>React 19.2.4</li>
                    <li>Node 10.9.2</li>
                </ul>
                <Text size={"xl"}>
                    {t('tools')}
                </Text>
                <Center>
                    <Stack gap={imageGap}>
                        <Group gap={imageGap}>
                            <CreditCard
                                tool="Github"
                                description="Github version 3.5.5"
                                url="https://github.com/"
                                logo="https://www.pngall.com/wp-content/uploads/13/Github-Logo-Transparent.png">
                            </CreditCard>
                            <CreditCard
                                tool="Webstorm"
                                description="Webstorm version 25.5.3"
                                url="https://www.jetbrains.com/webstorm/download/?section=windows"
                                logo="https://cdn.hackr.io/uploads/posts/attachments/webstorm.png">
                            </CreditCard>
                            <CreditCard
                                tool="Tailwind"
                                description="Tailwind version 4.2.2"
                                url="https://tailwindcss.com/docs/installation/using-vite"
                                logo="https://static.vecteezy.com/system/resources/previews/067/565/433/non_2x/tailwind-css-logo-rounded-free-png.png">
                            </CreditCard>
                            <CreditCard
                                tool="Auth0"
                                description="Auth0 version 2.16.1"
                                url="https://manage.auth0.com/"
                                logo="https://images.ctfassets.net/2ntc334xpx65/7xwGomgGQpkGyi4G0Mbtyv/f995abfa6a94aba745b002e5196646cf/Silver_Auth0.jpg">
                            </CreditCard>
                            <CreditCard
                                tool="Mantine"
                                description="Mantine version 9.1.0"
                                url="https://mantine.dev/"
                                logo="https://tse2.mm.bing.net/th/id/OIP.Vmg11uIcQhV8gb6ryeHyIAHaDt?rs=1&pid=ImgDetMain&o=7&rm=3">
                            </CreditCard>
                            <CreditCard
                                tool="Jetbrains AI Assistant"
                                description="Jetbrains AI Assistant"
                                url="https://www.jetbrains.com/ai-ides/"
                                logo="https://www.jetbrains.com/guide/assets/light-5688bcc9.png">
                            </CreditCard>
                        </Group>
                        <Group gap={imageGap}>
                            <CreditCard
                                tool="Postman"
                                description="Postman 12.7.6"
                                url="https://www.postman.com/login"
                                logo="https://tse4.mm.bing.net/th/id/OIP.eUrLjP_6-w6sEA3CFbiejgHaD3?rs=1&pid=ImgDetMain&o=7&rm=3">
                            </CreditCard>
                            <CreditCard
                                tool="Supabase"
                                description="Supabase 2.102.1"
                                url="https://supabase.com/docs"
                                logo="https://chaechae.life/images/blog/thumbnails/supabase-logo.webp">
                            </CreditCard>
                            <CreditCard
                                tool="Mistral AI"
                                description="Mistral-large-latest"
                                url="https://mistral.ai/"
                                logo="https://www.ia-espana.es/wp-content/uploads/2024/11/mistral-ai-1.png">
                            </CreditCard>
                            <CreditCard
                                tool="Docker"
                                description="Docker 29.2.1"
                                url="https://www.docker.com/"
                                logo="https://storage.googleapis.com/static.ianlewis.org/prod/img/docker/large_v-trans.png">
                            </CreditCard>
                            <CreditCard
                                tool="Vultr"
                                description="Debian 11"
                                url="https://www.vultr.com/"
                                logo="https://lowendbox.com/wp-content/uploads/2023/05/vultr2000.png">
                            </CreditCard>
                            <CreditCard
                                tool="Nginx"
                                description="Nginx version 1.18"
                                url="https://nginx.org/en/"
                                logo="https://tse2.mm.bing.net/th/id/OIP.uy7Ux1lb3iZm7O2IuAR64AHaEK?rs=1&pid=ImgDetMain&o=7&rm=3">
                            </CreditCard>
                        </Group>
                    </Stack>
                </Center>
                <br/>
            </Stack>
        </>
    )
}
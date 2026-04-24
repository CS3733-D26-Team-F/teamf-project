import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { PageTitle } from "../components/Title.tsx";
import { usePersona } from "../hooks/usePersona";
import { useAuth0 } from "@auth0/auth0-react";
import { PeopleCard } from "../components/PeopleCard";
import {Group, Stack, Text, Center} from "@mantine/core";

export function About() {
    //The usual
    const persona = usePersona();
    // Auth0 loading state is used so we can show a brief access-check message
    // before deciding whether to render the page or deny access.
    const { isLoading } = useAuth0();

    // Allow anyone logged in to view the page
    const allowedAccess = persona != null || localStorage.getItem('persona') != null;

    // Show loading state while Auth0 is still resolving
    if (isLoading && !allowedAccess) {
        return (
            <>
                <Header />
                <PageTitle title="About"/>
                <p style={{ textAlign: 'center' }}>Checking access...</p>
            </>
        );
    }

    const imageGap = 40;

    // Display the About Page
    if (allowedAccess) {
        return (
            <>
                <title>
                    About - Hanover Insurance
                </title>
                <Header />
                <PageTitle title="About Us"/>
                <Stack gap={40}>
                    <Text>
                        This website was created as a part of CS3733-D26 Software Engineering for the WPI Computer Science Department
                    </Text>
                    <Text>
                        Class Instructor: Prof. Wilson Wong
                    </Text>
                    <Text>
                        Team Coach: Tran
                    </Text>
                    <Text>
                        Our Team:
                    </Text>
                    <Center>

                        <Stack gap={imageGap}>
                            <Group gap={imageGap}>
                                <PeopleCard
                                firstName="Molly"
                                lastName="Olsen"
                                position="Team Lead"
                                photoURL="Molly.jpg"/>
                                <PeopleCard
                                    firstName="Jeremia"
                                    lastName="Leo"
                                    position="Project Manager"
                                    photoURL="Jeremia.jpg"/>
                                <PeopleCard
                                    firstName="Milan"
                                    lastName="DeNicola"
                                    position="Documentation Analyst"
                                    photoURL="Milan.jpg"/>
                                <PeopleCard
                                    firstName="Andrew"
                                    lastName="Phengthalasy"
                                    position="Full-Time Software Engineer"
                                    photoURL="Andrew.jpg"/>
                                <PeopleCard
                                    firstName="John"
                                    lastName="Bernard"
                                    position="Full-Time Software Engineer"
                                    photoURL="John.jpg"/>
                            </Group>
                            <Group gap={imageGap}>
                                <PeopleCard
                                    firstName="Adrian"
                                    lastName="Cervera"
                                    position="Assistant Team Lead"
                                    photoURL="Adrian.jpg"/>
                                <PeopleCard
                                    firstName="Berenis"
                                    lastName="Tekin"
                                    position="Assistant Team Lead"
                                    photoURL="Berenis.jpg"/>
                                <PeopleCard
                                    firstName="Chloe"
                                    lastName="Polit"
                                    position="Full-Time Software Engineer"
                                    photoURL="Chloe.jpg"/>
                                <PeopleCard
                                    firstName="Ryan"
                                    lastName="Veith"
                                    position="Scrum Master"
                                    photoURL="Ryan.jpg"/>
                                <PeopleCard
                                    firstName="Bowen"
                                    lastName="Cassel"
                                    position="Product Owner"
                                    photoURL="Bowen.jpg"/>
                            </Group>
                        </Stack>
                    </Center>
                    <Text>
                        We would like to Thank Hanover Insurance and their representatives, Brandon Roche, Deputy CIO, and Meaghan Jenket, Principle Business Architect for the opportunity to work on this project
                    </Text>
                </Stack>
            </>
        );
    } else {
        // Not allowed users are blocked from this page.
        return <AccessDenied />;
    }
}
import { Header } from "../components/Header";
import { Text } from '@mantine/core';
import { ProfileComponent } from "./profilePage/profileDisplayComponent";

export function ProfilePage() {
    return (
        <>
            <Header />
            <Text size="xl" fw={700} ta="center" m="md">User Profile</Text>
            <ProfileComponent />
        </>
    )
}
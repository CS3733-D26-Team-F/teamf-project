import { useDisclosure } from '@mantine/hooks';
import {Modal, Button, TextInput, PasswordInput} from '@mantine/core';
import * as React from "react";
import { useAuth0 } from '@auth0/auth0-react';

function LoginModal() {
    const [opened, { open, close }] = useDisclosure(false);
    const { isLoading, error, loginWithPopup } = useAuth0();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        try {
            await loginWithPopup({
                authorizationParams: {
                    login_hint: username,
                }
            });
            close();
        }
        catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                title="Authentication"
                centered size={"lg"}
                padding={"xl"}
                styles={{
                    body: {
                        paddingBottom: "2rem",
                }
                }}
            >
                <form className="login-form" onSubmit={handleSubmit}>
                    <TextInput
                        label="Username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        size="md"
                        required
                    />

                    <PasswordInput
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="md"
                        required
                    />

                    {error && <p className="error">{error.message}</p>}

                    <Button type="submit" fullWidth loading={isLoading} size={"lg"} mt={"sm"} color={"blue"} fz={"sm"}>
                        Log In
                    </Button>
                </form>
            </Modal>

            <Button variant="default" onClick={open} size={"xl"} text-size={"10px"}>
                Get Started
            </Button>
        </>
    );
}

export default LoginModal;
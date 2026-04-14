import { useDisclosure } from '@mantine/hooks';
import * as React from "react";
import { useAuth0 } from '@auth0/auth0-react';
import {useEffect} from "react";
import {Button} from "@mantine/core";


function LoginModal() {
    const [opened, { open, close }] = useDisclosure(false);
    const { isLoading, error, getAccessTokenSilently, loginWithPopup, user, isAuthenticated } = useAuth0();

    async function sendToBackend() {
        const token = await getAccessTokenSilently({});

        setFirst(false);

        const inputToken = await fetch(`http://localhost:3000/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token} `
            }
        });
    }

    const [first, setFirst] = React.useState(true);

    useEffect(()=> {
        if(isAuthenticated){
            console.log("User: ", user);
            if(first){
                sendToBackend();
            }
        }
    }, [isAuthenticated, user, sendToBackend, first, setFirst]);


    return (
        <>
            {
                !isAuthenticated && (
                    <Button variant="default" onClick={async () => {
                        try {

                            await loginWithPopup({
                                authorizationParams: {
                                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                                    scope: "openid profile email read:profile read:data read:api"
                                }
                            });

                            close();

                        } catch (err) {
                            console.error(err);
                        }
                    }
                    } size={"xl"} text-size={"10px"}>
                        Get Started
                    </Button>
                )
            }
        </>
    );
}

export default LoginModal;
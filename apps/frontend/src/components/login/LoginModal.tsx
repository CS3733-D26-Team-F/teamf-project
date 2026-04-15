import * as React from "react";
import { useAuth0 } from '@auth0/auth0-react';
import {useEffect} from "react";
import {Button} from "@mantine/core";
import { DOMAIN } from "../../const.ts";

const placeholder = "/default-profile-picture.png";

function LoginModal() {
    const { getAccessTokenSilently, loginWithPopup, user, isAuthenticated } = useAuth0();

    async function sendToBackend() {
        const token = await getAccessTokenSilently({});

        setFirst(false);

        const inputToken = await fetch(`${DOMAIN}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token} `
            }
        });

        if (!inputToken.ok) {
            return;
        }

        const payload = await inputToken.json();
        const employee = payload?.employee;
        if (!employee) {
            return;
        }

        localStorage.setItem('username', employee.username || user?.nickname || '');
        localStorage.setItem('persona', employee.persona || 'Guest');
        localStorage.setItem('first_name', employee.first_name || user?.given_name || user?.nickname || '');
        localStorage.setItem('empid', employee.empid ? String(employee.empid) : '');
        localStorage.setItem('profilePicture', employee.pfp_URL || placeholder);
        if (employee.pfp_URL) {
            localStorage.setItem('pfp_URL', employee.pfp_URL);
        } else {
            localStorage.removeItem('pfp_URL');
        }
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
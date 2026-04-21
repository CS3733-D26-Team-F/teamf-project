import * as React from "react";
import { useAuth0 } from '@auth0/auth0-react';
import {useEffect} from "react";
import {Button} from "@mantine/core";
import { DOMAIN } from "../../const.ts";

const placeholder = "/default-profile-picture.png";

// Handles Auth0 login and syncs the authenticated user with the backend.
function LoginModal() {
    const { getAccessTokenSilently, loginWithPopup, user, isAuthenticated } = useAuth0();

    // After login, send the Auth0 token to the backend so it can load/create the employee record.
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

        // Persist the key profile fields locally so the rest of the app can use them immediately.
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

    // Prevent duplicate backend sync calls during the first authenticated render.
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
                // Only show the login button when the user is signed out.
                !isAuthenticated && (
                    <Button variant="default" onClick={async () => {
                        try {
                            // Open the Auth0 popup and request the scopes needed by the app.
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
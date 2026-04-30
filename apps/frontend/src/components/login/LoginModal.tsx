import { useAuth0 } from '@auth0/auth0-react';
//import {useEffect} from "react";
import {Button} from "@mantine/core";
import { DOMAIN } from "../../const.ts";
import { useNavigate } from 'react-router-dom';

const placeholder = "/default-profile-picture.png";

// Handles Auth0 login and syncs the authenticated user with the backend.
function LoginModal() {
    const { getAccessTokenSilently, loginWithPopup, user, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

    async function sendToBackend() {
        const token = await getAccessTokenSilently({});

        const response = await fetch(`${DOMAIN}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const payload = await response.json();
        const employee = payload?.employee;
        if (!employee) return;

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

        navigate('/statistics');
    }

    return (
        <>
            {
                // Only show the login button when the user is signed out.
                !isAuthenticated && (
                    <Button
                        variant="default"
                        size="xl"
                        onClick={async () => {
                            try {
                                await loginWithPopup({
                                    authorizationParams: {
                                        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                                        scope: "openid profile email read:profile read:data read:api offline_access"
                                    }
                                });
                                // loginWithPopup resolves only after login succeeds
                                await sendToBackend();
                            } catch (err) {
                                console.error(err);
                            }
                        }}
                    >
                        Get Started
                    </Button>
                )
            }
        </>
    );
}

export default LoginModal;
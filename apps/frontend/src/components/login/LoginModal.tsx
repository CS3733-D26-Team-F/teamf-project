import { useDisclosure } from '@mantine/hooks';
import * as React from "react";
import { useAuth0 } from '@auth0/auth0-react';
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {Button} from "@mantine/core";


function LoginModal() {
    const [opened, { open, close }] = useDisclosure(false);
    const { isLoading, error, getAccessTokenSilently, loginWithPopup, user, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

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


async function setSessionTo(persona: string) {


    if (persona === 'Admin') {
        displayAdmin();
        console.log('Admin access');
    }

    if (persona === 'Underwriter'){
        displayUnderwriter();
        console.log('Underwriter access');
    }

    if (persona === 'Business Analyst'){
        displayBusinessAnalyst();
        console.log('Business Analyst access');
    }
    else {
        console.log('Limit access: No persona found');
    }
}

async function displayAdmin(){
    console.log(
        document.getElementById('manage-content'),
        document.getElementById('manage-employees'),
        document.getElementById('business-analyst'),
        document.getElementById('core-commercial-underwriter')
    );
    document.getElementById('manage-content')!.style.display = ''
    document.getElementById('manage-employees')!.style.display = '';
    document.getElementById('business-analyst')!.style.display = 'block';
    document.getElementById('core-commercial-underwriter')!.style.display = 'block';
}

async function displayUnderwriter(){
    document.getElementById('manage-content')!.style.display = '';
    document.getElementById('manage-employees')!.style.display = 'block';
    document.getElementById('business-analyst')!.style.display = 'block';
    document.getElementById('core-commercial-underwriter')!.style.display = '';
}

async function displayBusinessAnalyst(){
    document.getElementById('manage-content')!.style.display = 'block';
    document.getElementById('manage-employees')!.style.display = 'block';
    document.getElementById('business-analyst')!.style.display = '';
    document.getElementById('core-commercial-underwriter')!.style.display = 'block';
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DOMAIN } from "../../const";

import * as React from "react";

export function LoginForm() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${DOMAIN}/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password}),
            })

            if (!response.ok) {
                const message = await response.text();
                setError(message);
                return;
            }

            const data = await response.json();
            // localStorage.setItem("employee", JSON.stringify(data.employee));
            localStorage.setItem('persona', data.employee.persona);
            localStorage.setItem('username', data.employee.username);
            localStorage.setItem('empid', String(data.employee.empid));
            localStorage.setItem('first_name', data.employee.first_name);
            if (data.employee.pfp_URL) {
                localStorage.setItem('profilePicture', data.employee.pfp_URL);
            } else {
                localStorage.removeItem('profilePicture');
            }
            setSessionTo(data.employee.persona);

            navigate("/menu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <div className="entry">
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            <div className="entry">
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
            </button>
        </form>
    );
}

async function setSessionTo(persona: string) {

    localStorage.getItem('persona');
    localStorage.getItem('username');
    localStorage.getItem('empid');
    localStorage.getItem('first_name');


    if (persona === 'Admin') {
        displayAdmin();
        console.log('Admin access');
    }
    else if (persona === 'Underwriter'){
        displayUnderwriter();
        console.log('Underwriter access');
    }
    else if (persona === 'Business Analyst'){
        displayBusinessAnalyst();
        console.log('Business Analyst access');
    }
    else {
        console.log('Limit access: No persona found');
    }
}

function setElementDisplay(id: string, value: string) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = value;
    }
}

async function displayAdmin(){
    setElementDisplay('manage-content', '');
    setElementDisplay('manage-employees', '');
    setElementDisplay('business-analyst', 'block');
    setElementDisplay('core-commercial-underwriter', 'block');
}

async function displayUnderwriter(){
    setElementDisplay('manage-content', '');
    setElementDisplay('manage-employees', 'block');
    setElementDisplay('business-analyst', 'block');
    setElementDisplay('core-commercial-underwriter', '');
}

async function displayBusinessAnalyst(){
    setElementDisplay('manage-content', 'block');
    setElementDisplay('manage-employees', 'block');
    setElementDisplay('business-analyst', '');
    setElementDisplay('core-commercial-underwriter', 'block');
}


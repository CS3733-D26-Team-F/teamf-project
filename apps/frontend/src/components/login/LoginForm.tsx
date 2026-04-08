import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as React from "react";

export function LoginForm({ onLogin }: { onLogin: (employee: any) => void }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:3000/login", {
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
            localStorage.setItem("employee", JSON.stringify(data.employee));
            onLogin(data.employee);
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

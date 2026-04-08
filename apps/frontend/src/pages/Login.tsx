import { LoginHeader } from "../components/login/LoginHeader";
import LoginForm from "../components/login/LoginForm";
import { useState } from "react";

type Employee = {
    empid: number;
    username: string;
    isLoggedIn: boolean;
}

export function Login() {
    const [, setEmployee] = useState<Employee | null>(null);

    return (
        <>
            <LoginHeader />
            <LoginForm onLogin={setEmployee} />
        </>
    );
}
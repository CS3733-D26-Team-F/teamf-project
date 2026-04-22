import { LoginHeader } from "../components/login/LoginHeader";
import { LoginForm } from "../components/login/LoginForm";

export function Login() {

    return (
        <>
            <title>
                t('page_title_login')
            </title>
            <LoginHeader />
            <LoginForm />
        </>
    );
}
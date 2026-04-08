import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { LinksDemo } from "../components/mainmenu/Links.tsx"
// import { LoginHeader } from "../components/login/LoginHeader";
// import LoginForm from "../components/login/LoginForm";
// import { useState } from "react";
//
// export function MainMenu() {
//     const [employee, setEmployee] = useState(() => {
//         const raw = localStorage.getItem("employee");
//         return raw ? JSON.parse(raw) : null;
//     });
//
//     console.log("Employee", employee);
//
//     if (employee?.isLoggedIn) {
//         return (
//             <>
//                 <Header />
//                 <Hero />
//                 <LinksDemo />
//             </>
//         )
//     }
//
//     else {
//         return (
//             <>
//                 <LoginHeader />
//                 <LoginForm onLogin={setEmployee}/>
//             </>
//         )
//     }
// }
//
export function MainMenu() {
            return (
            <>
                <Header />
                <Hero />
                <LinksDemo />
            </>
        )
}
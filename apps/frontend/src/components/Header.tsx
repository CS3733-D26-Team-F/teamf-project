import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import { Profile } from "./Profile.tsx";
import { usePersona } from "../hooks/usePersona";
import { IconBell } from "@tabler/icons-react";
import { Chatbot } from "./Chatbot.tsx";
import { Text } from '@mantine/core';

export function Header() {
    const personaHook = usePersona();

    const isAdmin = personaHook === 'Admin';
    const isUnderwriter = personaHook === 'Underwriter';
    const isBusinessAnalyst = personaHook === 'Business Analyst';
    const isActuarialAnalyst = personaHook === 'Actuarial Analyst';
    const isEXLOperations = personaHook === 'EXL Operations';

    return (
        <>
            <header className="main-header">
                <div className="logo">
                    <Link to="/">
                        <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                    </Link>
                </div>
                    <nav className="menu-links">
                         <Link to="/menu">Home</Link>
                             {isAdmin && <Link to="/manageemployees">Employees</Link>}
                             {(isAdmin || isBusinessAnalyst || isUnderwriter || isActuarialAnalyst || isEXLOperations) && (
                                 <Link to="/documents">Documents</Link>
                             )}
                             {(isAdmin || isUnderwriter || isBusinessAnalyst || isActuarialAnalyst || isEXLOperations) && (
                                 <Link to="/archive">Archive</Link>
                             )}
                             <Profile />
                         <Link to="/notifications">
                             <IconBell size={32} />
                         </Link>
                    </nav>
                <Chatbot />
            </header>
            <header>
                <Text size="sm" c="white" ta="center">
                    This website has been created for WPI’s CS 3733 Software
                    Engineering as a class project and is not in use by Hanover Insurance.
                </Text>
            </header>
        </>
    );
}



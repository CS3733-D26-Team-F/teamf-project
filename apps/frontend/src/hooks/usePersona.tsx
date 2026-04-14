import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

type Persona = "Admin" | "Business Analyst" | "Underwriter" | null;

export const usePersona = (): Persona => {
    const { getIdTokenClaims, isAuthenticated, isLoading } = useAuth0();
    const [persona, setPersona] = useState<Persona>(null);

    useEffect(() => {
        const fetchPersona = async () => {
            if (!isAuthenticated) {
                setPersona(null);
                return;
            }

            const claims = await getIdTokenClaims();
            const namespace = "https://example.com/claims";

            const roles = claims?.[`${namespace}/roles`] as string[] | undefined;

            let derivedPersona: Persona = null;

            if (roles?.includes("Admin")) {
                derivedPersona = "Admin";
            } else if (roles?.includes("Business Analyst")) {
                derivedPersona = "Business Analyst";
            } else if (roles?.includes("Underwriter")) {
                derivedPersona = "Underwriter";
            }

            setPersona(derivedPersona);
        };

        if (!isLoading) {
            fetchPersona();
        }
    }, [getIdTokenClaims, isAuthenticated, isLoading]);

    return persona;
};
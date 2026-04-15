import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

type Persona = "Admin" | "Business Analyst" | "Underwriter" | null;

const PERSONA_VALUES: Exclude<Persona, null>[] = ["Admin", "Business Analyst", "Underwriter"];

function asPersona(value: string | null): Persona {
    if (value && PERSONA_VALUES.includes(value as Exclude<Persona, null>)) {
        return value as Exclude<Persona, null>;
    }
    return null;
}

function derivePersonaFromRoles(roles: string[]): Persona {
    if (roles.includes("Admin")) {
        return "Admin";
    }
    if (roles.includes("Business Analyst")) {
        return "Business Analyst";
    }
    if (roles.includes("Underwriter")) {
        return "Underwriter";
    }
    return null;
}

function extractRolesFromClaims(claims: Record<string, unknown>): string[] {
    const namespace = import.meta.env.VITE_AUTH0_CLAIMS_NAMESPACE || "https://example.com/claims";
    const possibleRoleKeys = [
        `${namespace}/roles`,
        `${namespace}/role`,
        "roles",
        "role",
        "https://schemas.quickstarts.com/roles",
    ];

    const collected = new Set<string>();

    for (const key of possibleRoleKeys) {
        const value = claims[key];
        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (typeof item === "string") {
                    collected.add(item);
                }
            });
        } else if (typeof value === "string") {
            collected.add(value);
        }
    }

    return [...collected];
}

export const usePersona = (): Persona => {
    const { getIdTokenClaims, isAuthenticated, isLoading } = useAuth0();
    const [persona, setPersona] = useState<Persona>(asPersona(localStorage.getItem("persona")));

    useEffect(() => {
        const fetchPersona = async () => {
            if (!isAuthenticated) {
                setPersona(asPersona(localStorage.getItem("persona")));
                return;
            }

            try {
                const claims = (await getIdTokenClaims()) as Record<string, unknown> | undefined;
                const claimRoles = claims ? extractRolesFromClaims(claims) : [];

                let derivedPersona = derivePersonaFromRoles(claimRoles);
                if (!derivedPersona) {
                    derivedPersona = asPersona(localStorage.getItem("persona"));
                }

                setPersona(derivedPersona);
                if (derivedPersona) {
                    localStorage.setItem("persona", derivedPersona);
                }
            } catch {
                setPersona(asPersona(localStorage.getItem("persona")));
            }
        };

        if (!isLoading) {
            fetchPersona();
        }
    }, [getIdTokenClaims, isAuthenticated, isLoading]);

    return persona;
};
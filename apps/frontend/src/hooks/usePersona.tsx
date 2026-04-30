import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

// Supported application personas. `null` means we couldn't resolve a valid role.
type Persona = "Admin" | "Business Analyst" | "Underwriter" | "Actuarial Analyst" | "EXL Operations" | "Agent" | "Approver" |  null;

// Central list of valid persona strings used to validate values from storage/claims.
const PERSONA_VALUES: Exclude<Persona, null>[] = ["Admin", "Business Analyst", "Underwriter", "Actuarial Analyst", "EXL Operations", "Agent", "Approver"];

// Normalize a raw string from localStorage into a known Persona value.
function asPersona(value: string | null): Persona {
    if (value && PERSONA_VALUES.includes(value as Exclude<Persona, null>)) {
        return value as Exclude<Persona, null>;
    }
    return null;
}

// Pick the highest-priority persona from a list of roles.
// The order here matters: Admin wins over lower-privileged roles.
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
    if (roles.includes("Actuarial Analyst")) {
        return "Actuarial Analyst";
    }
    if (roles.includes("EXL Operations")) {
        return "EXL Operations";
    }
    if (roles.includes("Agent")) {
        return "Agent";
    }
    if (roles.includes("Approver")) {
        return "Approver";
    }
    return null;
}

// Read role values from Auth0 claims, supporting multiple claim key shapes
// so the hook can work across different Auth0 configurations.
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
    // Start with the stored persona so the UI can render immediately on refresh.
    const [persona, setPersona] = useState<Persona>(asPersona(localStorage.getItem("persona")));

    useEffect(() => {
        const fetchPersona = async () => {
            // If the user is not authenticated, fall back to whatever is stored locally.
            if (!isAuthenticated) {
                setPersona(asPersona(localStorage.getItem("persona")));
                return;
            }

            try {
                // Read claims from the Auth0 ID token and derive the persona from role claims.
                const claims = (await getIdTokenClaims()) as Record<string, unknown> | undefined;
                const claimRoles = claims ? extractRolesFromClaims(claims) : [];

                let derivedPersona = derivePersonaFromRoles(claimRoles);

                // If claims do not contain a usable role, fall back to localStorage.
                if (!derivedPersona) {
                    derivedPersona = asPersona(localStorage.getItem("persona"));
                }

                // Keep localStorage synchronized so future renders can reuse the same value.
                setPersona(derivedPersona);
                if (derivedPersona) {
                    localStorage.setItem("persona", derivedPersona);
                }
            } catch {
                // On any Auth0/claims failure, preserve the last known local value.
                setPersona(asPersona(localStorage.getItem("persona")));
            }
        };

        // Wait until Auth0 finishes loading before attempting to read claims.
        if (!isLoading) {
            fetchPersona();
        }
    }, [getIdTokenClaims, isAuthenticated, isLoading]);

    return persona;
};
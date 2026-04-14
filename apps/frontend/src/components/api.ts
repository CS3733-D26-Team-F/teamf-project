import { useAuth0 } from "@auth0/auth0-react";

export const useApi = () => {
    const { getAccessTokenSilently } = useAuth0();

    return async (url: string, options: RequestInit = {}) => {
        const token = await getAccessTokenSilently({
            authorizationParams: {
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }
        });

        const res = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store"
        });

        if (!res.ok) throw new Error("API error");

        return res.json();
    };
};
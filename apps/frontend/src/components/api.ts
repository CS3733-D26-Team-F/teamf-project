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
                "Cache-Control": "no-cache"
            },

        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const error = new Error(body.error || "API error") as any;
            error.status = res.status;
            error.body = body;
            throw error;
        }

        return res;
    };
};
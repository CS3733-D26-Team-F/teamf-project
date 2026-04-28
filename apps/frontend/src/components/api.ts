import { useAuth0 } from "@auth0/auth0-react";

// Shared API helper that attaches the current Auth0 access token to every request.
export const useApi = () => {
    const { getAccessTokenSilently } = useAuth0();

    return async (url: string, options: RequestInit = {}) => {
        // Request a fresh token for the configured API audience before calling the backend.
        const token = await getAccessTokenSilently({
            authorizationParams: {
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }
        });

        // Merge caller-provided options with auth headers and a no-cache hint.
        const res = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache"
            },

        });

        // Convert non-2xx responses into thrown errors with status/body metadata.
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
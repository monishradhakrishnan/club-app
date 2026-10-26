// Same address the rest of the app uses (web: this host, phone/Expo Go: the LAN IP in client.js).
// "localhost" only works in a browser on the same PC - on a phone it points at the phone itself.
import { BASE_URL } from "./client";

const API_URL = BASE_URL;

export async function getBudgetRecommendation(data, token) {
    try {
        const response = await fetch(
            `${API_URL}/api/budget/recommend`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",

                    ...(token
                        ? {
                              Authorization: `Bearer ${token}`,
                          }
                        : {}),
                },
                body: JSON.stringify(data),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result?.error ||
                result?.message ||
                "Failed to get budget recommendation"
            );
        }

        return result;

    } catch (error) {
        console.error(
            "Budget recommendation error:",
            error
        );

        throw error;
    }
}
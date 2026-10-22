const API_URL = "http://localhost:8080";

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
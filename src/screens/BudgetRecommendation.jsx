import React, { useState } from "react";
import { getBudgetRecommendation } from "../services/budgetService";

function BudgetRecommendation() {

    const [formData, setFormData] = useState({
        activity_type: "Workshop",
        participants_expected: "",
        duration_days: "",
        volunteers: "",
        venue_type: "Seminar Hall",

        food_required: 0,
        printing_required: 0,
        certificates_required: 0,
        prizes_required: 0,
        equipment_required: 0,
        guest_required: 0,

        previous_similar_events: "",
        previous_avg_cost: ""
    });

    const [recommendedBudget, setRecommendedBudget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Handle text/number inputs
    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle Yes/No checkbox-style values
    const handleRequiredChange = (event) => {

        const { name, checked } = event.target;

        setFormData({
            ...formData,
            [name]: checked ? 1 : 0
        });
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        setLoading(true);
        setError("");
        setRecommendedBudget(null);

        try {

            // Convert numeric fields from strings to numbers
            const requestData = {
                activity_type: formData.activity_type,

                participants_expected:
                    Number(formData.participants_expected),

                duration_days:
                    Number(formData.duration_days),

                volunteers:
                    Number(formData.volunteers),

                venue_type: formData.venue_type,

                food_required:
                    Number(formData.food_required),

                printing_required:
                    Number(formData.printing_required),

                certificates_required:
                    Number(formData.certificates_required),

                prizes_required:
                    Number(formData.prizes_required),

                equipment_required:
                    Number(formData.equipment_required),

                guest_required:
                    Number(formData.guest_required),

                previous_similar_events:
                    Number(formData.previous_similar_events),

                previous_avg_cost:
                    Number(formData.previous_avg_cost)
            };

            console.log("Sending data:", requestData);

            const result =
                await getBudgetRecommendation(requestData);

            console.log("ML response:", result);

            setRecommendedBudget(
                result.recommended_budget
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to get budget recommendation"
            );

        } finally {

            setLoading(false);
        }
    };

    return (

        <div style={styles.page}>

            <div style={styles.container}>

                <h1 style={styles.title}>
                    Budget Recommendation
                </h1>

                <p style={styles.subtitle}>
                    Enter the activity details to get an
                    AI-based budget recommendation.
                </p>

                <form onSubmit={handleSubmit}>

                    {/* Activity Information */}

                    <div style={styles.section}>

                        <h2 style={styles.sectionTitle}>
                            Activity Information
                        </h2>

                        <div style={styles.grid}>

                            <div style={styles.field}>

                                <label>
                                    Activity Type
                                </label>

                                <select
                                    name="activity_type"
                                    value={formData.activity_type}
                                    onChange={handleChange}
                                    style={styles.input}
                                >

                                    <option value="Workshop">
                                        Workshop
                                    </option>

                                    <option value="Seminar">
                                        Seminar
                                    </option>

                                    <option value="Competition">
                                        Competition
                                    </option>

                                    <option value="Cultural">
                                        Cultural
                                    </option>

                                    <option value="Sports">
                                        Sports
                                    </option>

                                    <option value="Awareness">
                                        Awareness
                                    </option>

                                </select>

                            </div>


                            <div style={styles.field}>

                                <label>
                                    Venue Type
                                </label>

                                <select
                                    name="venue_type"
                                    value={formData.venue_type}
                                    onChange={handleChange}
                                    style={styles.input}
                                >

                                    <option value="Seminar Hall">
                                        Seminar Hall
                                    </option>

                                    <option value="Auditorium">
                                        Auditorium
                                    </option>

                                    <option value="Classroom">
                                        Classroom
                                    </option>

                                    <option value="Outdoor">
                                        Outdoor
                                    </option>

                                    <option value="Lab">
                                        Lab
                                    </option>

                                </select>

                            </div>


                            <div style={styles.field}>

                                <label>
                                    Expected Participants
                                </label>

                                <input
                                    type="number"
                                    name="participants_expected"
                                    value={
                                        formData.participants_expected
                                    }
                                    onChange={handleChange}
                                    min="1"
                                    placeholder="Example: 120"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            <div style={styles.field}>

                                <label>
                                    Duration (Days)
                                </label>

                                <input
                                    type="number"
                                    name="duration_days"
                                    value={
                                        formData.duration_days
                                    }
                                    onChange={handleChange}
                                    min="1"
                                    placeholder="Example: 1"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            <div style={styles.field}>

                                <label>
                                    Number of Volunteers
                                </label>

                                <input
                                    type="number"
                                    name="volunteers"
                                    value={
                                        formData.volunteers
                                    }
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Example: 10"
                                    style={styles.input}
                                    required
                                />

                            </div>

                        </div>

                    </div>


                    {/* Requirements */}

                    <div style={styles.section}>

                        <h2 style={styles.sectionTitle}>
                            Activity Requirements
                        </h2>

                        <div style={styles.checkboxGrid}>

                            <label style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    name="food_required"
                                    checked={
                                        formData.food_required === 1
                                    }
                                    onChange={handleRequiredChange}
                                />
                                Food Required
                            </label>


                            <label style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    name="printing_required"
                                    checked={
                                        formData.printing_required === 1
                                    }
                                    onChange={handleRequiredChange}
                                />
                                Printing Required
                            </label>


                            <label style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    name="certificates_required"
                                    checked={
                                        formData.certificates_required === 1
                                    }
                                    onChange={handleRequiredChange}
                                />
                                Certificates Required
                            </label>


                            <label style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    name="prizes_required"
                                    checked={
                                        formData.prizes_required === 1
                                    }
                                    onChange={handleRequiredChange}
                                />
                                Prizes Required
                            </label>


                            <label style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    name="equipment_required"
                                    checked={
                                        formData.equipment_required === 1
                                    }
                                    onChange={handleRequiredChange}
                                />
                                Equipment Required
                            </label>


                            <label style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    name="guest_required"
                                    checked={
                                        formData.guest_required === 1
                                    }
                                    onChange={handleRequiredChange}
                                />
                                Guest Required
                            </label>

                        </div>

                    </div>


                    {/* Previous Event Information */}

                    <div style={styles.section}>

                        <h2 style={styles.sectionTitle}>
                            Previous Event Information
                        </h2>

                        <div style={styles.grid}>

                            <div style={styles.field}>

                                <label>
                                    Previous Similar Events
                                </label>

                                <input
                                    type="number"
                                    name="previous_similar_events"
                                    value={
                                        formData.previous_similar_events
                                    }
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Example: 5"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            <div style={styles.field}>

                                <label>
                                    Previous Average Cost (₹)
                                </label>

                                <input
                                    type="number"
                                    name="previous_avg_cost"
                                    value={
                                        formData.previous_avg_cost
                                    }
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="Example: 22000"
                                    style={styles.input}
                                    required
                                />

                            </div>

                        </div>

                    </div>


                    {/* Submit */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >

                        {loading
                            ? "Getting Recommendation..."
                            : "Get Budget Recommendation"
                        }

                    </button>

                </form>


                {/* Error */}

                {error && (

                    <div style={styles.error}>

                        <strong>Error:</strong> {error}

                    </div>

                )}


                {/* Recommendation */}

                {recommendedBudget !== null && (

                    <div style={styles.result}>

                        <p style={styles.resultTitle}>
                            AI Recommended Budget
                        </p>

                        <h2 style={styles.amount}>
                            ₹
                            {Number(
                                recommendedBudget
                            ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </h2>

                        <p style={styles.resultText}>
                            This budget was estimated using
                            historical activity data and the
                            machine learning model.
                        </p>

                    </div>

                )}

            </div>

        </div>
    );
}


/* -------------------------------- */
/* Styles                           */
/* -------------------------------- */

const styles = {

    page: {
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        padding: "40px 20px"
    },

    container: {
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        padding: "35px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
    },

    title: {
        marginBottom: "8px",
        fontSize: "30px"
    },

    subtitle: {
        color: "#666",
        marginBottom: "30px"
    },

    section: {
        marginBottom: "30px",
        paddingBottom: "25px",
        borderBottom: "1px solid #e5e5e5"
    },

    sectionTitle: {
        fontSize: "20px",
        marginBottom: "20px"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    input: {
        padding: "11px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        fontSize: "15px"
    },

    checkboxGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "15px"
    },

    checkbox: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px"
    },

    button: {
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "7px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        backgroundColor: "#2563eb",
        color: "white"
    },

    error: {
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        borderRadius: "7px"
    },

    result: {
        marginTop: "30px",
        padding: "25px",
        textAlign: "center",
        borderRadius: "10px",
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0"
    },

    resultTitle: {
        fontSize: "18px",
        marginBottom: "5px"
    },

    amount: {
        fontSize: "36px",
        margin: "10px 0"
    },

    resultText: {
        color: "#555"
    }
};

export default BudgetRecommendation;
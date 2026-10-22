import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Switch,
    Alert,
} from "react-native";

import { getBudgetRecommendation } from "../api/budgetService";
import { useAuth } from "../context/AuthContext";

export default function BudgetScreen() {

    const { user } = useAuth();

    /*
     * If your AuthContext stores the token with another name,
     * change user?.token accordingly.
     */
    const token = user?.token;

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
        previous_avg_cost: "",
    });

    const [recommendedBudget, setRecommendedBudget] = useState(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const updateField = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const toggleRequirement = (field) => {

        setFormData((previous) => ({
            ...previous,
            [field]: previous[field] === 1 ? 0 : 1,
        }));

    };

    const getRecommendation = async () => {

        setError("");
        setRecommendedBudget(null);

        // Basic validation
        if (
            !formData.participants_expected ||
            !formData.duration_days ||
            !formData.volunteers ||
            !formData.previous_similar_events ||
            !formData.previous_avg_cost
        ) {

            Alert.alert(
                "Missing Information",
                "Please fill in all required fields."
            );

            return;
        }

        setLoading(true);

        try {

            /*
             * Convert input values from strings
             * to numbers before sending to Spring Boot.
             */
            const requestData = {

                activity_type:
                    formData.activity_type,

                participants_expected:
                    Number(formData.participants_expected),

                duration_days:
                    Number(formData.duration_days),

                volunteers:
                    Number(formData.volunteers),

                venue_type:
                    formData.venue_type,

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
                    Number(formData.previous_avg_cost),
            };

            console.log(
                "Sending budget data:",
                requestData
            );

            const result =
                await getBudgetRecommendation(
                    requestData,
                    token
                );

            console.log(
                "ML recommendation:",
                result
            );

            setRecommendedBudget(
                result.recommended_budget
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to get budget recommendation."
            );

        } finally {

            setLoading(false);
        }
    };

    return (

        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            {/* PAGE TITLE */}

            <Text style={styles.title}>
                Budget Recommendation
            </Text>

            <Text style={styles.subtitle}>
                Get an AI-based budget recommendation
                for your club activity.
            </Text>


            {/* ACTIVITY INFORMATION */}

            <View style={styles.card}>

                <Text style={styles.sectionTitle}>
                    Activity Information
                </Text>


                {/* Activity Type */}

                <Text style={styles.label}>
                    Activity Type
                </Text>

                <View style={styles.optionRow}>

                    {[
                        "Workshop",
                        "Seminar",
                        "Competition",
                        "Cultural",
                        "Sports",
                        "Awareness",
                    ].map((type) => (

                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.optionButton,

                                formData.activity_type === type &&
                                    styles.selectedOption,
                            ]}
                            onPress={() =>
                                updateField(
                                    "activity_type",
                                    type
                                )
                            }
                        >

                            <Text
                                style={[
                                    styles.optionText,

                                    formData.activity_type === type &&
                                        styles.selectedOptionText,
                                ]}
                            >
                                {type}
                            </Text>

                        </TouchableOpacity>

                    ))}

                </View>


                {/* Participants */}

                <Text style={styles.label}>
                    Expected Participants
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Example: 120"
                    keyboardType="numeric"
                    value={
                        formData.participants_expected
                    }
                    onChangeText={(value) =>
                        updateField(
                            "participants_expected",
                            value
                        )
                    }
                />


                {/* Duration */}

                <Text style={styles.label}>
                    Duration (Days)
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Example: 1"
                    keyboardType="numeric"
                    value={
                        formData.duration_days
                    }
                    onChangeText={(value) =>
                        updateField(
                            "duration_days",
                            value
                        )
                    }
                />


                {/* Volunteers */}

                <Text style={styles.label}>
                    Number of Volunteers
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Example: 10"
                    keyboardType="numeric"
                    value={
                        formData.volunteers
                    }
                    onChangeText={(value) =>
                        updateField(
                            "volunteers",
                            value
                        )
                    }
                />

            </View>


            {/* VENUE */}

            <View style={styles.card}>

                <Text style={styles.sectionTitle}>
                    Venue
                </Text>

                <View style={styles.optionRow}>

                    {[
                        "Seminar Hall",
                        "Auditorium",
                        "Classroom",
                        "Outdoor",
                        "Lab",
                    ].map((venue) => (

                        <TouchableOpacity
                            key={venue}
                            style={[
                                styles.optionButton,

                                formData.venue_type === venue &&
                                    styles.selectedOption,
                            ]}
                            onPress={() =>
                                updateField(
                                    "venue_type",
                                    venue
                                )
                            }
                        >

                            <Text
                                style={[
                                    styles.optionText,

                                    formData.venue_type === venue &&
                                        styles.selectedOptionText,
                                ]}
                            >
                                {venue}
                            </Text>

                        </TouchableOpacity>

                    ))}

                </View>

            </View>


            {/* REQUIREMENTS */}

            <View style={styles.card}>

                <Text style={styles.sectionTitle}>
                    Activity Requirements
                </Text>


                <Requirement
                    title="Food Required"
                    value={formData.food_required}
                    onPress={() =>
                        toggleRequirement(
                            "food_required"
                        )
                    }
                />


                <Requirement
                    title="Printing Required"
                    value={formData.printing_required}
                    onPress={() =>
                        toggleRequirement(
                            "printing_required"
                        )
                    }
                />


                <Requirement
                    title="Certificates Required"
                    value={
                        formData.certificates_required
                    }
                    onPress={() =>
                        toggleRequirement(
                            "certificates_required"
                        )
                    }
                />


                <Requirement
                    title="Prizes Required"
                    value={
                        formData.prizes_required
                    }
                    onPress={() =>
                        toggleRequirement(
                            "prizes_required"
                        )
                    }
                />


                <Requirement
                    title="Equipment Required"
                    value={
                        formData.equipment_required
                    }
                    onPress={() =>
                        toggleRequirement(
                            "equipment_required"
                        )
                    }
                />


                <Requirement
                    title="Guest Required"
                    value={
                        formData.guest_required
                    }
                    onPress={() =>
                        toggleRequirement(
                            "guest_required"
                        )
                    }
                />

            </View>


            {/* PREVIOUS EVENTS */}

            <View style={styles.card}>

                <Text style={styles.sectionTitle}>
                    Previous Event Information
                </Text>


                <Text style={styles.label}>
                    Previous Similar Events
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Example: 5"
                    keyboardType="numeric"
                    value={
                        formData.previous_similar_events
                    }
                    onChangeText={(value) =>
                        updateField(
                            "previous_similar_events",
                            value
                        )
                    }
                />


                <Text style={styles.label}>
                    Previous Average Cost (₹)
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Example: 22000"
                    keyboardType="numeric"
                    value={
                        formData.previous_avg_cost
                    }
                    onChangeText={(value) =>
                        updateField(
                            "previous_avg_cost",
                            value
                        )
                    }
                />

            </View>


            {/* GET RECOMMENDATION BUTTON */}

            <TouchableOpacity
                style={[
                    styles.recommendButton,

                    loading &&
                        styles.disabledButton,
                ]}
                onPress={getRecommendation}
                disabled={loading}
            >

                {loading ? (

                    <View style={styles.loadingRow}>

                        <ActivityIndicator
                            color="#FFFFFF"
                        />

                        <Text
                            style={
                                styles.buttonText
                            }
                        >
                            Getting Recommendation...
                        </Text>

                    </View>

                ) : (

                    <Text style={styles.buttonText}>
                        Get Budget Recommendation
                    </Text>

                )}

            </TouchableOpacity>


            {/* ERROR */}

            {error !== "" && (

                <View style={styles.errorBox}>

                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                </View>

            )}


            {/* ML RESULT */}

            {recommendedBudget !== null && (

                <View style={styles.resultCard}>

                    <Text style={styles.resultLabel}>
                        AI Recommended Budget
                    </Text>

                    <Text style={styles.amount}>
                        ₹
                        {Number(
                            recommendedBudget
                        ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>

                    <Text style={styles.resultDescription}>
                        Based on the activity details,
                        historical data and the trained
                        machine learning model.
                    </Text>


                    {/* Use Recommendation */}

                    <TouchableOpacity
                        style={styles.useButton}
                        onPress={() => {

                            Alert.alert(
                                "Budget Recommendation",
                                `Recommended budget: ₹${Number(
                                    recommendedBudget
                                ).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`
                            );

                        }}
                    >

                        <Text style={styles.useButtonText}>
                            Use Recommended Budget
                        </Text>

                    </TouchableOpacity>

                </View>

            )}

        </ScrollView>
    );
}


/*
 * Requirement component
 */

function Requirement({
    title,
    value,
    onPress,
}) {

    return (

        <View style={styles.requirementRow}>

            <Text style={styles.requirementText}>
                {title}
            </Text>

            <Switch
                value={value === 1}
                onValueChange={onPress}
            />

        </View>

    );
}


/*
 * Styles
 */

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F6F5F1",
    },

    content: {
        padding: 20,
        paddingBottom: 50,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1C2321",
        marginBottom: 6,
    },

    subtitle: {
        fontSize: 15,
        color: "#666",
        marginBottom: 20,
        lineHeight: 22,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 5,

        elevation: 2,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#1C2321",
        marginBottom: 18,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 7,
        marginTop: 10,
    },

    input: {
        borderWidth: 1,
        borderColor: "#D5D8D6",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 15,
        backgroundColor: "#FAFAFA",
        color: "#1C2321",
    },

    optionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    optionButton: {
        borderWidth: 1,
        borderColor: "#C8CECB",
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 9,
        marginBottom: 4,
    },

    selectedOption: {
        backgroundColor: "#3E5C50",
        borderColor: "#3E5C50",
    },

    optionText: {
        fontSize: 13,
        color: "#333",
    },

    selectedOptionText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    requirementRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 5,
    },

    requirementText: {
        fontSize: 15,
        color: "#333",
    },

    recommendButton: {
        backgroundColor: "#3E5C50",
        paddingVertical: 15,
        borderRadius: 9,
        alignItems: "center",
        marginBottom: 15,
    },

    disabledButton: {
        opacity: 0.7,
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },

    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    errorBox: {
        backgroundColor: "#FDECEC",
        borderRadius: 8,
        padding: 14,
        marginBottom: 15,
    },

    errorText: {
        color: "#B42318",
        fontSize: 14,
    },

    resultCard: {
        backgroundColor: "#EAF5EE",
        borderWidth: 1,
        borderColor: "#B9DCC5",
        borderRadius: 14,
        padding: 24,
        alignItems: "center",
        marginTop: 5,
    },

    resultLabel: {
        fontSize: 17,
        color: "#3E5C50",
        fontWeight: "600",
    },

    amount: {
        fontSize: 38,
        fontWeight: "800",
        color: "#1C2321",
        marginVertical: 10,
    },

    resultDescription: {
        fontSize: 13,
        color: "#555",
        textAlign: "center",
        lineHeight: 19,
        marginBottom: 18,
    },

    useButton: {
        backgroundColor: "#3E5C50",
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 8,
    },

    useButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },

});
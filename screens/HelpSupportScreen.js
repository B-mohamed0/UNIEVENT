import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";

export default function HelpSupportScreen({ route, navigation }) {
    // L'email et le nom de l'utilisateur connecte sont passes en parametre
    const { email, nom } = route.params;
    const { isDarkMode: darkMode } = useThemeContext();

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const theme = {
        background: darkMode ? "#0f172aff" : "#F1F5F9",
        card: darkMode ? "#1E293B" : "#FFFFFF",
        text: darkMode ? "#F8FAFC" : "#0F172A",
        textSecondary: darkMode ? "#94A3B8" : "#64748B",
        border: darkMode ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
        inputBg: darkMode ? "#334155" : "#F8FAFC",
    };

    const handleSendHelpRequest = async () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert("Erreur", "Veuillez remplir le sujet et le message de votre réclamation.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/support/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, nom, subject, message }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    "Succès",
                    "Votre message a bien été envoyé à l'administration. Nous vous répondrons par email.",
                    [{ text: "OK", onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert("Erreur", data.message || "Impossible d'envoyer le message.");
            }
        } catch (error) {
            console.error("Support send error:", error);
            Alert.alert("Erreur", "Problème de connexion avec le serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Support</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.title, { color: theme.text }]}>Besoin d'aide ?</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Écrivez-nous pour toute réclamation ou problème rencontré sur l'application. Notre équipe vous répondra via votre adresse email.
                </Text>

                <View style={styles.formContainer}>
                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Sujet de la réclamation"
                            placeholderTextColor={theme.textSecondary}
                            value={subject}
                            onChangeText={setSubject}
                        />
                    </View>

                    <View style={[
                        styles.textAreaContainer,
                        { backgroundColor: theme.inputBg, borderColor: theme.border }
                    ]}>
                        <TextInput
                            style={[styles.textArea, { color: theme.text }]}
                            placeholder="Décrivez votre problème en détail..."
                            placeholderTextColor={theme.textSecondary}
                            value={message}
                            onChangeText={setMessage}
                            multiline={true}
                            numberOfLines={8}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.submitButtonContainer}
                    onPress={handleSendHelpRequest}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={["#16A34A", "#10B981"]}
                        style={styles.submitButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Ionicons name="paper-plane-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitButtonText}>Envoyer le message</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 100,
        paddingTop: 40,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Insignia",
        fontWeight: "600",
    },
    headerRight: {
        width: 60,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "jokeyone",
        marginBottom: 10,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: "Insignia",
        lineHeight: 22,
        marginBottom: 30,
    },
    formContainer: {
        marginBottom: 30,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 15,
        justifyContent: "center",
    },
    input: {
        height: "100%",
        fontSize: 16,
        fontFamily: "Insignia",
    },
    textAreaContainer: {
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingTop: 15,
        minHeight: 180,
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        fontFamily: "Insignia",
    },
    submitButtonContainer: {
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#16A34A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    submitButton: {
        height: 55,
        justifyContent: "center",
        alignItems: "center",
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontFamily: "Insignia",
        fontWeight: "bold",
    },
});

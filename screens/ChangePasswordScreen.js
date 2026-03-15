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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

export default function ChangePasswordScreen({ route, navigation }) {
    const { email } = route.params;
    const { isDarkMode: darkMode } = useThemeContext();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const theme = {
        background: darkMode ? "#0f172aff" : "#F1F5F9",
        card: darkMode ? "#1E293B" : "#FFFFFF",
        text: darkMode ? "#F8FAFC" : "#0F172A",
        textSecondary: darkMode ? "#94A3B8" : "#64748B",
        border: darkMode ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
        inputBg: darkMode ? "#334155" : "#F8FAFC",
    };

    const validatePasswordStrength = (pass) => {
        const hasNumber = /\d/;
        const hasLetter = /[a-zA-Z]/;
        return pass.length >= 8 && hasNumber.test(pass) && hasLetter.test(pass);
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas");
            return;
        }

        if (!validatePasswordStrength(newPassword)) {
            Alert.alert(
                "Mot de passe faible",
                "Le nouveau mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre."
            );
            return;
        }

        // Protection supplémentaire, on ne permet pas de mettre l'ancien mdp
        if (oldPassword === newPassword) {
            Alert.alert("Erreur", "Le nouveau mot de passe doit être différent de l'actuel.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, oldPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Succès", "Votre mot de passe a été modifié avec succès.", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Erreur", data.message || "Impossible de changer le mot de passe");
            }
        } catch (error) {
            console.error("Change password error:", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de la connexion au serveur.");
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Sécurité</Text>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Changer le mot de passe</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Votre nouveau mot de passe doit être différent des anciens mots de passe utilisés.
                </Text>

                <View style={styles.formContainer}>
                    {/* Ancien mot de passe */}
                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Mot de passe actuel"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry={!showOldPassword}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                        />
                        <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                            <Ionicons
                                name={showOldPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Nouveau mot de passe */}
                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Nouveau mot de passe"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry={!showNewPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons
                                name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirmer le nouveau mot de passe */}
                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.textSecondary} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Confirmer le nouveau mot de passe"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons
                                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.submitButtonContainer}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={["#143287", "#2D54B8"]}
                        style={styles.submitButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Mettre à jour le mot de passe</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
        width: 60, // Pour équilibrer le titre
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
        marginBottom: 40,
    },
    formContainer: {
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 20,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: "100%",
        fontSize: 16,
        fontFamily: "Insignia",
    },
    submitButtonContainer: {
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#143287",
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

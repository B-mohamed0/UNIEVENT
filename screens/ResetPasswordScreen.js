import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const API_BASE = `${API_URL}/auth`;

export default function ResetPasswordScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { email, otp } = route.params || {};

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { logout, token } = useAuth();

    const validatePassword = (pass) => {
        // Règle: minimum 8 caractères
        if (pass.length < 8) return false;
        // Règle: au moins un chiffre et une lettre
        const hasLetter = /[a-zA-Z]/.test(pass);
        const hasNumber = /\d/.test(pass);
        return hasLetter && hasNumber;
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
            return;
        }

        if (!validatePassword(newPassword)) {
            Alert.alert(
                "Mot de passe faible",
                "Le mot de passe doit contenir au moins 8 caractères, dont au moins une lettre et un chiffre."
            );
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Succès", "Votre mot de passe a été réinitialisé avec succès.");

                // Si on était connecté (via le profil), on déconnecte pour forcer le re-login
                if (token) {
                    await logout();
                }

                // Réinitialiser la navigation pour aller à Student et vider l'historique
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Student" }],
                });
            } else {
                Alert.alert("Erreur", data.message || "Impossible de réinitialiser le mot de passe.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Problème de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Student")}
                activeOpacity={0.2}
            >
                <Ionicons name="chevron-back" size={25} color="#fff" />
            </TouchableOpacity>

            <ImageBackground
                source={require("../assets/project/est.png")}
                style={styles.background}
                resizeMode="cover"
            />

            <View style={styles.whiteTriangle} />

            <LinearGradient
                colors={["#143287", "#6279D8"]}
                style={styles.gradientTriangle}
            />

            <View style={styles.content}>
                <BlurView intensity={25} tint="light" style={styles.glassCard}>
                    <Text style={styles.title}>Nouveau mot de passe</Text>

                    <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Entrez le nouveau mot de passe"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            style={[styles.input, { flex: 1 }]}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={{ paddingRight: 15 }}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off" : "eye"}
                                size={20}
                                color="#000000ff"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>CONFIRMER LE NOUVEAU MOT DE PASSE</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Confirmez le nouveau mot de passe"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={[styles.input, { flex: 1 }]}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
                            style={styles.resetGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.resetText}>Réinitialiser</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.29)",
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        zIndex: 50,
    },
    whiteTriangle: {
        position: "absolute",
        right: 0,
        top: height * 0.4,
        width: 0,
        height: 0,
        borderTopWidth: 200,
        borderBottomWidth: 300,
        borderRightWidth: 400,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderRightColor: "#FFFFFF",
    },
    gradientTriangle: {
        position: "absolute",
        right: 0,
        bottom: -150,
        width: width,
        height: height * 0.5,
        transform: [{ skewX: "20deg" }, { rotate: "20deg" }],
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -150,
    },
    glassCard: {
        width: 320,
        minHeight: 300,
        borderRadius: 30,
        padding: 25,
        backgroundColor: "rgba(0, 0, 0, 0.13)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        overflow: "hidden",
    },
    title: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 30,
        fontFamily: "almas",
    },
    label: {
        color: "#FFFFFF",
        fontSize: 12,
        marginBottom: 6,
        fontWeight: "600",
        fontFamily: "Insignia",
    },
    inputWrapper: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        height: 40,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: "transparent",
    },
    resetButton: {
        width: 180,
        alignSelf: "center",
        borderRadius: 26,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.32)",
        marginTop: 10,
    },
    resetGradient: {
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 26,
    },
    resetText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontFamily: "Insignia",
    },
});

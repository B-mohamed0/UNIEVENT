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
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function ChangePasswordScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const { isDarkMode } = useThemeContext();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const theme = {
        background: isDarkMode ? "#0f172aff" : "#F1F5F9",
        card: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "#FFFFFF",
        text: isDarkMode ? "#F8FAFC" : "#000",
        textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
        inputBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#F8FAFC",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    };

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert("Erreur", "Le nouveau mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    role: user.role,
                    currentPassword,
                    newPassword
                }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert("Succès", "Mot de passe modifié avec succès ✅. Veuillez vous reconnecter.");
                await logout();
            } else {
                Alert.alert("Erreur", data.message || "Échec de la modification");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            Alert.alert("Erreur", "Problème de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <ImageBackground
                source={isDarkMode ? require("../assets/project/estblack.png") : require("../assets/project/estwh.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            {!isDarkMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F8F9FA", opacity: 0.9 }]} />}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDarkMode ? "rgba(255, 255, 254, 0.1)" : "rgba(255, 255, 255, 0.8)" }]}>
                            <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.iconBlur}>
                                <Ionicons name="chevron-back" size={24} color={theme.text} />
                            </BlurView>
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>SÉCURITÉ</Text>
                        <View style={{ width: 50 }} />
                    </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <BlurView intensity={40} tint={isDarkMode ? "dark" : "light"} style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.text }]}>Changer le mot de passe</Text>

                            <Text style={[styles.label, { color: theme.textSecondary }]}>ANCIEN MOT DE PASSE</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    secureTextEntry={!showCurrentPassword}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Ancien mot de passe"
                                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                                />
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { color: theme.textSecondary }]}>NOUVEAU MOT DE PASSE</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    secureTextEntry={!showNewPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Nouveau mot de passe"
                                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { color: theme.textSecondary }]}>CONFIRMER LE MOT DE PASSE</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    secureTextEntry={!showNewPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirmer nouveau mot de passe"
                                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={["#143287", "#2D59D3"]}
                                    style={styles.saveGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.saveText}>Enregistrer</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 60,
        paddingHorizontal: 25,
        paddingBottom: 20,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    iconBlur: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        fontFamily: "jokeyone",
        letterSpacing: 2,
    },
    content: {
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    formCard: {
        borderRadius: 40,
        padding: 25,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        overflow: "hidden",
        shadowRadius: 15,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 25,
        fontFamily: "jokeyone",
        textAlign: "center",
    },
    label: {
        fontSize: 13,
        marginBottom: 8,
        fontFamily: "Insignia",
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 55,
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: "Insignia",
    },
    saveButton: {
        marginTop: 10,
        borderRadius: 20,
        overflow: "hidden",
    },
    saveGradient: {
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    saveText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "Insignia",
    },
});

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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_URL } from "../config";

const { width, height } = Dimensions.get("window");

const API_BASE = `${API_URL}/auth`;

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert("Erreur", "Veuillez entrer votre adresse email.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/forgot-password-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Succès", "Un code de vérification a été envoyé à votre adresse email.");
                navigation.navigate("Verificationemail", { email, context: "reset-password" });
            } else {
                Alert.alert("Erreur", data.message || "Impossible d'envoyer le code.");
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
                onPress={() => navigation.goBack()}
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
                    <Text style={styles.title}>Mot de passe oublié</Text>
                    <Text style={styles.subtitle}>
                        Entrez votre adresse email pour recevoir un code de réinitialisation.
                    </Text>

                    <Text style={styles.label}>EMAIL</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Entrez votre email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendCode}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={["#183282", "rgba(74, 94, 175, 0.82)"]}
                            style={styles.sendGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.sendText}>Envoyer le code</Text>
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
        paddingTop: 60,
    },
    glassCard: {
        width: 320,
        minHeight: 280,
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
        marginBottom: 10,
        fontFamily: "almas",
    },
    subtitle: {
        color: "#FFFFFF",
        fontSize: 13,
        textAlign: "center",
        marginBottom: 25,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 15,
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
        marginBottom: 30,
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        height: 40,
        flex: 1,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: "transparent",
    },
    sendButton: {
        width: 180,
        alignSelf: "center",
        borderRadius: 26,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.32)",
    },
    sendGradient: {
        height: 45,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 26,
    },
    sendText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontFamily: "Insignia",
    },
});

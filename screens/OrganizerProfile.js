import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function OrganizerProfile({ route, navigation }) {
    const { id } = route.params;
    const { isDarkMode } = useThemeContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        nom: "",
        email: "",
        photo: null,
    });
    const { logout } = useAuth();

    const API_URL_ORG = `${API_URL}/organizer`;

    const themeColors = {
        text: isDarkMode ? "#FFF" : "#0A0A1A",
        subText: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(10, 10, 26, 0.6)",
        cardBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
        blurTint: isDarkMode ? "light" : "dark",
        inputBg: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL_ORG}/profile/${id}`);
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            } else {
                Alert.alert("Erreur", data.error || "Impossible de charger le profil");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            Alert.alert("Erreur", "Problème connexion serveur");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission requise", "Nous avons besoin de votre permission pour accéder à la galerie.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setProfile({ ...profile, photo: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const handleSave = async () => {
        if (!profile.nom.trim()) {
            Alert.alert("Erreur", "Le nom ne peut pas être vide");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_URL_ORG}/profile/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: profile.nom,
                    photo: profile.photo,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert("Succès", "Profil mis à jour ✅");
                navigation.navigate("OrganizerDashboard", {
                    id: id,
                    nom: profile.nom,
                    photo: profile.photo,
                    refresh: Date.now()
                });
            } else {
                Alert.alert("Erreur", data.error || "Échec de la mise à jour");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Erreur", "Problème connexion serveur");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Déconnexion",
            "Voulez-vous vraiment vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Se déconnecter",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <OrganizerBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#143287" />
                </View>
            </OrganizerBackground>
        );
    }

    return (
        <OrganizerBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Mon Profil</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                        {profile.photo ? (
                            <Image source={{ uri: profile.photo }} style={styles.photo} />
                        ) : (
                            <View style={[styles.photoPlaceholder, { backgroundColor: themeColors.inputBg }]}>
                                <Ionicons name="person" size={50} color={themeColors.text} />
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.emailText, { color: themeColors.subText }]}>{profile.email}</Text>
                </View>

                <BlurView intensity={20} tint={themeColors.blurTint} style={styles.formCard}>
                    <Text style={[styles.label, { color: themeColors.text }]}>NOM</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text }]}
                        value={profile.nom}
                        onChangeText={(txt) => setProfile({ ...profile, nom: txt })}
                        placeholder="Votre nom"
                        placeholderTextColor={themeColors.subText}
                    />

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={["#005AC1", "#143287"]}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveText}>Enregistrer les modifications</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <View style={styles.logoutContent}>
                            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                            <Text style={styles.logoutText}>Se déconnecter</Text>
                        </View>
                    </TouchableOpacity>
                </BlurView>
            </ScrollView>
        </OrganizerBackground>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        fontFamily: "Insignia",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: "center",
    },
    photoSection: {
        alignItems: "center",
        marginVertical: 30,
    },
    photoContainer: {
        position: "relative",
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#143287",
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    editIconContainer: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#143287",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFF",
    },
    emailText: {
        marginTop: 15,
        fontSize: 16,
        fontFamily: "Insignia",
    },
    formCard: {
        width: "100%",
        borderRadius: 30,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        overflow: "hidden",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        fontFamily: "Insignia",
        marginLeft: 5,
    },
    input: {
        height: 55,
        borderRadius: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 25,
        fontFamily: "Insignia",
    },
    saveButton: {
        borderRadius: 15,
        overflow: "hidden",
        marginTop: 10,
    },
    saveGradient: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    saveText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "Insignia",
    },
    logoutButton: {
        marginTop: 20,
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "rgba(255, 59, 48, 0.3)",
        backgroundColor: "rgba(255, 59, 48, 0.05)",
    },
    logoutContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    logoutText: {
        color: "#FF3B30",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "Insignia",
    },
});

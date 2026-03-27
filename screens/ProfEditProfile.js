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
    StatusBar,
    ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";
import ProfNavbar from "../components/ProfNavbar";
import estwh from "../assets/project/estwh.png";
import estblack from "../assets/project/estblack.png";

const { width } = Dimensions.get("window");

export default function ProfEditProfile({ route, navigation }) {
    const { id, nom: initialNom, photo: initialPhoto } = route.params;
    const { isDarkMode } = useThemeContext();

    const theme = {
        background: isDarkMode ? "#0f172aff" : "#F1F5F9",
        card: isDarkMode ? "rgba(30, 41, 59, 0.7)" : "#FFFFFF",
        text: isDarkMode ? "#F8FAFC" : "#000",
        textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
        inputBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#F8FAFC",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    };
    const [nom, setNom] = useState(initialNom || "");
    const [photo, setPhoto] = useState(initialPhoto || null);
    const [saving, setSaving] = useState(false);

    const API_URL_PROFILE = `${API_URL}/prof/profile`;

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
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        if (!nom.trim()) {
            Alert.alert("Erreur", "Le nom ne peut pas être vide");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_URL_PROFILE}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: nom,
                    photo: photo,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert("Succès", "Profil mis à jour ✅");
                // Navigate back with refreshing instructions if needed, or just go back
                navigation.navigate("ProfProfile", {
                    id,
                    nom,
                    photo,
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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <ImageBackground
                source={isDarkMode ? estblack : estwh}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            {!isDarkMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F8F9FA" }]} />}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.8)" }]}>
                    <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.iconBlur}>
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </BlurView>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>MODIFIER</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                        {photo ? (
                            <Image source={{ uri: photo }} style={styles.photo} />
                        ) : (
                            <View style={[styles.photoPlaceholder, { backgroundColor: theme.inputBg, borderColor: isDarkMode ? theme.border : "#FFF" }]}>
                                <Ionicons name="person" size={50} color={theme.textSecondary} />
                            </View>
                        )}
                        <View style={[styles.editIconContainer, { borderColor: isDarkMode ? theme.border : "#FFF" }]}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>NOM COMPLET</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
                        value={nom}
                        onChangeText={setNom}
                        placeholder="Votre nom"
                        placeholderTextColor={isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                    />

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={["#143287", "#2D59D3"]}
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
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <ProfNavbar id={id} nom={nom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F1F5F9",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 70, // Augmenté
        paddingHorizontal: 25, // Augmenté
        paddingBottom: 20,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
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
        color: "#000",
        fontFamily: "jokeyone",
        letterSpacing: 2,
    },
    content: {
        paddingHorizontal: 25,
        paddingBottom: 50,
        alignItems: "center",
    },
    photoSection: {
        alignItems: "center",
        marginVertical: 40,
    },
    photoContainer: {
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    photo: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 5,
        borderColor: "#FFF",
    },
    photoPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 5,
        borderColor: "#FFF",
    },
    editIconContainer: {
        position: "absolute",
        bottom: 5,
        right: 5,
        backgroundColor: "#143287",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FFF",
    },
    formCard: {
        width: "100%",
        borderRadius: 30,
        padding: 30,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.03)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    label: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 10,
        fontFamily: "Insignia",
        fontWeight: "600",
    },
    input: {
        height: 55,
        borderRadius: 15,
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 20,
        fontSize: 16,
        color: "#000",
        marginBottom: 30,
        fontFamily: "Insignia",
    },
    saveButton: {
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#143287",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
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
    cancelButton: {
        marginTop: 20,
        paddingVertical: 10,
        alignItems: "center",
    },
    cancelText: {
        color: "#94A3B8",
        fontSize: 16,
        fontFamily: "Insignia",
    },
});

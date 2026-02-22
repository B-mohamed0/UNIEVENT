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
import BottomNav from "../components/navbar";

const { width } = Dimensions.get("window");

export default function StudentProfile({ route, navigation }) {
    const { id, nom: initialNom } = route.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        nom: initialNom || "",
        email: "",
        photo: null,
        id: id,
    });

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/student/profile`;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
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
            const response = await fetch(`${API_URL}/${id}`, {
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
                navigation.navigate("Home", {
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
                    onPress: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "QuiSuisJe" }],
                        });
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require("../assets/project/est.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Profil</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                        {profile.photo ? (
                            <Image source={{ uri: profile.photo }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="person" size={50} color="#FFF" />
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.cneText}>CNE: {profile.id}</Text>
                    <Text style={styles.emailText}>{profile.email}</Text>
                </View>

                <BlurView intensity={30} tint="light" style={styles.formCard}>
                    <Text style={styles.label}>NOM COMPLET</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.nom}
                        onChangeText={(txt) => setProfile({ ...profile, nom: txt })}
                        placeholder="Votre nom"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                    />

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={["#1e3c72", "#2a5298"]}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveText}>Enregistrer</Text>
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

            <BottomNav id={id} nom={profile.nom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
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
        color: "#FFF",
        fontFamily: "Insignia",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 120,
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
        borderColor: "#FFF",
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    editIconContainer: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#2a5298",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFF",
    },
    cneText: {
        marginTop: 15,
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "Comicy",
    },
    emailText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        fontFamily: "Insignia",
    },
    formCard: {
        width: "100%",
        borderRadius: 30,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0.2)",
    },
    label: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        marginBottom: 8,
        fontFamily: "Insignia",
        marginLeft: 5,
    },
    input: {
        height: 55,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#FFF",
        marginBottom: 25,
        fontFamily: "Insignia",
    },
    saveButton: {
        borderRadius: 15,
        overflow: "hidden",
    },
    saveGradient: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    saveText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
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

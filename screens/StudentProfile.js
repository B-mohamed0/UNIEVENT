import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
    Animated,
    StatusBar,
    Switch,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomNav from "../components/navbar";
import { API_URL } from "../config";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function StudentProfile({ route, navigation }) {
    const { id, nom: initialNom } = route.params;
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        nom: initialNom || "",
        email: "",
        photo: null,
        id: id,
    });
    const [darkMode, setDarkMode] = useState(false);

    // Animation de défilement
    const scrollY = useRef(new Animated.Value(0)).current;

    const API_URL_PROFILE = `${API_URL}/student/profile`;

    useEffect(() => {
        fetchProfile();
    }, [route.params?.refresh]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL_PROFILE}/${id}`);
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            } else {
                Alert.alert("Erreur", data.error || "Impossible de charger le profil");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
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

    // Interpolations pour l'animation de défilement
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    // Effet de rétrécissement de la photo
    const imageScale = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [1, 0.6],
        extrapolate: "clamp",
    });

    const imageTranslateY = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [0, -20],
        extrapolate: "clamp",
    });

    const titleOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#143287" />
            </View>
        );
    }

    return (
        <View style={styles.container} >
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* BACKGROUND CLAIR */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F1F5F9" }]} />

            {/* HEADER FIXE AVEC DÉGRADÉ TRANSPARENT EN BAS */}
            <Animated.View style={[styles.header, { zIndex: 100 }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: headerOpacity }]}>
                    <LinearGradient
                        colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                </Animated.View>

                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButtonGlass}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <Ionicons name="chevron-back" size={24} color="#000" />
                        </BlurView>
                    </TouchableOpacity>
                    <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity }]}>PROFILE</Animated.Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.iconButtonGlass}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                        </BlurView>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                {/* IMAGE LABEL AVEC COINS ARRONDIS */}
                <View style={styles.imageLabelContainer}>
                    {profile.photo ? (
                        <Image source={{ uri: profile.photo }} style={styles.blurredBackground} blurRadius={15} />
                    ) : (
                        <View style={[styles.blurredBackground, { backgroundColor: "#E2E8F0" }]} />
                    )}
                    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
                </View>

                {/* PROFILE PHOTO OVERLAP & INFO */}
                <View style={styles.profileInfoSection}>
                    <Animated.View style={[
                        styles.photoContainer,
                        { transform: [{ scale: imageScale }, { translateY: imageTranslateY }] }
                    ]}>
                        {profile.photo ? (
                            <Image source={{ uri: profile.photo }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="person" size={50} color="#94A3B8" />
                            </View>
                        )}
                    </Animated.View>

                    <View style={{ alignItems: "center" }}>
                        <Text style={styles.nameText}>{profile.nom}</Text>
                        <Text style={styles.emailText}>{profile.email}</Text>
                    </View>
                </View>

                {/* SECTION QR CODE (SANS FOND) */}
                <View style={styles.qrSection}>
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={profile.id ? profile.id.toString() : "no-id"}
                            size={160}
                            color="#000"
                            backgroundColor="transparent"
                        />
                    </View>
                    <Text style={styles.qrTitle}>Mon Pass Digital</Text>
                </View>

                {/* LISTE DES PARAMÈTRES */}
                <View style={styles.settingsList}>
                    <TouchableOpacity
                        style={styles.settingsItem}
                        onPress={() => navigation.navigate("EditProfile", {
                            id,
                            nom: profile.nom,
                            photo: profile.photo
                        })}
                    >
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: "#DBEAFE" }]}>
                                <Ionicons name="person-outline" size={20} color="#2563EB" />
                            </View>
                            <Text style={styles.settingsText}>Modifier le profil</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: "#E0E7FF" }]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#4F46E5" />
                            </View>
                            <Text style={styles.settingsText}>Changer le mot de passe</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}>
                                <Ionicons name="notifications-outline" size={20} color="#D97706" />
                            </View>
                            <Text style={styles.settingsText}>Notification</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <View style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: "#F1F5F9" }]}>
                                <Ionicons name="moon-outline" size={20} color="#475569" />
                            </View>
                            <Text style={styles.settingsText}>Dark mode</Text>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={setDarkMode}
                            trackColor={{ false: "#CBD5E1", true: "#143287" }}
                            thumbColor={darkMode ? "#FFF" : "#F4F3F4"}
                        />
                    </View>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: "#DCFCE7" }]}>
                                <Ionicons name="help-circle-outline" size={20} color="#16A34A" />
                            </View>
                            <Text style={styles.settingsText}>Help</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </Animated.ScrollView>

            <BottomNav id={id} nom={profile.nom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F1F5F9",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 50,
        height: 140, // Augmenté pour le padding et le dégradé
        justifyContent: "flex-start",
        zIndex: 100,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 25, // Augmenté
    },
    iconButtonGlass: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.29)",
        borderWidth: 1,
        borderColor: "rgba(243, 243, 243, 0.17)",
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
    scrollContent: {
        paddingBottom: 140,
    },
    imageLabelContainer: {
        height: SCREEN_HEIGHT * 0.28,
        width: "100%",
        overflow: "hidden",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        backgroundColor: "#E2E8F0",
    },
    blurredBackground: {
        width: "100%",
        height: "100%",
    },
    profileInfoSection: {
        alignItems: "center",
        marginTop: -70, // Overlap
        paddingHorizontal: 20,
    },
    photoContainer: {
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
    nameText: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E293B",
        marginTop: 15,
        fontFamily: "jokeyone",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    emailText: {
        fontSize: 16,
        color: "#64748B",
        fontFamily: "Insignia",
        marginBottom: 20,
    },
    editButton: {
        width: 180,
        borderRadius: 30,
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#143287",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    editGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    editButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "Insignia",
    },
    qrSection: {
        marginHorizontal: 25,
        marginTop: 10,
        alignItems: "center",
        backgroundColor: "transparent",
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        marginTop: 10,
        fontFamily: "jokeyone",
        letterSpacing: 1,
    },
    qrContainer: {
        padding: 15,
        backgroundColor: "#FFF",
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    settingsList: {
        marginHorizontal: 25,
        marginTop: 40,
        backgroundColor: "#FFF",
        borderRadius: 30,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    settingsItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    settingsIconLabel: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    settingsText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1E293B",
        fontFamily: "Insignia",
    },
});

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
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

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
    const { isDarkMode: darkMode, toggleDarkMode } = useThemeContext();
    const { logout } = useAuth();

    // 🎨 Couleurs locales pour le Profil
    const theme = {
        background: darkMode ? "#0f172aff" : "#F1F5F9",
        card: darkMode ? "#1E293B" : "#FFFFFF",
        text: darkMode ? "#F8FAFC" : "#0F172A",
        textSecondary: darkMode ? "#94A3B8" : "#64748B",
        border: darkMode ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
        accent: darkMode ? "#334155" : "#E2E8F0",
        headerGradient: darkMode ? ["#0F172A", "rgba(15, 23, 42, 0)"] : ["#FFFFFF", "rgba(255, 255, 255, 0)"],
    };

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
                    onPress: async () => {
                        await logout();
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
        <View style={[styles.container, { backgroundColor: theme.background }]} >
            <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            {/* BACKGROUND DYNAMIQUE */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.background }]} />

            {/* HEADER FIXE AVEC DÉGRADÉ DYNAMIQUE */}
            <Animated.View style={[styles.header, { zIndex: 100 }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: headerOpacity }]}>
                    <LinearGradient
                        colors={theme.headerGradient}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                </Animated.View>

                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconButtonGlass, { backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.29)" }]}>
                        <BlurView intensity={20} tint={darkMode ? "dark" : "light"} style={styles.iconBlur}>
                            <Ionicons name="chevron-back" size={24} color={theme.text} />
                        </BlurView>
                    </TouchableOpacity>
                    <Animated.Text style={[styles.headerTitle, { color: theme.text, opacity: titleOpacity }]}>PROFILE</Animated.Text>
                    <TouchableOpacity onPress={handleLogout} style={[styles.iconButtonGlass, { backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.29)" }]}>
                        <BlurView intensity={20} tint={darkMode ? "dark" : "light"} style={styles.iconBlur}>
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
                        <View style={[styles.blurredBackground, { backgroundColor: theme.accent }]} />
                    )}
                    <BlurView intensity={30} tint={darkMode ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
                </View>

                {/* PROFILE PHOTO OVERLAP & INFO */}
                <View style={styles.profileInfoSection}>
                    <Animated.View style={[
                        styles.photoContainer,
                        { transform: [{ scale: imageScale }, { translateY: imageTranslateY }] }
                    ]}>
                        {profile.photo ? (
                            <Image source={{ uri: profile.photo }} style={[styles.photo, { borderColor: theme.card }]} />
                        ) : (
                            <View style={[styles.photoPlaceholder, { backgroundColor: theme.accent, borderColor: theme.card }]}>
                                <Ionicons name="person" size={50} color={theme.textSecondary} />
                            </View>
                        )}
                    </Animated.View>

                    <View style={{ alignItems: "center" }}>
                        <Text style={[styles.nameText, { color: theme.text }]}>{profile.nom}</Text>
                        <Text style={[styles.emailText, { color: theme.textSecondary }]}>{profile.email}</Text>
                    </View>
                </View>

                {/* SECTION QR CODE (SANS FOND) */}
                <View style={styles.qrSection}>
                    <View style={[styles.qrContainer, { backgroundColor: darkMode ? "#FFF" : theme.card }]}>
                        <QRCode
                            value={profile.id ? profile.id.toString() : "no-id"}
                            size={160}
                            color="#000"
                            backgroundColor="transparent"
                        />
                    </View>
                    <Text style={[styles.qrTitle, { color: theme.text }]}>Mon Pass Digital</Text>
                </View>

                {/* LISTE DES PARAMÈTRES */}
                <View style={[styles.settingsList, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        style={styles.settingsItem}
                        onPress={() => navigation.navigate("EditProfile", {
                            id,
                            nom: profile.nom,
                            photo: profile.photo
                        })}
                    >
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: darkMode ? "#1E293B" : "#DBEAFE" }]}>
                                <Ionicons name="person-outline" size={20} color={darkMode ? "#3B82F6" : "#2563EB"} />
                            </View>
                            <Text style={[styles.settingsText, { color: theme.text }]}>Modifier le profil</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: darkMode ? "#1E293B" : "#E0E7FF" }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={darkMode ? "#818CF8" : "#4F46E5"} />
                            </View>
                            <Text style={[styles.settingsText, { color: theme.text }]}>Changer le mot de passe</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: darkMode ? "#1E293B" : "#FEF3C7" }]}>
                                <Ionicons name="notifications-outline" size={20} color={darkMode ? "#FBBF24" : "#D97706"} />
                            </View>
                            <Text style={[styles.settingsText, { color: theme.text }]}>Notification</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: darkMode ? "#334155" : "#F1F5F9" }]}>
                                <Ionicons name={darkMode ? "sunny-outline" : "moon-outline"} size={20} color={darkMode ? "#FBBF24" : "#475569"} />
                            </View>
                            <Text style={[styles.settingsText, { color: theme.text }]}>Dark mode</Text>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: "#CBD5E1", true: "#143287" }}
                            thumbColor={darkMode ? "#FFF" : "#F4F3F4"}
                        />
                    </View>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsIconLabel}>
                            <View style={[styles.iconContainer, { backgroundColor: darkMode ? "#1E293B" : "#DCFCE7" }]}>
                                <Ionicons name="help-circle-outline" size={20} color={darkMode ? "#34D399" : "#16A34A"} />
                            </View>
                            <Text style={[styles.settingsText, { color: theme.text }]}>Help</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
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

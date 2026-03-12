import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BackButton from "../components/BackButton";
import conference from "../assets/project/conference.png";
import estwhite from "../assets/project/estwhite.png";
import OrganizerBackground from "../components/OrganizerBackground";
import { useThemeContext } from "../context/ThemeContext";

const OrganizerEventDetails = ({ route, navigation }) => {
    const { event, organizerId, nom } = route.params;
    const { isDarkMode } = useThemeContext();
    const [eventData, setEventData] = useState(event);
    const [loading, setLoading] = useState(false);

    const themeColors = {
        text: isDarkMode ? "#FFF" : "#0A0A1A",
        subText: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(10, 10, 26, 0.6)",
        cardBg: isDarkMode ? "rgba(0, 0, 0, 0.34)" : "rgba(0, 0, 0, 0.05)",
        blurTint: isDarkMode ? "dark" : "light",
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ImageBackground
                source={conference}
                style={styles.header}
                imageStyle={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            >
                <LinearGradient
                    colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)"]}
                    style={StyleSheet.absoluteFill}
                />
                <BackButton />

                <View style={styles.headerContent}>
                    <Text style={styles.title}>{eventData.nom_evenement}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate("CreateEvent", { id: organizerId, nom, editEvent: eventData })}
                        >
                            <BlurView intensity={20} tint="light" style={styles.buttonInner}>
                                <Ionicons name="create-outline" size={20} color="#FFF" />
                                <Text style={styles.buttonText}>Modifier</Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate("ManageEvent", { event: eventData, organizerId, nom })}
                        >
                            <BlurView intensity={20} tint="light" style={styles.buttonInner}>
                                <Ionicons name="stats-chart-outline" size={20} color="#FFF" />
                                <Text style={styles.buttonText}>Gérer</Text>
                            </BlurView>
                        </TouchableOpacity>

                    </View>
                </View>
            </ImageBackground>

            <ImageBackground
                source={estwhite}
                style={styles.bodyBackground}
                imageStyle={styles.bodyImage}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {eventData.event_status === "En cours" && (
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => navigation.navigate("Scanner", { eventId: eventData.id })}
                        >
                            <Ionicons name="qr-code-outline" size={25} color="#FFF" />
                            <Text style={{ color: "#FFF", marginLeft: 8, marginTop: 10, marginBottom: 10, fontFamily: "Insignia" }}>
                                Scanner un étudiant
                            </Text>
                        </TouchableOpacity>
                    )}
                    <BlurView intensity={20} tint={themeColors.blurTint} style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Description</Text>
                        <Text style={[styles.descriptionText, { color: themeColors.text }]}>{eventData.description || "Aucune description fournie."}</Text>
                    </BlurView>

                    <BlurView intensity={20} tint={themeColors.blurTint} style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Informations</Text>

                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={24} color={themeColors.text} />
                            <Text style={[styles.infoText, { color: themeColors.text }]}>
                                {new Date(eventData.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={24} color={themeColors.text} />
                            <Text style={[styles.infoText, { color: themeColors.text }]}>
                                {eventData.heure_debut?.slice(0, 5)} - {eventData.heure_fin?.slice(0, 5)}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={24} color={themeColors.text} />
                            <Text style={[styles.infoText, { color: themeColors.text }]}>{eventData.lieu}</Text>
                        </View>
                    </BlurView>

                    <BlurView intensity={20} tint={themeColors.blurTint} style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Organisation</Text>
                        <View style={styles.orgInfo}>
                            <Text style={[styles.orgLabel, { color: themeColors.subText }]}>Animateur:</Text>
                            <Text style={[styles.orgValue, { color: themeColors.text }]}>{eventData.nom_animateur}</Text>

                            <View style={{ height: 10 }} />

                            <Text style={[styles.orgLabel, { color: themeColors.subText }]}>Catégorie:</Text>
                            <Text style={[styles.orgValue, { color: themeColors.text }]}>{eventData.categorie}</Text>

                            <View style={{ height: 10 }} />

                            <Text style={[styles.orgLabel, { color: themeColors.subText }]}>Capacité:</Text>
                            <Text style={[styles.orgValue, { color: themeColors.text }]}>{eventData.capacite_max} personnes</Text>
                        </View>
                    </BlurView>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </ImageBackground>
        </View>
    );
};

export default OrganizerEventDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0A0A1A",
    },
    header: {
        height: 350,
        justifyContent: "flex-end",
    },
    headerContent: {
        padding: 25,
        paddingBottom: 130,
    },
    title: {
        color: "#ffffffff",
        fontSize: 32,
        fontWeight: "800",
        fontFamily: "jokeyone",
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: "row",
        gap: 15,
    },
    actionButton: {
        flex: 1,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    buttonInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "Insignia",
    },
    scanButton: {
        flexDirection: "row",
        alignSelf: "center",
        alignItems: "center",
        backgroundColor: "#005AC1",
        paddingHorizontal: 70,
        paddingVertical: 10,
        borderRadius: 50,
        marginBottom: 20,
    },
    bodyBackground: {
        flex: 1,
        marginTop: -90,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: "hidden",
    },
    bodyImage: {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 30,
    },
    card: {
        borderRadius: 25,
        padding: 20,
        marginBottom: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        fontFamily: "jokeyone",
        marginBottom: 15,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: "Insignia",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        fontFamily: "Insignia",
    },
    orgInfo: {
        gap: 2,
    },
    orgLabel: {
        fontSize: 14,
        fontFamily: "Insignia",
    },
    orgValue: {
        fontSize: 18,
        fontWeight: "600",
        fontFamily: "Insignia",
    },
});

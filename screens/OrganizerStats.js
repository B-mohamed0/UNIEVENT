import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    StatusBar,
    ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import OrganizerNavbar from "../components/OrganizerNavbar";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";

const { width } = Dimensions.get("window");

export default function OrganizerStats({ route, navigation }) {
    const { id, nom } = route.params;
    const isDarkMode = false;

    const themeColors = {
        text: isDarkMode ? "#FFF" : "#0A0A1A",
        subText: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(10, 10, 26, 0.7)",
        headerTitle: isDarkMode ? "#FFF" : "#143287",
        blurTint: isDarkMode ? "dark" : "light",
        cardBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    };

    const [stats, setStats] = useState({
        totalEvenement: 0,
        totalParticipants: 0,
        bestTauxPresence: "0%"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/organizer/stats/${id}`);
                const data = await response.json();
                if (response.ok) {
                    setStats(data);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [id]);

    return (
        <OrganizerBackground>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={themeColors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.headerTitle, { color: themeColors.headerTitle }]}>Statistiques Globales</Text>
                </View>
                <View style={styles.actionIcon}>
                    <Ionicons name="sunny-outline" size={20} color={themeColors.text} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderColor: themeColors.cardBorder }]}>
                        <Ionicons name="checkmark" size={16} color={themeColors.text} />
                        <Text style={[styles.filterText, { color: themeColors.text }]}>Avril</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderColor: themeColors.cardBorder }]}>
                        <Text style={[styles.filterText, { color: themeColors.text }]}>Toutes Catégories</Text>
                        <Ionicons name="chevron-down" size={16} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.chartCard, { borderColor: themeColors.cardBorder }]}>
                    <Text style={[styles.chartTitle, { color: themeColors.text }]}>Participants par mois</Text>
                    <View style={[styles.chartPlaceholder, { borderBottomColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }]}>
                        {/* Simuler un graphique simple avec des barres */}
                        {[40, 60, 45, 80, 55, 90, 70, 40, 60, 75, 50, 65].map((h, i) => (
                            <View key={i} style={[styles.chartBar, { height: h }]} />
                        ))}
                    </View>
                    <View style={styles.chartLabels}>
                        {['10', '20', '30'].map(l => <Text key={l} style={[styles.chartLabelText, { color: themeColors.subText }]}>{l}</Text>)}
                    </View>
                </BlurView>

                <View style={styles.statsGrid}>
                    <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                        <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Total Événements</Text>
                        <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.totalEvenement}</Text>
                    </BlurView>

                    <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                        <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Participants Uniques</Text>
                        <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.totalParticipants}</Text>
                    </BlurView>

                    <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                        <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Meilleur Taux Présence</Text>
                        <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.bestTauxPresence}</Text>
                    </BlurView>
                </View>
            </ScrollView>
            <OrganizerNavbar id={id} nom={nom} />
        </OrganizerBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0A0A1A",
    },
    header: {
        paddingTop: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 5,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#2E5BFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    headerTitle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "600",
        fontFamily: "Insignia",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    filterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        gap: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    filterText: {
        color: "#FFF",
        fontSize: 14,
        fontFamily: "Insignia",
    },
    chartCard: {
        borderRadius: 25,
        padding: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        marginBottom: 20,
    },
    chartTitle: {
        color: "#FFF",
        fontSize: 16,
        fontFamily: "Insignia",
        marginBottom: 20,
    },
    chartPlaceholder: {
        height: 120,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.2)",
        paddingBottom: 5,
    },
    chartBar: {
        width: 12,
        backgroundColor: "#2E5BFF",
        borderRadius: 6,
        opacity: 0.8,
    },
    chartLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
    },
    chartLabelText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 10,
    },
    statsGrid: {
        gap: 15,
    },
    gridItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    gridLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 16,
        fontFamily: "Insignia",
    },
    gridValue: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "700",
        fontFamily: "jokeyone",
    },
});

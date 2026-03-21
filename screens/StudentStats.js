import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import BottomNav from "../components/navbar";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";
import estwh from "../assets/project/organizer_bg_light.png";
import estblack from "../assets/project/organizer_bg.jpg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const THEME_GRADIENTS = {
    "Dusk": ["#FF512F", "#DD2476"],
    "Ocean": ["#2193b0", "#6dd5ed"],
    "Emerald": ["#11998e", "#38ef7d"],
    "Purple Heat": ["#833ab4", "#fd1d1d", "#fcb045"],
    "Midnight": ["#232526", "#414345"],
    "Royal Blue": ["#1e3c72", "#2a5298"],
    "Sunset": ["#ee0979", "#ff6a00"],
    "Lavender": ["#DA22FF", "#9733EE"],
    "Azure": ["#00c6ff", "#0072ff"],
    "Golden Hour": ["#F2994A", "#F2C94C"],
    "default": ["#3b82f6", "#1e3a8a"]
};

const API_STATS = `${API_URL}/student/stats`;

const CircularProgress = ({ percentage, size = 180, strokeWidth = 15, isDarkMode }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const textColor = isDarkMode ? "#FFFFFF" : "#000000";

    return (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={textColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: textColor }]}>{percentage}%</Text>
                <Text style={[styles.percentageLabel, { color: textColor }]}>Présence</Text>
            </View>
        </View>
    );
};

export default function StudentStats({ route, navigation }) {
    const { id, nom } = route.params;
    const { isDarkMode } = useThemeContext();

    const theme = {
        background: isDarkMode ? "#0f172a31" : "#F1F5F9",
        card: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.07)",
        text: isDarkMode ? "#F8FAFC" : "#0F172A",
        textSecondary: isDarkMode ? "#94A3B8" : "rgba(0, 0, 0, 1)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 74, 143, 0.13)",
    };
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [id]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_STATS}/${id}`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.log("Erreur fetch stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).toUpperCase();
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <ImageBackground
                source={isDarkMode ? estblack : estwh}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            {!isDarkMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0, 0, 0, 0.22)" }]} />}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.greeting, { color: theme.text }]}>Mes Statistiques</Text>
                    <Text style={[styles.name, { color: theme.text }]}>{nom}</Text>
                </View>

                {/* Circular Progress Card */}
                <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <CircularProgress percentage={stats?.attendancePercentage || 0} isDarkMode={isDarkMode} />

                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats?.totalEnrolled || 0}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Inscriptions</Text>
                        </View>
                        <View style={[styles.summaryItem, styles.summaryDivider, { borderLeftColor: theme.border }]}>
                            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats?.totalAttended || 0}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Présences</Text>
                        </View>
                    </View>
                </BlurView>

                {/* History Title */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Historique des événements</Text>

                {/* Events List */}
                {stats?.enrolledEvents.length > 0 ? (
                    stats.enrolledEvents.map((event, index) => (
                        <BlurView key={`${event.id}-${index}`} intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.eventItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <LinearGradient
                                colors={THEME_GRADIENTS[event.theme_color] || THEME_GRADIENTS.default}
                                style={styles.themeBar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                            <View style={styles.eventContent}>
                                <View style={styles.eventHeader}>
                                    <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>{event.title}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: event.participation_status === 'PRESENT' ? '#10b981' : 'rgba(255,255,255,0.2)' }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {event.participation_status === 'PRESENT' ? 'PRESENT' : 'INSCRIT'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.eventAnimator, { color: theme.textSecondary }]}>{event.animator}</Text>
                                <View style={styles.eventFooter}>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>{formatDate(event.date)}</Text>
                                    </View>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>{event.heure_debut?.slice(0, 5)}</Text>
                                    </View>
                                </View>
                            </View>
                        </BlurView>
                    ))
                ) : (
                    <Text style={[styles.noEvents, { color: theme.textSecondary }]}>Aucun événement enregistré.</Text>
                )}
            </ScrollView>

            <BottomNav id={id} nom={nom} />
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
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    header: {
        marginBottom: 30,
    },
    greeting: {
        fontSize: 25,
        fontFamily: "Insignia",
        textAlign: "center",
    },
    name: {
        color: "#FFF",
        fontSize: 20,
        fontFamily: "jokeyone",
        textTransform: "uppercase",
        textAlign: "center",
        marginTop: 10,
    },
    statsCard: {
        borderRadius: 30,
        padding: 30,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        overflow: "hidden",
    },
    percentageContainer: {
        position: "absolute",
        alignItems: "center",
    },
    percentageText: {
        fontSize: 42,
        fontWeight: "bold",
        fontFamily: "Comicy",
    },
    percentageLabel: {
        fontSize: 14,
        fontFamily: "Insignia",
        marginTop: 10,
    },
    summaryContainer: {
        flexDirection: "row",
        marginTop: 30,
        width: "100%",
        justifyContent: "center",
    },
    summaryItem: {
        alignItems: "center",
        paddingHorizontal: 25,
    },
    summaryDivider: {
        borderLeftWidth: 1,
        borderLeftColor: "rgba(255, 255, 255, 0.2)",
    },
    summaryValue: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "Comicy",
    },
    summaryLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 12,
        fontFamily: "Insignia",
    },
    sectionTitle: {
        color: "#FFF",
        fontSize: 20,
        fontFamily: "jokeyone",
        marginTop: 40,
        marginBottom: 20,
        textTransform: "uppercase",
    },
    eventItem: {
        borderRadius: 20,
        marginBottom: 15,
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.18)",
    },
    themeBar: {
        width: 6,
        height: "100%",
    },
    eventContent: {
        flex: 1,
        padding: 15,
    },
    eventHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    eventTitle: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "jokeyone",
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    statusText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "bold",
    },
    eventAnimator: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 13,
        marginBottom: 10,
        fontFamily: "Insignia",
    },
    eventFooter: {
        flexDirection: "row",
        gap: 15,
    },
    footerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    footerText: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 11,
    },
    noEvents: {
        textAlign: "center",
        marginTop: 20,
        fontFamily: "Insignia",
    },
});

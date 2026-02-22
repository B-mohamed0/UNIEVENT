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

const API_STATS = `${process.env.EXPO_PUBLIC_API_URL}/student/stats`;

const CircularProgress = ({ percentage, size = 180, strokeWidth = 15 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#FFFFFF"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.percentageContainer}>
                <Text style={styles.percentageText}>{percentage}%</Text>
                <Text style={styles.percentageLabel}>Présence</Text>
            </View>
        </View>
    );
};

export default function StudentStats({ route, navigation }) {
    const { id, nom } = route.params;
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require("../assets/project/est.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0, 0, 0, 0.38)" }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Mes Statistiques</Text>
                    <Text style={styles.name}>{nom}</Text>
                </View>

                {/* Circular Progress Card */}
                <BlurView intensity={20} tint="light" style={styles.statsCard}>
                    <CircularProgress percentage={stats?.attendancePercentage || 0} />

                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{stats?.totalEnrolled || 0}</Text>
                            <Text style={styles.summaryLabel}>Inscriptions</Text>
                        </View>
                        <View style={[styles.summaryItem, styles.summaryDivider]}>
                            <Text style={styles.summaryValue}>{stats?.totalAttended || 0}</Text>
                            <Text style={styles.summaryLabel}>Présences</Text>
                        </View>
                    </View>
                </BlurView>

                {/* History Title */}
                <Text style={styles.sectionTitle}>Historique des événements</Text>

                {/* Events List */}
                {stats?.enrolledEvents.length > 0 ? (
                    stats.enrolledEvents.map((event, index) => (
                        <BlurView key={`${event.id}-${index}`} intensity={20} tint="light" style={styles.eventItem}>
                            <LinearGradient
                                colors={THEME_GRADIENTS[event.theme_color] || THEME_GRADIENTS.default}
                                style={styles.themeBar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                            <View style={styles.eventContent}>
                                <View style={styles.eventHeader}>
                                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: event.participation_status === 'PRESENT' ? '#10b981' : 'rgba(255,255,255,0.2)' }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {event.participation_status === 'PRESENT' ? 'PRESENT' : 'INSCRIT'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.eventAnimator}>{event.animator}</Text>
                                <View style={styles.eventFooter}>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
                                        <Text style={styles.footerText}>{formatDate(event.date)}</Text>
                                    </View>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />
                                        <Text style={styles.footerText}>{event.heure_debut?.slice(0, 5)}</Text>
                                    </View>
                                </View>
                            </View>
                        </BlurView>
                    ))
                ) : (
                    <Text style={styles.noEvents}>Aucun événement enregistré.</Text>
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
        color: "rgba(255, 255, 255, 0.7)",
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
        color: "#FFF",
        fontSize: 42,
        fontWeight: "bold",
        fontFamily: "Comicy",
    },
    percentageLabel: {
        color: "rgba(255, 255, 255, 0.7)",
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
        borderColor: "rgba(255,255,255,0.1)",
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
        color: "rgba(255, 255, 255, 0.5)",
        textAlign: "center",
        marginTop: 20,
        fontFamily: "Insignia",
    },
});

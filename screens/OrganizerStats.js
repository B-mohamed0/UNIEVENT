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
    Modal,
    ActivityIndicator,
    FlatList,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import OrganizerNavbar from "../components/OrganizerNavbar";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const { width } = Dimensions.get("window");

export default function OrganizerStats({ route, navigation }) {
    const { id, nom } = route.params;
    const { isDarkMode, toggleDarkMode } = useThemeContext();

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
        bestTauxPresence: "0%",
        participantsPerMonth: new Array(12).fill(0),
        availableCategories: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const months = [
        { label: "Tous", value: "all" },
        { label: "Janv", value: "1" },
        { label: "Févr", value: "2" },
        { label: "Mars", value: "3" },
        { label: "Avril", value: "4" },
        { label: "Mai", value: "5" },
        { label: "Juin", value: "6" },
        { label: "Juil", value: "7" },
        { label: "Août", value: "8" },
        { label: "Sept", value: "9" },
        { label: "Oct", value: "10" },
        { label: "Nov", value: "11" },
        { label: "Déc", value: "12" },
    ];

    const fetchStats = async () => {
        setLoading(true);
        try {
            const url = `${API_URL}/organizer/stats/${id}?month=${selectedMonth}&category=${selectedCategory}`;
            console.log("Fetching stats from:", url);
            const response = await fetch(url);
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

    useEffect(() => {
        fetchStats();
    }, [id, selectedMonth, selectedCategory]);

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
                <ThemeToggle />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        onPress={() => setShowMonthModal(true)}
                        style={[styles.filterBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderColor: themeColors.cardBorder }]}
                    >
                        <Ionicons name="calendar-outline" size={16} color={themeColors.text} />
                        <Text style={[styles.filterText, { color: themeColors.text }]}>
                            {months.find(m => m.value === selectedMonth)?.label || "Mois"}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={themeColors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowCategoryModal(true)}
                        style={[styles.filterBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderColor: themeColors.cardBorder }]}
                    >
                        <Ionicons name="options-outline" size={16} color={themeColors.text} />
                        <Text style={[styles.filterText, { color: themeColors.text }]} numberOfLines={1}>
                            {selectedCategory === "all" ? "Toutes Catégories" : selectedCategory}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2E5BFF" />
                    </View>
                ) : (
                    <>
                        <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.chartCard, { borderColor: themeColors.cardBorder }]}>
                            <Text style={[styles.chartTitle, { color: themeColors.text }]}>Participants par mois</Text>
                            <View style={[styles.chartContainer, { borderBottomColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }]}>
                                {stats.participantsPerMonth.map((count, i) => {
                                    const maxCount = Math.max(...stats.participantsPerMonth, 1);
                                    const barHeight = (count / maxCount) * 120;
                                    return (
                                        <View key={i} style={styles.barGroup}>
                                            <View style={[styles.chartBar, { height: Math.max(barHeight, 5) }]} />
                                            <Text style={[styles.barMonth, { color: themeColors.subText }]}>{months[i + 1].label.substring(0, 1)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </BlurView>

                        <View style={styles.statsGrid}>
                            <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                                <View>
                                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Total Événements</Text>
                                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.totalEvenement}</Text>
                                </View>
                                <Ionicons name="calendar" size={32} color="#7286efff" opacity={0.6} />
                            </BlurView>

                            <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                                <View>
                                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Participants Totaux</Text>
                                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.totalParticipants}</Text>
                                </View>
                                <Ionicons name="people" size={32} color="#2D59D3" opacity={0.6} />
                            </BlurView>

                            <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                                <View>
                                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Meilleur Taux Présence</Text>
                                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.bestTauxPresence}</Text>
                                </View>
                                <Ionicons name="trophy" size={32} color="#FFD700" opacity={0.6} />
                            </BlurView>

                            <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.gridItem, { borderColor: themeColors.cardBorder }]}>
                                <View>
                                    <Text style={[styles.gridLabel, { color: themeColors.subText }]}>Taux de Présence Moyen</Text>
                                    <Text style={[styles.gridValue, { color: themeColors.text }]}>{stats.avgAttendance}%</Text>
                                </View>
                                <Ionicons name="trending-up" size={32} color="#4CAF50" opacity={0.6} />
                            </BlurView>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Modal de filtrage par Mois */}
            <Modal visible={showMonthModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMonthModal(false)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                        <Text style={styles.modalTitle}>SÉLECTIONNER UN MOIS</Text>
                        <FlatList
                            data={months}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, selectedMonth === item.value && styles.modalItemSelected]}
                                    onPress={() => {
                                        setSelectedMonth(item.value);
                                        setShowMonthModal(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, selectedMonth === item.value && { color: "#FFF", fontWeight: "700" }]}>
                                        {item.label === "Tous" ? "Tous les mois" : item.label}
                                    </Text>
                                    {selectedMonth === item.value && <Ionicons name="checkmark-circle" size={20} color="#2E5BFF" />}
                                </TouchableOpacity>
                            )}
                        />
                    </BlurView>
                </TouchableOpacity>
            </Modal>

            {/* Modal de filtrage par Catégorie */}
            <Modal visible={showCategoryModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryModal(false)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                        <Text style={styles.modalTitle}>SÉLECTIONNER UNE CATÉGORIE</Text>
                        <FlatList
                            data={["all", ...stats.availableCategories]}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, selectedCategory === item && styles.modalItemSelected]}
                                    onPress={() => {
                                        setSelectedCategory(item);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, selectedCategory === item && { color: "#FFF", fontWeight: "700" }]}>
                                        {item === "all" ? "Toutes Catégories" : item}
                                    </Text>
                                    {selectedCategory === item && <Ionicons name="checkmark-circle" size={20} color="#2E5BFF" />}
                                </TouchableOpacity>
                            )}
                        />
                    </BlurView>
                </TouchableOpacity>
            </Modal>
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
        alignSelf: "center",
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
    chartContainer: {
        height: 160,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.2)",
        paddingBottom: 5,
        paddingHorizontal: 5,
    },
    barGroup: {
        alignItems: "center",
        flex: 1,
    },
    barMonth: {
        fontSize: 10,
        marginTop: 5,
        fontFamily: "Insignia",
    },
    loadingContainer: {
        height: 300,
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "90%",
        maxHeight: "70%",
        borderRadius: 30,
        overflow: "hidden",
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    modalTitle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "jokeyone",
        textAlign: "center",
        marginBottom: 20,
        letterSpacing: 1,
    },
    modalItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 15,
        marginBottom: 8,
    },
    modalItemSelected: {
        backgroundColor: "rgba(46, 91, 255, 0.2)",
    },
    modalItemText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 16,
        fontFamily: "Insignia",
    },
});

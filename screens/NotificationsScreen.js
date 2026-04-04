import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useThemeContext } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const { width } = Dimensions.get("window");

export default function NotificationsScreen({ route, navigation }) {
  const { id, nom } = route.params;
  const { isDarkMode } = useThemeContext();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, readIds } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const isRead = (notif) => readIds.has(notif.id) || notif.is_read;

  const handleNotifPress = (notif) => {
    markAsRead(notif.id);
    if (notif.event_id) {
      navigation.navigate("Eventinfo", { eventId: notif.event_id, studentId: id, nom });
    }
  };

  // Modern Color Palette
  const theme = {
    bg: isDarkMode ? "#09090b" : "#f4f4f5", // Zinc 950 / Zinc 100
    card: isDarkMode ? "rgba(24, 24, 27, 0.7)" : "rgba(255, 255, 255, 0.8)",
    cardBorder: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
    text: isDarkMode ? "#fafafa" : "#18181b",
    subtext: isDarkMode ? "#a1a1aa" : "#71717a",
    primary: "#2563eb", // Blue 600
    primaryGlow: "rgba(37, 99, 235, 0.2)",
    iconBgRead: isDarkMode ? "#27272a" : "#e4e4e7",
    iconColorRead: isDarkMode ? "#a1a1aa" : "#52525b",
  };

  const renderItem = ({ item, index }) => {
    const read = isRead(item);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20, scale: 0.95 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{
          type: "spring",
          delay: index * 100,
          damping: 20,
          stiffness: 200,
        }}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNotifPress(item)}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 100}
            tint={isDarkMode ? "dark" : "light"}
            style={[
              styles.notifCard,
              {
                backgroundColor: read ? theme.card : isDarkMode ? "rgba(37, 99, 235, 0.15)" : "rgba(37, 99, 235, 0.08)",
                borderColor: read ? theme.cardBorder : "rgba(37, 99, 235, 0.3)",
              },
            ]}
          >
            {/* Indicateur de statut moderne */}
            <View style={styles.iconContainer}>
              {!read ? (
                <LinearGradient
                  colors={["#3b82f6", "#2563eb"]}
                  style={styles.iconCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="notifications" size={20} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: theme.iconBgRead }]}>
                  <Ionicons name="notifications-outline" size={20} color={theme.iconColorRead} />
                </View>
              )}
            </View>

            {/* Contenu textuel */}
            <View style={styles.textContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.notifTitle, { color: theme.text, fontWeight: read ? "600" : "800" }]}>
                  {item.title}
                </Text>
                {!read && <View style={styles.unreadDotPulse} />}
              </View>

              <Text style={[styles.notifBody, { color: theme.subtext, fontWeight: read ? "400" : "500" }]} numberOfLines={2}>
                {item.body}
              </Text>
              
              <View style={styles.footerRow}>
                <Ionicons name="time-outline" size={12} color={theme.subtext} />
                <Text style={[styles.notifTime, { color: theme.subtext }]}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* HEADER MODERNE (Minimaliste) */}
      <BlurView
        intensity={80}
        tint={isDarkMode ? "dark" : "light"}
        style={[styles.headerBlur, { borderBottomColor: theme.cardBorder }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount} NOUVELLES</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done" size={24} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} /> // Placeholder pour équilibrer
          )}
        </View>
      </BlurView>

      {/* LISTE */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 800 }}
            style={styles.emptyContainer}
          >
            <View style={[styles.emptyIconWrapper, { backgroundColor: isDarkMode ? "#18181b" : "#e4e4e7" }]}>
              <Ionicons name="notifications-off-outline" size={48} color={theme.subtext} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Tout est calme par ici</Text>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              Lorsque vous recevrez des annonces ou des alertes importantes, elles apparaîtront sur cette page.
            </Text>
          </MotiView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    paddingTop: Platform.OS === "ios" ? 50 : 30, // Ajustement pour Notch/StatusBar
    paddingBottom: 15,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  badgeContainer: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  markAllBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  notifCard: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    flex: 1,
    letterSpacing: -0.3,
  },
  unreadDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
    marginLeft: 10,
  },
  notifBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  notifTime: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "40%",
    paddingHorizontal: 30,
  },
  emptyIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});

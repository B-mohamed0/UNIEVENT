import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationsScreen({ route, navigation }) {
  const { id = null, nom = "" } = route.params || {};
  const { isDarkMode } = useThemeContext();
  const { notifications = [], unreadCount = 0, fetchNotifications, markAsRead, markAllAsRead, readIds = new Set() } = useNotifications() || {};
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (fetchNotifications) await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
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

  const isRead = (notif) => (readIds && readIds.has(notif.id)) || notif.is_read;

  const handleNotifPress = (notif) => {
    if (markAsRead) markAsRead(notif.id);
    if (notif.event_id) {
      navigation.navigate("Eventinfo", { eventId: notif.event_id, studentId: id, nom });
    }
  };

  // Modern Color Palette (No Blur, 100% safe React Native views)
  const theme = {
    bg: isDarkMode ? "#09090b" : "#f4f4f5", 
    card: isDarkMode ? "#18181b" : "#ffffff",
    cardUnread: isDarkMode ? "#1e293b" : "#eff6ff", // Zinc/Blueish tint for unread
    cardBorder: isDarkMode ? "#27272a" : "#e4e4e7",
    cardBorderUnread: isDarkMode ? "#3b82f6" : "#bfdbfe",
    text: isDarkMode ? "#fafafa" : "#18181b",
    subtext: isDarkMode ? "#a1a1aa" : "#71717a",
    primary: "#2563eb",
    iconBgRead: isDarkMode ? "#27272a" : "#f4f4f5",
    iconColorRead: isDarkMode ? "#a1a1aa" : "#a1a1aa",
    iconBgUnread: "#2563eb",
  };

  const renderItem = ({ item }) => {
    const read = isRead(item);

    return (
      <View style={{ marginBottom: 12 }}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNotifPress(item)}>
          <View
            style={[
              styles.notifCard,
              {
                backgroundColor: read ? theme.card : theme.cardUnread,
                borderColor: read ? theme.cardBorder : theme.cardBorderUnread,
              },
            ]}
          >
            {/* Indicateur de statut moderne */}
            <View style={styles.iconContainer}>
              {!read ? (
                <View style={[styles.iconCircle, { backgroundColor: theme.iconBgUnread }]}>
                  <Ionicons name="notifications" size={20} color="#fff" />
                </View>
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
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* HEADER MODERNE (Minimaliste et Safe) */}
      <View style={[styles.headerSafe, { backgroundColor: isDarkMode ? "#09090b" : "#f4f4f5", borderBottomColor: theme.cardBorder }]}>
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
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

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
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: theme.cardBorder }]}>
              <Ionicons name="notifications-off-outline" size={48} color={theme.subtext} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Tout est calme par ici</Text>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              Lorsque vous recevrez des annonces ou des alertes importantes, elles apparaîtront ici.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafe: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    zIndex: 10,
    // Ombre légère pour détacher le header
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 0, // marginBottom géré par le View parent
    overflow: "hidden",
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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

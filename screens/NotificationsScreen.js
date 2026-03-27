import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import BottomNav from "../components/navbar";

export default function NotificationsScreen({ route, navigation }) {
  const { id, nom } = route.params;
  const { isDarkMode } = useThemeContext();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, readIds } =
    useNotifications();
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
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const isRead = (notif) => readIds.has(notif.id) || notif.is_read;

  const handleNotifPress = (notif) => {
    markAsRead(notif.id);
    if (notif.event_id) {
      navigation.navigate("Eventinfo", { eventId: notif.event_id, studentId: id, nom });
    }
  };

  const theme = {
    bg: isDarkMode ? "#0f172a" : "#F1F5F9",
    card: isDarkMode ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)",
    text: isDarkMode ? "#F8FAFC" : "#0F172A",
    subtext: isDarkMode ? "rgba(248,250,252,0.6)" : "rgba(15,23,42,0.5)",
    border: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    unreadBg: isDarkMode ? "rgba(20,50,135,0.3)" : "rgba(20,50,135,0.06)",
  };

  const renderItem = ({ item }) => {
    const read = isRead(item);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleNotifPress(item)}
        style={[
          styles.notifCard,
          {
            backgroundColor: read ? theme.card : theme.unreadBg,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Icône */}
        <LinearGradient
          colors={read ? ["#6b7280", "#9ca3af"] : ["#143287", "#2E5BFF"]}
          style={styles.iconCircle}
        >
          <Ionicons name="notifications" size={18} color="#FFF" />
        </LinearGradient>

        {/* Contenu */}
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: theme.text, fontWeight: read ? "500" : "700" }]}>
            {item.title}
          </Text>
          <Text style={[styles.notifBody, { color: theme.subtext }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.notifTime, { color: theme.subtext }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        {/* Indicateur non lu */}
        {!read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER */}
      <LinearGradient
        colors={["#143287", "#2E5BFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </LinearGradient>

      {/* BADGE RÉSUMÉ */}
      {unreadCount > 0 && (
        <BlurView
          intensity={15}
          tint={isDarkMode ? "dark" : "light"}
          style={[styles.summaryBanner, { borderColor: theme.border }]}
        >
          <Ionicons name="ellipse" size={10} color="#2E5BFF" />
          <Text style={[styles.summaryText, { color: theme.text }]}>
            {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""} notification{unreadCount > 1 ? "s" : ""}
          </Text>
        </BlurView>
      )}

      {/* LISTE */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E5BFF"
            colors={["#143287"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              Aucune notification pour l'instant
            </Text>
          </View>
        }
      />
      <BottomNav id={id} nom={nom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "jokeyone",
    letterSpacing: 0.5,
  },
  markAllBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markAllText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Insignia",
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    overflow: "hidden",
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "Insignia",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 15,
    fontFamily: "Insignia",
  },
  notifBody: {
    fontSize: 13,
    fontFamily: "Insignia",
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "jokeyone",
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E5BFF",
    flexShrink: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Insignia",
    textAlign: "center",
  },
});

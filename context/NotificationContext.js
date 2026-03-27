import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { API_URL } from "../config";

// Configure comment traiter les notifications reçues quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext({
  unreadCount: 0,
  notifications: [],
  fetchNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ studentId, profId, children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState(new Set());
  const notificationListener = useRef();
  const responseListener = useRef();

  const userId = studentId || profId;
  const role = profId ? "PROFESSOR" : "STUDENT";

  // Demander les permissions et enregistrer le token push
  useEffect(() => {
    if (!userId) return;

    const registerPushToken = async () => {
      try {
        // Demander la permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("❌ Permission push notification refusée");
          return;
        }

        // Récupérer le token Expo Push
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "4ec36584-cd4f-4e62-bde3-1f0c6325f657",
        });
        const token = tokenData.data;
        console.log("📱 Expo Push Token:", token);

        // Envoyer le token au backend
        await fetch(`${API_URL}/notifications/save-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, profId, token }),
        });

        // Android : créer un canal de notification
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "UNIEVENT",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#143287",
          });
        }
      } catch (err) {
        console.error("Erreur enregistrement push token:", err);
      }
    };

    registerPushToken();
    fetchNotifications();

    // Écouter les notifications reçues en temps réel (app ouverte)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      fetchNotifications();
    });

    // Écouter les taps sur notification (app en arrière-plan / fermée)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      fetchNotifications();
    });

    // Poll toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/notifications/${userId}?role=${role}`);
      if (!res.ok) {
        console.warn(`⚠️ Erreur fetch notifications (${res.status}): possible HTML response`);
        return;
      }
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (parseErr) {
        console.error("❌ Erreur parse JSON notifications:", parseErr.message, "Content start:", text.substring(0, 50));
      }
    } catch (err) {
      console.error("Erreur fetch notifications:", err);
    }
  };

  const markAsRead = async (notifId) => {
    if (readIds.has(notifId)) return;
    try {
      await fetch(`${API_URL}/notifications/${notifId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, profId }),
      });
      setReadIds((prev) => new Set([...prev, notifId]));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur markAsRead:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, profId }),
      });
      setUnreadCount(0);
      // Rafraîchir la liste
      fetchNotifications();
    } catch (err) {
      console.error("Erreur markAllAsRead:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ unreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead, readIds }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

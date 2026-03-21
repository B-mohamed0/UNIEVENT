import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { registerForPushNotificationsAsync, sendPushTokenToBackend } from "../services/NotificationService";
import { API_URL } from "../config";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync("userToken");
            const storedUser = await SecureStore.getItemAsync("userData");

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to load auth state", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'Etudiant') {
            registerPush();
        }
    }, [user]);

    const registerPush = async () => {
        const token = await registerForPushNotificationsAsync();
        if (token && user) {
            await sendPushTokenToBackend(user.id, token, API_URL);
        }
    };

    const login = async (userData, userToken) => {
        try {
            await SecureStore.setItemAsync("userToken", userToken);
            await SecureStore.setItemAsync("userData", JSON.stringify(userData));
            setToken(userToken);
            setUser(userData);
            
            // Register for push notifications if it's a student
            if (userData.role === 'Etudiant') {
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    await sendPushTokenToBackend(userData.id, pushToken, API_URL);
                }
            }
        } catch (e) {
            console.error("Failed to save auth state", e);
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userData");
            setToken(null);
            setUser(null);
        } catch (e) {
            console.error("Failed to clear auth state", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

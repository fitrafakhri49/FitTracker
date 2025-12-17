import { WorkoutProvider } from "@/context/WorkoutContext";
import { WorkoutPlanProvider } from "@/context/workoutPlancontext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // ───── Setup Notification Permission ─────
  useEffect(() => {
    const registerForNotifications = async () => {
      try {
        // Cek permission
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          Alert.alert(
            "Notification Permission",
            "Permission not granted for notifications!"
          );
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };

    registerForNotifications();

    // Listener saat notifikasi diterima di foreground
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    // Listener saat user tap notifikasi
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification tapped:", response);
        // Bisa navigasi ke screen tertentu jika mau
      }
    );

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);
  // ───────────────────────────────────────
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <WorkoutProvider>
        <WorkoutPlanProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </WorkoutPlanProvider>
      </WorkoutProvider>
    </ThemeProvider>
  );
}

// home.tsx
import { supabase } from "@/lib/supabase";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const formatNumber = (num: number) => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export default function FitnessDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [greeting, setGreeting] = useState("Hello");
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    workoutsCompleted: 0,
    caloriesBurned: 0,
    hours: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Animasi untuk cards
  const [cardAnim] = useState(new Animated.Value(0));

  // Data stats yang akan ditampilkan
  const stats = [
    {
      id: 1,
      title: "WORKOUTS",
      value: userStats.workoutsCompleted,
      icon: "dumbbell",
      color: "#1D24CA",
    },
    {
      id: 2,
      title: "CALORIES",
      value: formatNumber(userStats.caloriesBurned),
      icon: "fire",
      color: "#FF6B6B",
    },
    {
      id: 3,
      title: "HOURS",
      value: userStats.hours,
      icon: "clock",
      color: "#4ECDC4",
    },
  ];
  const fetchWorkoutHistory = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      if (!sessionStr) return;

      const session = JSON.parse(sessionStr);
      const accessToken = session.access_token;

      const res = await axios.get(
        "http://192.168.18.247:3000/api/v1/workouts/history/exercises",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const json = res.data;
      if (!json.success) return;

      const history = json.data;

      // HITUNG STATS DARI HISTORY
      const uniqueWorkout = new Set(history.map((h: any) => h.id));

      const totalCalories = history.reduce(
        (sum: number, h: any) =>
          sum +
          (h.exercises?.reduce(
            (s: number, ex: any) => s + (ex.calories || 0),
            0
          ) || 0),
        0
      );

      setUserStats({
        workoutsCompleted: uniqueWorkout.size,
        caloriesBurned: totalCalories,
        hours: Math.floor(uniqueWorkout.size * 1.5),
      });

      const formatDuration = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return [hrs, mins, secs]
          .map((v) => v.toString().padStart(2, "0"))
          .join(":");
      };

      const mappedRecent = history.slice(0, 5).map((h: any) => ({
        id: h.id,
        name: h.workoutName,
        date: new Date(h.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        type: h.exercises[0]?.type || "Strength", // misal ambil type dari exercise pertama
        duration: formatDuration(h.duration || 0),
      }));

      setRecentWorkouts(mappedRecent);
    } catch (err: any) {
      console.error("Fetch workout history error:", err);
      if (err.response) {
        console.error("Response error:", err.response.data);
      }
    }
  };

  // Load session dari AsyncStorage
  const loadSession = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        console.log("Home: Loaded session for:", session.user?.email);
        return session;
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
    return null;
  };

  // Check authentication
  const checkAuth = async () => {
    try {
      setLoading(true);

      // Cek session dari Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        // Coba load dari AsyncStorage
        const savedSession = await loadSession();
        if (savedSession?.access_token) {
          // Set session di supabase client
          await supabase.auth.setSession({
            access_token: savedSession.access_token,
            refresh_token: savedSession.refresh_token,
          });

          // Coba get session lagi
          const {
            data: { session: newSession },
          } = await supabase.auth.getSession();
          if (newSession?.user) {
            await setUserData(newSession);
            return true;
          }
        }

        // Jika masih gagal, redirect ke login
        router.replace("/login");
        return false;
      }

      if (!session?.user) {
        router.replace("/login");
        return false;
      }

      await setUserData(session);
      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/login");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set user data dari session
  const setUserData = async (session: any) => {
    const user = session.user;
    setUserName(
      user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    );
    setUserEmail(user.email || "");

    await fetchUserStats(user.id);

    if (!hasFetched) {
      setHasFetched(true);
      await fetchWorkoutHistory();
    }
  };
  // Ambil data stats user
  const fetchUserStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user stats:", error);
      }

      if (data) {
        setUserStats({
          workoutsCompleted: data.total_workouts || 0,
          caloriesBurned: data.total_calories || 0,
          hours: Math.floor((data.total_workouts || 0) * 1.5), // Hitung estimated hours
        });
      }

      // Jika tidak ada data, gunakan defaults
      if (!data || error?.code === "PGRST116") {
        setUserStats({
          workoutsCompleted: 0,
          caloriesBurned: 0,
          hours: 0,
        });
      }
    } catch (error) {
      console.error("Error in fetchUserStats:", error);
      setUserStats({
        workoutsCompleted: 0,
        caloriesBurned: 0,
        hours: 0,
      });
    }
  };

  // Calculate streak days

  useEffect(() => {
    checkAuth();

    // Animasi masuk
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Listen untuk auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Home: Auth state changed:", event);

        if (event === "SIGNED_OUT") {
          router.replace("/login");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            await setUserData(session);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Tentukan greeting berdasarkan waktu
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Recent Workouts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT WORKOUTS</Text>
      </View>

      <View style={styles.workoutsContainer}>
        {recentWorkouts.map((workout) => (
          <TouchableOpacity
            key={`${workout.id}`} // pastikan key unik
            style={styles.workoutCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: "/workout-history/[id]",
                params: { id: workout.id },
              })
            }
          >
            <View style={styles.workoutHeader}>
              <View style={styles.workoutTypeBadge}>
                <FontAwesome5
                  name={workout.type === "Cardio" ? "running" : "weight"}
                  size={12}
                  color="#FFF"
                />
                <Text style={styles.workoutTypeText}>{workout.type}</Text>
              </View>
              <Text style={styles.workoutDate}>{workout.date}</Text>
            </View>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <View style={styles.workoutFooter}>
              <View style={styles.workoutStat}>
                <MaterialIcons name="timer" size={14} color="#888" />
                <Text style={styles.workoutStatText}>{workout.duration}</Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>VIEW</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 FITTRACKER</Text>
        <Text style={styles.footerSubText}>EVERY REP COUNTS</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  logoBadge: {
    backgroundColor: "#111",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#1D24CA",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 3,
    textShadowColor: "#1D24CA",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleAccent: {
    color: "#1D24CA",
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 5,
  },
  userInfoMini: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1D24CA",
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userInfoText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  welcomeCard: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#222",
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  welcomeTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
    flex: 1,
  },
  logoutMini: {
    padding: 5,
  },
  welcomeSubtitle: {
    color: "#888",
    fontSize: 14,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
  },
  statMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statMiniText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: "30%",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 10,
    color: "#888",
    fontWeight: "700",
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 2,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllText: {
    color: "#1D24CA",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  actionButton: {
    width: "30%",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  workoutsContainer: {
    marginBottom: 30,
  },
  workoutCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  emptyWorkoutCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
  },
  emptyWorkoutText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 20,
  },
  startWorkoutButton: {
    backgroundColor: "#1D24CA",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  startWorkoutText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  workoutTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1D24CA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  workoutTypeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  workoutDate: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  workoutName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  workoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  workoutStatText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  viewButton: {
    backgroundColor: "#1D24CA",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  goalCard: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#222",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  goalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#000",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1D24CA",
    borderRadius: 4,
  },
  progressText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  goalDescription: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: "#444",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footerSubText: {
    color: "#1D24CA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 5,
  },
});

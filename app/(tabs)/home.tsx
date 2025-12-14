// home.tsx
import { supabase } from "@/lib/supabase";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Format number untuk calories (pindahkan ke atas)
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

  const recentWorkouts = [
    {
      id: 1,
      name: "Chest Day",
      date: "Dec 10",
      type: "Strength",
      duration: "60 min",
    },
    {
      id: 2,
      name: "Leg Day",
      date: "Dec 9",
      type: "Strength",
      duration: "75 min",
    },
    {
      id: 3,
      name: "Cardio",
      date: "Dec 8",
      type: "Cardio",
      duration: "45 min",
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: "Start Workout",
      icon: "play-circle",
      color: "#1D24CA",
      onPress: () => console.log("Start Workout"),
    },
    {
      id: 2,
      title: "History",
      icon: "history",
      color: "#FF6B6B",
      onPress: () => router.push("/profile"),
    },
    {
      id: 3,
      title: "Profile",
      icon: "user",
      color: "#4ECDC4",
      onPress: () => router.push("/profile"),
    },
  ];

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

    // Set user name dan email
    setUserName(
      user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    );
    setUserEmail(user.email || "");

    // Ambil data stats user
    await fetchUserStats(user.id);
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
  const calculateStreak = () => {
    // Ini contoh sederhana, bisa diganti dengan logika yang lebih kompleks
    return userStats.workoutsCompleted > 20
      ? 7
      : userStats.workoutsCompleted > 10
      ? 3
      : userStats.workoutsCompleted > 0
      ? 1
      : 0;
  };

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      await AsyncStorage.multiRemove([
        "sb-session",
        "sb-access-token",
        "sb-refresh-token",
      ]);
      router.replace("/login");
    }
  };

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
      {/* Header dengan efek sporty */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoBadge}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="dumbbell" size={32} color="#1D24CA" />
        </TouchableOpacity>
        <Text style={styles.title}>
          FIT<Text style={styles.titleAccent}>TRACKER</Text>
        </Text>
        <Text style={styles.tagline}>PUSH YOUR LIMITS</Text>

        {/* User info mini */}
        <TouchableOpacity
          style={styles.userInfoMini}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <View style={styles.userInfoContent}>
            <FontAwesome5 name="user-circle" size={14} color="#1D24CA" />
            <Text style={styles.userInfoText}>{userName}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
          <Text style={styles.welcomeTitle}>
            {greeting}, {userName}!
          </Text>
          <TouchableOpacity style={styles.logoutMini} onPress={handleLogout}>
            <MaterialIcons name="logout" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <Text style={styles.welcomeSubtitle}>
          {userEmail ? `Logged in as ${userEmail}` : "Welcome to FitTracker!"}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Your performance is trending up! Keep pushing! 💪
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statMini}>
            <FontAwesome5 name="chart-line" size={12} color="#00FF00" />
            <Text style={styles.statMiniText}>
              {userStats.workoutsCompleted > 0
                ? "+12% this week"
                : "Start your first workout!"}
            </Text>
          </View>
          <View style={styles.statMini}>
            <FontAwesome5 name="trophy" size={12} color="#FFD700" />
            <Text style={styles.statMiniText}>
              {calculateStreak()} day streak
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards dengan animasi */}
      <Animated.View
        style={[
          styles.statsContainer,
          { transform: [{ translateY: cardTranslateY }] },
        ]}
      >
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => {
              if (stat.id === 3) router.push("/profile");
            }}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${stat.color}20` },
              ]}
            >
              <FontAwesome5 name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={action.onPress}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: `${action.color}20` },
              ]}
            >
              <FontAwesome5 name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Workouts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT WORKOUTS</Text>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Text style={styles.seeAllText}>See All →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.workoutsContainer}>
        {recentWorkouts.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={styles.workoutCard}
            activeOpacity={0.7}
            onPress={() => console.log("View workout:", workout.id)}
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

        {/* Empty state jika tidak ada workout */}
        {userStats.workoutsCompleted === 0 && (
          <View style={styles.emptyWorkoutCard}>
            <FontAwesome5 name="dumbbell" size={32} color="#666" />
            <Text style={styles.emptyWorkoutText}>No workouts yet</Text>
            <TouchableOpacity
              style={styles.startWorkoutButton}
              onPress={() => console.log("Start first workout")}
            >
              <Text style={styles.startWorkoutText}>
                START YOUR FIRST WORKOUT
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Today's Goal */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <FontAwesome5 name="bullseye" size={20} color="#1D24CA" />
          <Text style={styles.goalTitle}>TODAY'S GOAL</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(userStats.workoutsCompleted * 5, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.min(userStats.workoutsCompleted * 5, 100)}% Complete
          </Text>
        </View>
        <Text style={styles.goalDescription}>
          Target: {userStats.caloriesBurned}/2,000 calories burned • 10,000
          steps
        </Text>
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

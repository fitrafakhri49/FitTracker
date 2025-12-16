// profile.tsx
import { supabase } from "@/lib/supabase";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [cardAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    workoutsCompleted: 0,
    caloriesBurned: 0,
    streakDays: 0,
    goalsCompleted: 0,
  });
  const [backendWorkouts, setBackendWorkouts] = useState(0);

  const loadSession = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        console.log("Loaded session:", session.user?.email);
        return session;
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
    return null;
  };
  const fetchBackendWorkouts = async (userId: string) => {
    try {
      // Ganti URL sesuai servermu
      const response = await axios.get(
        "http://192.168.18.247:3000/api/v1/workouts/history/exercises",
        {
          // Sertakan token jika menggunakan auth Bearer
          headers: {
            Authorization: `Bearer ${
              (
                await supabase.auth.getSession()
              ).data.session?.access_token
            }`,
          },
        }
      );

      if (response.data?.success) {
        setBackendWorkouts(response.data.totalWorkouts || 0);

        // Update userStats juga jika mau
        setUserStats((prev) => ({
          ...prev,
          workoutsCompleted: response.data.totalWorkouts || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching backend workouts:", error);
    }
  };
  // Fungsi untuk mendapatkan data user dari Supabase
  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Cek apakah ada session yang valid
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
            await setUserFromSession(newSession);
            return;
          }
        }

        // Jika masih gagal, redirect ke login
        router.replace("/login");
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      await setUserFromSession(session);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data");
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };
  const setUserFromSession = async (session: any) => {
    const user = session.user;

    // Set data user
    setUserData({
      id: user.id,
      email: user.email,
      name:
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      avatar_url:
        user.user_metadata?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.email || "User"
        )}&background=1D24CA&color=fff`,
      created_at: user.created_at,
    });

    // Ambil data stats
    await fetchUserStats(user.id);
    await fetchBackendWorkouts(user.id);
  };

  // Fungsi untuk mengambil statistik user dari database
  const fetchUserStats = async (userId: string) => {
    try {
      // Ambil semua workout user dari tabel 'workouts'
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId);

      if (workoutsError) {
        console.error("Error fetching workouts:", workoutsError);
      }

      const totalWorkouts = workoutsData?.length || 0;
      const totalCalories =
        workoutsData?.reduce(
          (sum, workout) => sum + (workout.calories_burned || 0),
          0
        ) || 0;

      // Update userStats dengan total workout history
      setUserStats((prev) => ({
        ...prev,
        workoutsCompleted: totalWorkouts, // total workout history
        caloriesBurned: totalCalories,
        // Biarkan streakDays dan goalsCompleted tetap dari user_stats
        streakDays: prev.streakDays,
        goalsCompleted: prev.goalsCompleted,
      }));
    } catch (error) {
      console.error("Error in fetchUserStats:", error);
    }
  };

  // Format tanggal
  const formatJoinDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Format angka
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    {
      id: 1,
      title: "WORKOUTS",
      value: userStats.workoutsCompleted,
      icon: "dumbbell",
      color: "#1D24CA",
      description: "Total completed",
    },
    {
      id: 2,
      title: "CALORIES",
      value: formatNumber(userStats.caloriesBurned),
      icon: "fire",
      color: "#FF6B6B",
      description: "Total burned",
    },
    {
      id: 3,
      title: "STREAK",
      value: userStats.streakDays,
      icon: "bolt",
      color: "#FFD700",
      description: "Current days",
    },
    {
      id: 4,
      title: "GOALS",
      value: `${userStats.goalsCompleted}%`,
      icon: "bullseye",
      color: "#4ECDC4",
      description: "Completion rate",
    },
  ];

  const settingsOptions = [
    { id: 1, title: "Edit Profile", icon: "user-edit", color: "#1D24CA" },
    { id: 2, title: "Workout Plans", icon: "clipboard-list", color: "#FF6B6B" },
    { id: 3, title: "Notifications", icon: "bell", color: "#FFD700" },
    { id: 4, title: "Privacy", icon: "lock", color: "#4ECDC4" },
    { id: 5, title: "Help & Support", icon: "question-circle", color: "#888" },
    { id: 6, title: "About", icon: "info-circle", color: "#666" },
  ];

  useEffect(() => {
    fetchUserData();

    // Animasi masuk
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Listen untuk auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          router.replace("/login");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            setUserData({
              id: session.user.id,
              email: session.user.email,
              name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0] ||
                "User",
              avatar_url:
                session.user.user_metadata?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  session.user.email || "User"
                )}&background=1D24CA&color=fff`,
              created_at: session.user.created_at,
            });
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Error", error.message);
          } else {
            // Clear AsyncStorage jika perlu
            await AsyncStorage.removeItem("sb-token");
            router.replace("/login");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>Unable to load user data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
        <View style={styles.logoBadge}>
          <FontAwesome5 name="user" size={32} color="#1D24CA" />
        </View>
        <Text style={styles.title}>
          PROFILE<Text style={styles.titleAccent}>PAGE</Text>
        </Text>
        <Text style={styles.tagline}>YOUR FITNESS JOURNEY</Text>
      </View>

      {/* Profile Card */}
      <Animated.View
        style={[
          styles.profileCard,
          { transform: [{ translateY: cardTranslateY }] },
        ]}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: userData.avatar_url }}
              style={styles.avatar}
              defaultSource={{ uri: "https://i.pravatar.cc/300?img=12" }}
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                {userStats.workoutsCompleted > 50
                  ? "Expert"
                  : userStats.workoutsCompleted > 20
                  ? "Advanced"
                  : userStats.workoutsCompleted > 10
                  ? "Intermediate"
                  : "Beginner"}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.name}</Text>
            <View style={styles.userDetail}>
              <MaterialIcons name="email" size={14} color="#888" />
              <Text style={styles.userEmail}>{userData.email}</Text>
            </View>
            <View style={styles.userDetail}>
              <FontAwesome5 name="calendar-alt" size={12} color="#888" />
              <Text style={styles.userJoinDate}>
                Member since {formatJoinDate(userData.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {userStats.workoutsCompleted > 0
                ? Math.floor(userStats.workoutsCompleted / 4)
                : 0}
            </Text>
            <Text style={styles.quickStatLabel}>Weekly Avg</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {Math.floor(userStats.workoutsCompleted * 1.5)}
            </Text>
            <Text style={styles.quickStatLabel}>Monthly Hrs</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {formatNumber(
                Math.floor(
                  userStats.caloriesBurned / (userStats.workoutsCompleted || 1)
                )
              )}
            </Text>
            <Text style={styles.quickStatLabel}>Avg Cal</Text>
          </View>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>YOUR STATS</Text>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${stat.color}20` },
              ]}
            >
              <FontAwesome5 name={stat.icon} size={16} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={styles.statDescription}>{stat.description}</Text>
          </View>
        ))}
      </View>

      {/* Settings */}
      <Text style={styles.sectionTitle}>SETTINGS</Text>
      <View style={styles.settingsContainer}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.settingOption}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconContainer,
                  { backgroundColor: `${option.color}20` },
                ]}
              >
                <FontAwesome5
                  name={option.icon}
                  size={18}
                  color={option.color}
                />
              </View>
              <Text style={styles.settingText}>{option.title}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#888" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <View style={styles.logoutIconContainer}>
          <MaterialIcons name="logout" size={20} color="#FF6B6B" />
        </View>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 FITTRACKER</Text>
        <Text style={styles.footerSubText}>BE STRONGER THAN YESTERDAY</Text>
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
  header: {
    alignItems: "center",
    marginBottom: 30,
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
  errorContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#1D24CA",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  profileCard: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#222",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#1D24CA",
  },
  levelBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 1,
  },
  userDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  userEmail: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  userJoinDate: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 15,
  },
  quickStat: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  quickStatLabel: {
    color: "#888",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: "#222",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
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
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 10,
    color: "#888",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 5,
  },
  statDescription: {
    fontSize: 9,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
  achievementsScroll: {
    marginBottom: 30,
  },
  achievementCard: {
    width: 120,
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
  },
  achievementIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  achievementTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  achievementDate: {
    color: "#888",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  achievementBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#000",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContainer: {
    backgroundColor: "#111",
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  settingOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    padding: 18,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    gap: 10,
  },
  logoutIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF6B6B20",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
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

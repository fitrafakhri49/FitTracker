import { supabase } from "@/lib/supabase";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import axios from "axios";

// Format duration
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
};

// Format date
const formatWorkoutDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  }
};

export default function WorkoutScreen() {
  const router = useRouter();
  const [cardAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    avgDuration: 0,
  });

  // Workout categories
  const workoutCategories = [
    {
      id: 1,
      title: "All",
      icon: "layer-group",
      color: "#1D24CA",
      active: true,
    },
    {
      id: 2,
      title: "Strength",
      icon: "dumbbell",
      color: "#FF6B6B",
      active: false,
    },
    {
      id: 3,
      title: "Cardio",
      icon: "running",
      color: "#4ECDC4",
      active: false,
    },
    {
      id: 4,
      title: "Flexibility",
      icon: "spa",
      color: "#FFD700",
      active: false,
    },
  ];

  // Filter options
  const filterOptions = [
    { id: 1, title: "Recent", icon: "sort-amount-down" },
    { id: 2, title: "Longest", icon: "sort-amount-up" },
    { id: 3, title: "Calories", icon: "fire" },
    { id: 4, title: "Custom", icon: "sliders-h" },
  ];

  // Load session dari AsyncStorage
  const loadSession = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        return session;
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
    return null;
  };

  const addNewWorkout = async () => {
    try {
      // Ambil session Supabase

      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const accessToken = session?.access_token;

      // Contoh payload workout baru
      const payload = {
        name: "New Workout",
        exercises: [
          {
            exerciseId: "00257120-3a6a-4fd2-9e1a-511331e7818d", // ganti dengan exerciseId valid dari db
            sets: 4,
            reps: 12,
            rest: 60,
          },
        ],
      };

      const response = await axios.post(
        "http://192.168.18.247:3000/api/v1/workouts",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      console.log("Workout created:", response.data);
      // Refresh list workouts
      fetchWorkouts();
    } catch (err: any) {
      if (err.response) {
        // Error dari server
        console.error("Server error:", err.response.data);
      } else {
        // Error lain
        console.error("Error in addNewWorkout:", err.message);
      }
    }
  };
  // Check authentication
  const checkAuth = async () => {
    try {
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

      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/login");
      return false;
    }
  };

  // Fetch workouts data
  const fetchWorkouts = async () => {
    try {
      setLoading(true);

      // Ambil session dari AsyncStorage (Supabase)
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const accessToken = session?.access_token;

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      // Panggil backend Express
      const response = await axios.get(
        "http://192.168.18.247:3000/api/v1/workouts",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = response.data.data; // backend mengembalikan { success, data }

      if (data && data.length > 0) {
        // Mapping data sesuai frontend
        const mappedWorkouts = data.map((w: any) => ({
          id: w.id,
          workout_name: w.name,
          workout_type:
            w.WorkoutExercise.length > 0
              ? w.WorkoutExercise[0].exercise.exerciseType
              : "Strength",
          duration_minutes: w.WorkoutExercise.reduce(
            (sum: number, ex: any) => sum + ex.sets * ex.reps * 1, // dummy 1 min per rep
            0
          ),
          calories_burned: w.WorkoutExercise.reduce(
            (sum: number, ex: any) => sum + ex.sets * ex.reps * 5, // dummy 5 cal per rep
            0
          ),
          date: w.createdAt,
          notes: w.WorkoutExercise.map((ex: any) => ex.exercise.name).join(
            ", "
          ),
        }));

        setWorkouts(mappedWorkouts);

        // Stats
        const totalWorkouts = mappedWorkouts.length;
        const totalDuration = mappedWorkouts.reduce(
          (sum: any, w: any) => sum + w.duration_minutes,
          0
        );
        const totalCalories = mappedWorkouts.reduce(
          (sum: any, w: any) => sum + w.calories_burned,
          0
        );
        const avgDuration = totalWorkouts
          ? Math.round(totalDuration / totalWorkouts)
          : 0;

        setStats({
          totalWorkouts,
          totalDuration,
          totalCalories,
          avgDuration,
        });
      } else {
        setWorkouts([]);
      }
    } catch (error: any) {
      console.error("Error fetching workouts:", error);
      setWorkouts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fallback ke data dummy
  const useDummyData = () => {
    const dummyWorkouts = [
      {
        id: "1",
        workout_name: "Chest Day",
        workout_type: "Strength",
        duration_minutes: 60,
        calories_burned: 400,
        date: new Date().toISOString(),
        notes: "Bench press, incline press, flys",
      },
      {
        id: "2",
        workout_name: "Leg Day",
        workout_type: "Strength",
        duration_minutes: 75,
        calories_burned: 500,
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        notes: "Squats, lunges, deadlifts",
      },
      {
        id: "3",
        workout_name: "Morning Cardio",
        workout_type: "Cardio",
        duration_minutes: 45,
        calories_burned: 350,
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        notes: "Treadmill and cycling",
      },
      {
        id: "4",
        workout_name: "Full Body",
        workout_type: "Strength",
        duration_minutes: 80,
        calories_burned: 550,
        date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        notes: "Compound movements",
      },
      {
        id: "5",
        workout_name: "Yoga Session",
        workout_type: "Flexibility",
        duration_minutes: 50,
        calories_burned: 200,
        date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        notes: "Morning yoga flow",
      },
    ];

    setWorkouts(dummyWorkouts);

    // Calculate stats dari dummy data
    const totalWorkouts = dummyWorkouts.length;
    const totalDuration = dummyWorkouts.reduce(
      (sum, workout) => sum + workout.duration_minutes,
      0
    );
    const totalCalories = dummyWorkouts.reduce(
      (sum, workout) => sum + workout.calories_burned,
      0
    );
    const avgDuration = Math.round(totalDuration / totalWorkouts);

    setStats({
      totalWorkouts,
      totalDuration,
      totalCalories,
      avgDuration,
    });
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  // Get workout icon berdasarkan type
  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case "Strength":
        return "dumbbell";
      case "Cardio":
        return "running";
      case "Flexibility":
        return "spa";
      default:
        return "dumbbell";
    }
  };

  // Get workout color berdasarkan type
  const getWorkoutColor = (type: string) => {
    switch (type) {
      case "Strength":
        return "#1D24CA";
      case "Cardio":
        return "#FF6B6B";
      case "Flexibility":
        return "#4ECDC4";
      default:
        return "#1D24CA";
    }
  };

  useEffect(() => {
    fetchWorkouts();

    // Animasi masuk
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1D24CA"
          colors={["#1D24CA"]}
        />
      }
    >
      {/* Header dengan efek sporty */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoBadge}
          onPress={() => router.push("/home")}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="dumbbell" size={32} color="#1D24CA" />
        </TouchableOpacity>
        <Text style={styles.title}>
          WORKOUT<Text style={styles.titleAccent}>HISTORY</Text>
        </Text>
        <Text style={styles.tagline}>TRACK YOUR PROGRESS</Text>
      </View>

      {/* Stats Overview */}
      <Animated.View
        style={[
          styles.statsOverview,
          { transform: [{ translateY: cardTranslateY }] },
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#1D24CA20" },
              ]}
            >
              <FontAwesome5 name="calendar-check" size={20} color="#1D24CA" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statTitle}>Total Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FF6B6B20" },
              ]}
            >
              <FontAwesome5 name="clock" size={20} color="#FF6B6B" />
            </View>
            <Text style={styles.statValue}>
              {formatDuration(stats.totalDuration)}
            </Text>
            <Text style={styles.statTitle}>Total Time</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#4ECDC420" },
              ]}
            >
              <FontAwesome5 name="fire" size={20} color="#4ECDC4" />
            </View>
            <Text style={styles.statValue}>
              {stats.totalCalories >= 1000
                ? `${(stats.totalCalories / 1000).toFixed(1)}K`
                : stats.totalCalories}
            </Text>
            <Text style={styles.statTitle}>Calories Burned</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FFD70020" },
              ]}
            >
              <FontAwesome5 name="chart-line" size={20} color="#FFD700" />
            </View>
            <Text style={styles.statValue}>
              {formatDuration(stats.avgDuration)}
            </Text>
            <Text style={styles.statTitle}>Avg Duration</Text>
          </View>
        </View>
      </Animated.View>

      {/* Categories Filter */}
      <Text style={styles.sectionTitle}>CATEGORIES</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        {workoutCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              category.active && styles.categoryButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.categoryIconContainer,
                {
                  backgroundColor: `${category.color}${
                    category.active ? "40" : "20"
                  }`,
                },
              ]}
            >
              <FontAwesome5
                name={category.icon}
                size={18}
                color={category.active ? "#FFF" : category.color}
              />
            </View>
            <Text
              style={[
                styles.categoryText,
                category.active && styles.categoryTextActive,
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Options */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>YOUR WORKOUTS</Text>
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome5 name="filter" size={14} color="#1D24CA" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterOptions}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.filterOption}
            activeOpacity={0.7}
          >
            <FontAwesome5 name={option.icon} size={14} color="#888" />
            <Text style={styles.filterOptionText}>{option.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Workouts List */}
      <View style={styles.workoutsList}>
        {workouts.length > 0 ? (
          workouts.map((workout, index) => (
            <Animated.View
              key={workout.id}
              style={[
                styles.workoutCard,
                {
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30 * (index + 1), 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTypeContainer}>
                  <View
                    style={[
                      styles.workoutTypeIconContainer,
                      {
                        backgroundColor: `${getWorkoutColor(
                          workout.workout_type
                        )}20`,
                      },
                    ]}
                  >
                    <FontAwesome5
                      name={getWorkoutIcon(workout.workout_type)}
                      size={16}
                      color={getWorkoutColor(workout.workout_type)}
                    />
                  </View>
                  <Text style={styles.workoutTypeText}>
                    {workout.workout_type}
                  </Text>
                </View>
                <Text style={styles.workoutDate}>
                  {formatWorkoutDate(workout.date)}
                </Text>
              </View>

              <Text style={styles.workoutName}>{workout.workout_name}</Text>

              {workout.notes && (
                <Text style={styles.workoutNotes} numberOfLines={2}>
                  {workout.notes}
                </Text>
              )}

              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <MaterialIcons name="timer" size={16} color="#888" />
                  <Text style={styles.workoutStatText}>
                    {formatDuration(workout.duration_minutes)}
                  </Text>
                </View>
                <View style={styles.workoutStat}>
                  <FontAwesome5 name="fire" size={14} color="#888" />
                  <Text style={styles.workoutStatText}>
                    {workout.calories_burned} cal
                  </Text>
                </View>
                <View style={styles.workoutStat}>
                  <FontAwesome5 name="heartbeat" size={14} color="#888" />
                  <Text style={styles.workoutStatText}>
                    {workout.workout_type === "Cardio" ? "High" : "Medium"}
                  </Text>
                </View>
              </View>

              <View style={styles.workoutFooter}>
                <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
                  <MaterialIcons name="edit" size={16} color="#1D24CA" />
                  <Text style={styles.editButtonText}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareButton}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="share-alt" size={14} color="#666" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FontAwesome5 name="dumbbell" size={48} color="#444" />
            </View>
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptyDescription}>
              Start your fitness journey by adding your first workout!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.7}
              onPress={() => console.log("Add first workout")}
            >
              <FontAwesome5 name="plus" size={16} color="#000" />
              <Text style={styles.emptyButtonText}>ADD FIRST WORKOUT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add Workout Button */}
      <TouchableOpacity
        style={styles.addWorkoutButton}
        activeOpacity={0.7}
        onPress={() => router.push("/add-workout")}
      >
        <View style={styles.addButtonIcon}>
          <FontAwesome5 name="plus" size={20} color="#000" />
        </View>
        <Text style={styles.addButtonText}>ADD NEW WORKOUT</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 FITTRACKER</Text>
        <Text style={styles.footerSubText}>EVERY WORKOUT COUNTS</Text>
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
  statsOverview: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#222",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#000",
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
    fontSize: 20,
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
  categoriesScroll: {
    marginBottom: 25,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  categoryButtonActive: {
    backgroundColor: "#1D24CA",
    borderColor: "#1D24CA",
  },
  categoryIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  categoryText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: "#FFF",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1D24CA",
    gap: 6,
  },
  filterText: {
    color: "#1D24CA",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
    gap: 8,
  },
  filterOptionText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  workoutsList: {
    marginBottom: 25,
  },
  workoutCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  workoutTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  workoutTypeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  workoutTypeText: {
    color: "#FFF",
    fontSize: 12,
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
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 1,
  },
  workoutNotes: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 15,
    lineHeight: 18,
  },
  workoutStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#222",
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
  workoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D24CA20",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  editButtonText: {
    color: "#1D24CA",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 1,
  },
  emptyDescription: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D24CA",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
  },
  emptyButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  addWorkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    padding: 18,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "#1D24CA",
    borderStyle: "dashed",
    gap: 15,
  },
  addButtonIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1D24CA",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#1D24CA",
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

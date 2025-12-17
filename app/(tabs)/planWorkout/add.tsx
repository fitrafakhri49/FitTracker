//app/(tabs)/planWorkout/add.tsx
import { useWorkoutPlans } from "@/context/workoutPlancontext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Workout {
  id: string;
  name: string;
  type?: string;
  difficulty?: string;
}

export default function AddPlanWorkoutScreen() {
  const { addPlan } = useWorkoutPlans();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    fetchWorkouts();
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const raw = await AsyncStorage.getItem("sb-session");
      if (!raw) throw new Error("No session");

      const session = JSON.parse(raw);
      const token = session.access_token;

      const res = await axios.get(
        "http://192.168.18.247:3000/api/v1/workouts",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWorkouts(res.data.data);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitPlan = async () => {
    if (!selectedWorkout) return;

    setSubmitting(true);
    try {
      const raw = await AsyncStorage.getItem("sb-session");
      const token = JSON.parse(raw!).access_token;

      const res = await axios.post(
        "http://192.168.18.247:3000/api/v1/plan",
        {
          workoutId: selectedWorkout,
          date,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      addPlan(res.data.data);

      // Success animation feedback
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace("/(tabs)/planWorkout/index");
      });
    } catch (error) {
      console.error("Error submitting plan:", error);
      setSubmitting(false);
    }
  };

  const getWorkoutIcon = (workout: Workout) => {
    const type = workout.type?.toLowerCase() || "";
    if (type.includes("cardio")) return "run";
    if (type.includes("strength") || type.includes("weight")) return "dumbbell";
    if (type.includes("yoga") || type.includes("flexibility")) return "yoga";
    if (type.includes("hiit")) return "lightning-bolt";
    return "dumbbell";
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "#4ECDC4";
      case "intermediate":
        return "#1D24CA";
      case "advanced":
        return "#FF6B6B";
      default:
        return "#888";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan New Workout</Text>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={28}
              color="#1D24CA"
            />
          </View>
        </View>

        {/* Section 1: Select Workout */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#1D24CA" />
            <Text style={styles.sectionTitle}>SELECT WORKOUT</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose a workout to schedule
          </Text>

          {workouts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="dumbbell" size={50} color="#444" />
              <Text style={styles.emptyText}>No workouts available</Text>
              <Text style={styles.emptySubtext}>
                Create workouts first to schedule them
              </Text>
            </View>
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.workoutCard,
                    selectedWorkout === item.id && styles.selectedWorkoutCard,
                  ]}
                  onPress={() => setSelectedWorkout(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.workoutCardContent}>
                    <View style={styles.workoutIconContainer}>
                      <MaterialCommunityIcons
                        name={getWorkoutIcon(item) as any}
                        size={24}
                        color={selectedWorkout === item.id ? "#000" : "#1D24CA"}
                      />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text
                        style={[
                          styles.workoutName,
                          selectedWorkout === item.id &&
                            styles.selectedWorkoutName,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.difficulty && (
                        <View style={styles.difficultyContainer}>
                          <View
                            style={[
                              styles.difficultyDot,
                              {
                                backgroundColor: getDifficultyColor(
                                  item.difficulty
                                ),
                              },
                            ]}
                          />
                          <Text style={styles.difficultyText}>
                            {item.difficulty}
                          </Text>
                        </View>
                      )}
                    </View>
                    {selectedWorkout === item.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#1D24CA"
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Section 2: Select Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar" size={20} color="#1D24CA" />
            <Text style={styles.sectionTitle}>SELECT DATE</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            When do you want to do this workout?
          </Text>

          <View style={styles.datePickerContainer}>
            <View style={styles.dateDisplay}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={24}
                color="#FFF"
              />
              <Text style={styles.dateText}>
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              themeVariant="dark"
              textColor="#FFF"
              onChange={(_: any, d: any) => d && setDate(d)}
              style={styles.datePicker}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedWorkout || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={submitPlan}
          disabled={!selectedWorkout || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="calendar-plus"
                size={22}
                color="#000"
              />
              <Text style={styles.submitButtonText}>SCHEDULE WORKOUT</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Your scheduled workout will appear in the Plan tab
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
  animatedContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },
  headerIcon: {
    backgroundColor: "#111",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1D24CA",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
    marginBottom: 20,
  },
  emptyContainer: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
  },
  emptyText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  workoutCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  selectedWorkoutCard: {
    backgroundColor: "#1D24CA",
    borderColor: "#1D24CA",
  },
  workoutCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#1D24CA",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  selectedWorkoutName: {
    color: "#000",
    fontWeight: "900",
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  selectedIndicator: {
    backgroundColor: "#000",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerContainer: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  dateText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  datePicker: {
    height: 150,
  },
  submitButton: {
    backgroundColor: "#1D24CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#444",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  infoText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

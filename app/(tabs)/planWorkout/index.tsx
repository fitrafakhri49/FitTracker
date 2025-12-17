//app/(tabs)/planWorkout.tsx
// app/(tabs)/planWorkout/add.tsx
import { useWorkoutPlans } from "@/context/workoutPlancontext";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
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

interface Workout {
  id: string;
  name: string;
}

export default function AddPlanWorkoutScreen() {
  const { addPlan } = useWorkoutPlans();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchWorkouts();
    // Animation on mount
    Animated.spring(animation, {
      toValue: 1,
      tension: 20,
      friction: 8,
      useNativeDriver: true,
    }).start();
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
      // Add success animation before navigating back
      Animated.spring(animation, {
        toValue: 1.1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start(() => {
        router.replace("/(tabs)/planWorkout/index");
      });
    } catch (error) {
      console.error("Error submitting plan:", error);
    }
  };

  const handleWorkoutSelect = (id: string) => {
    setSelectedWorkout(id);
    // Bounce animation on selection
    Animated.sequence([
      Animated.spring(animation, {
        toValue: 1.02,
        tension: 150,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(animation, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatedStyle = {
    transform: [{ scale: animation }],
    opacity: animation,
  };

  if (loading) {
    return (
      <LinearGradient colors={["#000000", "#0A0A0A"]} style={styles.center}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#000000", "#0A0A0A", "#000000"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, animatedStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Your Workout</Text>
        </Animated.View>

        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Step 1 */}
          <View style={styles.section}>
            <View style={styles.stepIndicator}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Choose Workout</Text>
            </View>

            <View style={styles.workoutGrid}>
              {workouts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.workoutCard,
                    selectedWorkout === item.id && styles.workoutCardSelected,
                  ]}
                  onPress={() => handleWorkoutSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      selectedWorkout === item.id
                        ? ["#1D24CA", "#3A43E8"]
                        : ["#111", "#1A1A1A"]
                    }
                    style={styles.workoutCardGradient}
                  >
                    <MaterialIcons
                      name="fitness-center"
                      size={24}
                      color={selectedWorkout === item.id ? "#FFF" : "#1D24CA"}
                    />
                    <Text
                      style={[
                        styles.workoutCardText,
                        selectedWorkout === item.id &&
                          styles.workoutCardTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    {selectedWorkout === item.id && (
                      <View style={styles.selectedIndicator}>
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color="#1D24CA"
                        />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.section}>
            <View style={styles.stepIndicator}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Select Date</Text>
            </View>

            <View style={styles.datePickerContainer}>
              <LinearGradient
                colors={["#111", "#1A1A1A"]}
                style={styles.datePickerCard}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={24}
                  color="#1D24CA"
                  style={styles.dateIcon}
                />
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="compact"
                  themeVariant="dark"
                  accentColor="#1D24CA"
                  onChange={(_: any, d: any) => d && setDate(d)}
                  style={styles.datePicker}
                />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedWorkout && styles.submitButtonDisabled,
            ]}
            onPress={submitPlan}
            disabled={!selectedWorkout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selectedWorkout ? ["#1D24CA", "#3A43E8"] : ["#444", "#555"]
              }
              style={styles.submitGradient}
            >
              <MaterialIcons name="add-task" size={24} color="#FFF" />
              <Text style={styles.submitText}>Create Workout Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    marginLeft: 15,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1D24CA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  workoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  workoutCard: {
    width: "48%",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  workoutCardSelected: {
    borderColor: "#1D24CA",
  },
  workoutCardGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  workoutCardText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.5,
  },
  workoutCardTextSelected: {
    color: "#FFF",
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 2,
  },
  datePickerContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  datePickerCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  dateIcon: {
    marginBottom: 10,
  },
  datePicker: {
    alignSelf: "center",
  },
  dateText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  submitButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#1D24CA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    padding: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  submitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

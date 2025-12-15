import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  image?: string;
}

interface Workout {
  name: string;
  exercises: Exercise[];
}

interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
}

interface TimerData {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function StartWorkoutScreen() {
  const { workoutId } = useLocalSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [setsData, setSetsData] = useState<Record<number, SetData[]>>({});
  const [timer, setTimer] = useState<TimerData>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerInput, setTimerInput] = useState("00:00:00");
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showRestModal, setShowRestModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          let { hours, minutes, seconds } = prev;
          seconds += 1;

          if (seconds >= 60) {
            seconds = 0;
            minutes += 1;
          }
          if (minutes >= 60) {
            minutes = 0;
            hours += 1;
          }

          return { hours, minutes, seconds };
        });
      }, 1000) as unknown as number;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Rest timer interval
  useEffect(() => {
    let interval: number | null = null;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev !== null && prev <= 1) {
            if (interval) clearInterval(interval);
            setShowRestModal(false);
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000) as unknown as number;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimer]);

  useEffect(() => {
    if (!workoutId) {
      setApiError("No workout ID provided");
      setLoading(false);
      return;
    }

    const fetchWorkout = async () => {
      try {
        setLoading(true);
        setApiError(null);

        console.log("Fetching workout:", workoutId);

        const sessionStr = await AsyncStorage.getItem("sb-session");
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        const accessToken = session?.access_token;

        if (!accessToken) {
          setApiError("No authentication token found");
          router.replace("/login");
          return;
        }

        // Construct URL with error handling for malformed IDs
        const workoutIdStr = Array.isArray(workoutId)
          ? workoutId[0]
          : workoutId;
        const url = `http://192.168.18.247:3000/api/v1/workouts/${workoutIdStr}`;

        console.log("API URL:", url);

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        });

        console.log("API Response:", res.data);

        const data = res.data.data;
        if (!data) {
          setApiError("No workout data found in response");
          setWorkout(null);
          return;
        }

        const mappedWorkout: Workout = {
          name: data.name || "Untitled Workout",
          exercises: data.WorkoutExercise
            ? data.WorkoutExercise.map((ex: any) => ({
                name: ex.exercise?.name || "Unknown Exercise",
                sets: ex.sets || 3,
                reps: ex.reps || 10,
                weight: ex.weight || 0,
                image:
                  ex.exercise?.image ||
                  "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=150&h=150&fit=crop",
              }))
            : [],
        };

        setWorkout(mappedWorkout);

        // Initialize sets data
        const initialSetsData: Record<number, SetData[]> = {};
        mappedWorkout.exercises.forEach((ex, idx) => {
          initialSetsData[idx] = Array(ex.sets)
            .fill(null)
            .map(() => ({
              weight: ex.weight,
              reps: ex.reps,
              completed: false,
            }));
        });
        setSetsData(initialSetsData);
        setUserId(data.user_id);

        // Start timer automatically
        setIsTimerRunning(true);
      } catch (err: any) {
        console.error("Error fetching workout:", err);

        if (err.response) {
          // Server responded with error status
          if (err.response.status === 404) {
            setApiError(
              `Workout not found. Please check if workout ID "${workoutId}" exists.`
            );
          } else if (err.response.status === 401) {
            setApiError("Session expired. Please login again.");
            router.replace("/login");
          } else if (err.response.status === 500) {
            setApiError("Server error. Please try again later.");
          } else {
            setApiError(
              `Error ${err.response.status}: ${
                err.response.data?.message || "Unknown error"
              }`
            );
          }
        } else if (err.request) {
          // Request was made but no response
          setApiError(
            "Network error. Please check your connection and server URL."
          );
          console.error("Request URL:", err.config?.url);
          console.error("Server IP:", "192.168.18.247:3000");
        } else {
          // Other errors
          setApiError(`Error: ${err.message || "Failed to fetch workout"}`);
        }

        setWorkout(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  const toggleSet = (exerciseIdx: number, setIdx: number) => {
    const newSetsData = { ...setsData };
    if (newSetsData[exerciseIdx] && newSetsData[exerciseIdx][setIdx]) {
      newSetsData[exerciseIdx][setIdx].completed =
        !newSetsData[exerciseIdx][setIdx].completed;
      setSetsData(newSetsData);

      // If completing last set, show rest timer modal
      if (
        newSetsData[exerciseIdx][setIdx].completed &&
        setIdx === newSetsData[exerciseIdx].length - 1 &&
        exerciseIdx < (workout?.exercises.length || 0) - 1
      ) {
        startRestTimer();
      }
    }
  };

  const updateSetValue = (
    exerciseIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    value: string
  ) => {
    const newSetsData = { ...setsData };
    if (newSetsData[exerciseIdx] && newSetsData[exerciseIdx][setIdx]) {
      const num = parseFloat(value);
      newSetsData[exerciseIdx][setIdx][field] = isNaN(num) ? 0 : num;
      setSetsData(newSetsData);
    }
  };

  const formatTime = (time: TimerData) => {
    return `${time.hours.toString().padStart(2, "0")}:${time.minutes
      .toString()
      .padStart(2, "0")}:${time.seconds.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setTimer({ hours: 0, minutes: 0, seconds: 0 });
    setIsTimerRunning(false);
  };

  const saveCustomTime = () => {
    const [h, m, s] = timerInput.split(":").map(Number);
    if (h >= 0 && m >= 0 && m < 60 && s >= 0 && s < 60) {
      setTimer({ hours: h, minutes: m, seconds: s });
      setShowTimerModal(false);
    } else {
      Alert.alert(
        "Invalid Time",
        "Please enter a valid time format (HH:MM:SS)"
      );
    }
  };

  const startRestTimer = (seconds = 60) => {
    setRestTimer(seconds);
    setShowRestModal(true);
  };

  const skipRest = () => {
    setRestTimer(null);
    setShowRestModal(false);
  };

  const retryFetchWorkout = () => {
    setLoading(true);
    setApiError(null);
    // Re-trigger the useEffect by updating a state or force re-fetch
    const fetchAgain = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Re-run the fetch logic from useEffect
      setLoading(false);
    };
    fetchAgain();
  };

  const finishWorkout = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const accessToken = session?.access_token;

      if (!accessToken || !userId || !workoutId || !workout) {
        Alert.alert("Error", "Missing required data to finish workout");
        return;
      }

      // Prepare completed exercises data
      const completedExercises = workout.exercises.map((ex, exIdx) => {
        const exerciseSets = setsData[exIdx] || [];
        return {
          name: ex.name,
          sets: exerciseSets.map((set, setIdx) => ({
            setNumber: setIdx + 1,
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
          })),
        };
      });

      await axios.post(
        `http://192.168.18.247:3000/api/v1/workouts/${workoutId}/complete`,
        {
          user_id: userId,
          exercises: completedExercises,
          duration: formatTime(timer),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert(
        "Workout Completed!",
        `Great job! Time: ${formatTime(timer)}`,
        [
          {
            text: "Back to Workouts",
            onPress: () => router.replace("/workout"),
          },
        ]
      );
    } catch (err) {
      console.error("Error finishing workout:", err);
      Alert.alert(
        "Error",
        "Failed to save workout. Please check your connection."
      );
    }
  };

  const getProgressPercentage = () => {
    if (!workout) return 0;
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const completedSets = Object.values(setsData)
      .flat()
      .filter((set) => set?.completed).length;
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Unable to Load Workout</Text>
        <Text style={styles.errorMessage}>{apiError}</Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryFetchWorkout}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.debugInfo}>
          Workout ID: {workoutId}
          {"\n"}
          Server: 192.168.18.247:3000
        </Text>
      </View>
    );
  }

  if (!workout || workout.exercises.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="fitness-center" size={64} color="#888" />
        <Text style={styles.noExercisesText}>
          No exercises available in this workout
        </Text>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Timer */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <TouchableOpacity onPress={() => setShowTimerModal(true)}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </TouchableOpacity>
          <View style={styles.timerControls}>
            <TouchableOpacity onPress={toggleTimer} style={styles.timerButton}>
              <MaterialIcons
                name={isTimerRunning ? "pause" : "play-arrow"}
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetTimer} style={styles.timerButton}>
              <MaterialIcons name="refresh" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getProgressPercentage()}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}% Complete
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{workout.name}</Text>

        {workout.exercises.map((ex, exIdx) => (
          <View key={exIdx} style={styles.exerciseCard}>
            {/* Exercise Header with Image */}
            <View style={styles.exerciseHeader}>
              <Image
                source={{
                  uri:
                    ex.image ||
                    "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=150&h=150&fit=crop",
                }}
                style={styles.exerciseImage}
                onError={(e) => {
                  console.log("Image failed to load:", e.nativeEvent.error);
                  // You could set a local fallback state here
                }}
              />
              <View style={styles.exerciseHeaderText}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {ex.sets} sets • {ex.reps} reps • {ex.weight} kg
                </Text>
              </View>
            </View>

            {/* Sets Input */}
            <View style={styles.setsContainer}>
              {Array.from({ length: ex.sets }).map((_, setIdx) => (
                <View key={setIdx} style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {setIdx + 1}</Text>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.setTextInput}
                      keyboardType="numeric"
                      value={
                        setsData[exIdx]?.[setIdx]?.weight?.toString() ||
                        ex.weight.toString()
                      }
                      onChangeText={(text) =>
                        updateSetValue(exIdx, setIdx, "weight", text)
                      }
                    />
                    <Text style={styles.inputLabel}>kg</Text>
                  </View>

                  <Text style={styles.multiplyText}>×</Text>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.setTextInput}
                      keyboardType="numeric"
                      value={
                        setsData[exIdx]?.[setIdx]?.reps?.toString() ||
                        ex.reps.toString()
                      }
                      onChangeText={(text) =>
                        updateSetValue(exIdx, setIdx, "reps", text)
                      }
                    />
                    <Text style={styles.inputLabel}>reps</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      setsData[exIdx]?.[setIdx]?.completed &&
                        styles.checkButtonCompleted,
                    ]}
                    onPress={() => toggleSet(exIdx, setIdx)}
                  >
                    {setsData[exIdx]?.[setIdx]?.completed && (
                      <MaterialIcons name="check" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Rest Button */}
            {exIdx < workout.exercises.length - 1 && (
              <TouchableOpacity
                style={styles.restButton}
                onPress={() => startRestTimer(60)}
              >
                <MaterialIcons name="timer" size={16} color="#1D24CA" />
                <Text style={styles.restButtonText}>Start Rest Timer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
          <Text style={styles.finishText}>Finish Workout</Text>
          <MaterialIcons name="done-all" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Timer Edit Modal */}
      <Modal visible={showTimerModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Custom Time</Text>
            <TextInput
              style={styles.timeInput}
              value={timerInput}
              onChangeText={setTimerInput}
              placeholder="HH:MM:SS"
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTimerModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveCustomTime}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rest Timer Modal */}
      <Modal visible={showRestModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.restModalContent}>
            <Text style={styles.restTimerTitle}>Rest Time</Text>
            <Text style={styles.restTimerText}>
              {restTimer !== null ? `${restTimer}s` : "0s"}
            </Text>
            <View style={styles.restModalButtons}>
              <TouchableOpacity
                style={[styles.restModalButton, styles.skipButton]}
                onPress={skipRest}
              >
                <Text style={styles.skipButtonText}>Skip Rest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restModalButton, styles.addTimeButton]}
                onPress={() =>
                  setRestTimer((prev) => (prev !== null ? prev + 30 : 30))
                }
              >
                <Text style={styles.addTimeButtonText}>+30s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorTitle: {
    color: "#FF6B6B",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#1D24CA",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  backButtonError: {
    backgroundColor: "#333",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  debugInfo: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "monospace",
  },
  noExercisesText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 15,
    marginBottom: 25,
    textAlign: "center",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backButton: {
    marginRight: 20,
  },
  timerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerText: {
    color: "#1D24CA",
    fontSize: 28,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  timerControls: {
    flexDirection: "row",
    gap: 10,
  },
  timerButton: {
    backgroundColor: "#222",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#111",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1D24CA",
    borderRadius: 3,
  },
  progressText: {
    color: "#888",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },

  // Scroll Content
  scrollContainer: { flex: 1, padding: 20 },
  title: {
    color: "#1D24CA",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 25,
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: "#222", // Fallback background if image fails
  },
  exerciseHeaderText: {
    flex: 1,
  },
  exerciseName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 5,
  },
  exerciseMeta: {
    color: "#888",
    fontSize: 14,
  },

  // Sets Input
  setsContainer: {
    gap: 12,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  setNumber: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
    width: 50,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  setTextInput: {
    backgroundColor: "#222",
    color: "#FFF",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: "center",
    minWidth: 60,
    fontSize: 16,
  },
  inputLabel: {
    color: "#888",
    fontSize: 12,
    marginLeft: 4,
  },
  multiplyText: {
    color: "#1D24CA",
    fontSize: 20,
    fontWeight: "900",
    marginHorizontal: 10,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D24CA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkButtonCompleted: {
    backgroundColor: "#1D24CA",
  },

  // Rest Button
  restButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1D24CA",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
  },
  restButtonText: {
    color: "#1D24CA",
    fontWeight: "700",
    fontSize: 14,
  },

  // Finish Button
  finishButton: {
    backgroundColor: "#1D24CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
    marginBottom: 40,
    gap: 10,
  },
  finishText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#111",
    padding: 25,
    borderRadius: 20,
    width: "80%",
    borderWidth: 1,
    borderColor: "#222",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  timeInput: {
    backgroundColor: "#222",
    color: "#FFF",
    fontSize: 24,
    textAlign: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    fontFamily: "monospace",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#222",
  },
  cancelButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#1D24CA",
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },

  // Rest Modal
  restModalContent: {
    backgroundColor: "#111",
    padding: 30,
    borderRadius: 20,
    width: "70%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1D24CA",
  },
  restTimerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  restTimerText: {
    color: "#1D24CA",
    fontSize: 48,
    fontWeight: "900",
    fontFamily: "monospace",
    marginBottom: 25,
  },
  restModalButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  restModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#222",
  },
  skipButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  addTimeButton: {
    backgroundColor: "#1D24CA",
  },
  addTimeButtonText: {
    color: "#FFF",
    fontWeight: "900",
  },
});

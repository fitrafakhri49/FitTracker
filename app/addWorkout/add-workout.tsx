import { useWorkout } from "@/context/WorkoutContext";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function AddWorkoutScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const { selectedExercises, setSelectedExercises } = useWorkout();
  const [workoutName, setWorkoutName] = useState("");

  // Submit workout
  const addWorkout = async () => {
    if (!workoutName || selectedExercises.length === 0) {
      Alert.alert("Error", "Please enter workout name and select exercises");
      return;
    }

    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const payload = {
        name: workoutName,
        exercises: selectedExercises.map((ex: any) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          weight: ex.weight,
        })),
      };

      await axios.post("http://192.168.18.247:3000/api/v1/workouts", payload, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      setSelectedExercises([]); // reset setelah submit
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to add workout");
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={addWorkout} style={{ marginRight: 15 }}>
          <FontAwesome5 name="check" size={20} color="#1D24CA" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedExercises, workoutName]);

  const updateExercise = (id: string, field: string, value: number) => {
    setSelectedExercises((prev: any[]) =>
      prev.map((ex) => (ex.exerciseId === id ? { ...ex, [field]: value } : ex))
    );
  };

  const removeExercise = (id: string) => {
    setSelectedExercises((prev: any[]) =>
      prev.filter((ex) => ex.exerciseId !== id)
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={styles.label}>Workout Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter workout name"
        placeholderTextColor="#888"
        value={workoutName}
        onChangeText={setWorkoutName}
      />

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => router.push("/addWorkout/selectExercise")}
      >
        <Text style={styles.addBtnText}>+ Add Exercise</Text>
      </TouchableOpacity>

      {selectedExercises.map((ex: any) => (
        <View key={ex.exerciseId} style={styles.exerciseSettings}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>{ex.name}</Text>
            <TouchableOpacity onPress={() => removeExercise(ex.exerciseId)}>
              <FontAwesome5 name="trash" size={16} color="#ff4d4d" />
            </TouchableOpacity>
          </View>

          {["sets", "reps", "rest", "weight"].map((field) => (
            <View key={field} style={styles.rowField}>
              <Text style={styles.fieldLabel}>{field}:</Text>
              <TextInput
                style={styles.inputSmall}
                keyboardType="numeric"
                value={String(ex[field])}
                onChangeText={(val) =>
                  updateExercise(ex.exerciseId, field, Number(val))
                }
              />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
// Styles sama seperti sebelumnya
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  label: { color: "#FFF", fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    padding: 10,
    color: "#FFF",
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: "#111",
    color: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1D24CA",
  },
  filterText: { color: "#FFF" },
  exerciseItem: {
    padding: 12,
    backgroundColor: "#111",
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseLeft: { flexDirection: "row", alignItems: "center" },
  exerciseImage: { width: 50, height: 50, borderRadius: 25 },
  exerciseName: { color: "#FFF", fontWeight: "700" },
  exerciseTarget: { color: "#AAA", fontSize: 12 },
  exerciseInfo: { color: "#888", fontSize: 10 },
  loadMoreBtn: {
    padding: 12,
    alignItems: "center",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1D24CA",
    borderRadius: 10,
    marginVertical: 10,
  },
  exerciseSettings: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#222",
    padding: 10,
    borderRadius: 10,
  },
  exerciseSettingsTitle: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  rowField: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  fieldLabel: { color: "#FFF", width: 70, fontWeight: "600" },
  inputSmall: {
    width: 60,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 8,
    padding: 5,
    color: "#FFF",
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: "#1D24CA",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  addBtnText: { color: "#FFF", fontWeight: "700" },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  exerciseTitle: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

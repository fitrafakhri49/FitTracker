import { useWorkoutPlans } from "@/context/workoutPlancontext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  const [showPicker, setShowPicker] = useState(false); // kontrol visibilitas picker
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    const raw = await AsyncStorage.getItem("sb-session");
    if (!raw) throw new Error("No session");

    const session = JSON.parse(raw);
    const token = session.access_token;

    const res = await axios.get("http://192.168.18.247:3000/api/v1/workouts", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setWorkouts(res.data.data);
    setLoading(false);
  };

  const submitPlan = async () => {
    const raw = await AsyncStorage.getItem("sb-session");
    const token = JSON.parse(raw!).access_token;

    const res = await axios.post(
      "http://192.168.18.247:3000/api/v1/plan",
      { workoutId: selectedWorkout, date },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    addPlan(res.data.data); // langsung masuk list
    router.replace("/(tabs)/planWorkout");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pilih Workout</Text>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.workoutItem,
              selectedWorkout === item.id && styles.selected,
            ]}
            onPress={() => setSelectedWorkout(item.id)}
          >
            <Text style={styles.workoutItemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.title}>Pilih Tanggal</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, d) => {
            if (d) setDate(d);
            setShowPicker(false); // hide picker setelah pilih
          }}
        />
      )}

      <TouchableOpacity
        style={styles.submit}
        onPress={submitPlan}
        disabled={!selectedWorkout}
      >
        <Text style={styles.submitText}>Simpan Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: "#000" }, // background gelap
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#FFF",
  }, // putih
  workoutItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
    marginBottom: 8,
  },
  selected: { backgroundColor: "#1D24CA" }, // highlight biru
  workoutItemText: { color: "#FFF" }, // teks putih
  dateButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
    marginBottom: 10,
  },
  dateButtonText: { fontSize: 16, color: "#FFF" }, // teks putih
  submit: {
    backgroundColor: "#1D24CA", // biru
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: { color: "#FFF", textAlign: "center", fontWeight: "600" },
});

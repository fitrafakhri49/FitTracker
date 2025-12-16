import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WorkoutHistoryDetail {
  id: string;
  name: string;
  createdAt: string;
  exercises: {
    id: string;
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number | null;
  }[];
}

export default function WorkoutHistoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<WorkoutHistoryDetail | null>(null);

  const fetchDetail = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      if (!session?.access_token) return;

      const res = await fetch(
        `http://192.168.18.247:3000/api/v1/workout-history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const json = await res.json();
      if (json.success) {
        setWorkout(json.data);
      }
    } catch (error) {
      console.error("Fetch workout history detail error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1D24CA" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#FFF" }}>Workout not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{workout.name}</Text>
      <Text style={styles.date}>
        {new Date(workout.createdAt).toLocaleString()}
      </Text>

      {workout.exercises.map((ex) => (
        <View key={ex.id} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{ex.name}</Text>

          <View style={styles.row}>
            <Text style={styles.meta}>Sets: {ex.sets}</Text>
            <Text style={styles.meta}>Reps: {ex.reps}</Text>
            <Text style={styles.meta}>
              Weight: {ex.weight ? `${ex.weight} kg` : "-"}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  back: { color: "#1D24CA", marginBottom: 20 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  date: { color: "#888", marginBottom: 20 },
  exerciseCard: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  exerciseName: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12, marginTop: 8 },
  meta: { color: "#AAA", fontSize: 12 },
});

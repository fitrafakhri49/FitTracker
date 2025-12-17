import { useWorkoutPlans } from "@/context/workoutPlancontext";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PlanWorkoutScreen() {
  const router = useRouter();
  const { plans, loading, fetchPlans } = useWorkoutPlans();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={plans}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchPlans} />
      }
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/planWorkout/add")}
        >
          <Text style={styles.addText}>+ Add Workout Plan</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.date}>{new Date(item.date).toDateString()}</Text>

          <Text style={styles.workoutName}>{item.workout.name}</Text>

          {item.workout.WorkoutExercise.map((we) => (
            <Text key={we.id} style={styles.exercise}>
              • {we.exercise.name} — {we.sets}x{we.reps}
            </Text>
          ))}
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Belum ada workout plan</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  date: { fontSize: 14, color: "#888" },
  workoutName: { fontSize: 18, fontWeight: "bold", marginVertical: 6 },
  exercise: { fontSize: 14, marginLeft: 6 },
  empty: { textAlign: "center", marginTop: 40 },
  addButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  addText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});

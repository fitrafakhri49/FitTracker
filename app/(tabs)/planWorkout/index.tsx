// app/(tabs)/planWorkout/index.tsx
import { useWorkoutPlans } from "@/context/workoutPlancontext";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PlanWorkoutList() {
  const { plans, loading, fetchPlans } = useWorkoutPlans();
  const router = useRouter();

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.planCard} activeOpacity={0.7}>
      <View style={styles.planHeader}>
        <MaterialIcons name="fitness-center" size={24} color="#1D24CA" />
        <Text style={styles.planName}>{item.workout.name}</Text>
      </View>
      <Text style={styles.planDate}>
        {new Date(item.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={["#000", "#0A0A0A"]} style={styles.center}>
        <ActivityIndicator size="large" color="#1D24CA" />
        <Text style={styles.loadingText}>Loading workout plans...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#000", "#0A0A0A"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Workout Plans</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/planWorkout/add")}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workout plans yet</Text>
          <Text style={styles.emptySubtext}>Tap + to create a new plan</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
  },
  addButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#1D24CA",
  },
  planCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  planName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  planDate: {
    color: "#888",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});

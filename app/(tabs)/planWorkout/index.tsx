import { useWorkoutPlans } from "@/context/workoutPlancontext";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { schedulePushNotification } from "@/utils/notification";

export default function PlanWorkoutList() {
  const { plans, loading, fetchPlans, markWorkoutCompleted } =
    useWorkoutPlans();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  }, []);

  const handleStartWorkout = async (plan: any) => {
    router.push(`/startWorkout/${plan.workout.id}`);

    // Tandai workout sudah selesai di backend / context
    await markWorkoutCompleted(plan.id); // plan.id untuk referensi plan
    fetchPlans(); // refresh list supaya update status terlihat
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.planCard}
      activeOpacity={0.7}
      onPress={() => handleStartWorkout(item)}
    >
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
      {item.completed && (
        <Text style={styles.completedText}>Workout Completed ✅</Text>
      )}
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

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/planWorkout/add")}
          >
            <MaterialIcons name="add" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#28A745" }]}
            onPress={() =>
              schedulePushNotification(
                "Test Notification 🏋️",
                "This is a test notification from PlanWorkout screen"
              )
            }
          >
            <MaterialIcons name="notifications" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#FFF" },
  addButton: { padding: 8, borderRadius: 12, backgroundColor: "#1D24CA" },
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
  planName: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  planDate: { color: "#888", fontSize: 14 },
  completedText: { color: "#28A745", fontWeight: "700", marginTop: 5 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});

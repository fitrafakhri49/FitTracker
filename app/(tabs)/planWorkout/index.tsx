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

export default function PlanWorkoutList() {
  const { plans, loading, fetchPlans, markWorkoutCompleted } =
    useWorkoutPlans();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // initial fetch
  useEffect(() => {
    fetchPlans();
  }, []);

  // refresh otomatis saat screen kembali
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
    if (!plan.workout) return; // safety check

    router.push(`/startWorkout/${plan.workout.id}`);

    // Tandai workout sudah selesai di context
    await markWorkoutCompleted(plan.id); // plan.id untuk referensi plan
    fetchPlans(); // refresh list supaya update status terlihat
  };

  const renderItem = ({ item }: any) => {
    if (!item.workout) {
      return (
        <View style={styles.planCard}>
          <Text style={styles.noWorkoutText}>There is no workout Plan</Text>
          <TouchableOpacity
            style={[styles.addButton, { marginTop: 10 }]}
            onPress={() => router.push("/(tabs)/workout")}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Create Workout Plan
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
  };

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
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>There is no workout plan😅</Text>
          <Text style={styles.emptySubtext}>
            Tap the button below to create your first workout
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { marginTop: 20 }]}
            onPress={() => router.push("/planWorkout/add")}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Create Workout Plan
            </Text>
          </TouchableOpacity>
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
  noWorkoutText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
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

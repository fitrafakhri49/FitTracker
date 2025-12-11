import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FitnessDashboard() {
  const stats = [
    { id: 1, title: "Workouts", value: 24 },
    { id: 2, title: "Calories", value: 3500 },
    { id: 3, title: "Hours", value: 15 },
  ];

  const recentWorkouts = [
    { id: 1, name: "Chest Day", date: "Dec 10" },
    { id: 2, name: "Leg Day", date: "Dec 9" },
    { id: 3, name: "Cardio", date: "Dec 8" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Hello, Fakhri 👋</Text>
      <Text style={styles.subHeader}>Your Fitness Dashboard</Text>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.card}>
            <Text style={styles.cardValue}>{stat.value}</Text>
            <Text style={styles.cardTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Start Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Workouts */}
      <Text style={styles.sectionTitle}>Recent Workouts</Text>
      <View>
        {recentWorkouts.map((workout) => (
          <View key={workout.id} style={styles.workoutItem}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDate}>{workout.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subHeader: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    width: "30%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardTitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#888",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  workoutName: {
    fontSize: 16,
  },
  workoutDate: {
    color: "#888",
  },
});

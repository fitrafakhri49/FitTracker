import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function WorkoutScreen() {
  // Dummy data latihan
  const workouts = [
    { id: 1, name: "Chest Day", duration: "45 min", calories: 300 },
    { id: 2, name: "Leg Day", duration: "50 min", calories: 400 },
    { id: 3, name: "Cardio", duration: "30 min", calories: 250 },
    { id: 4, name: "Back & Biceps", duration: "40 min", calories: 350 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Workouts</Text>

      {workouts.map((workout) => (
        <View key={workout.id} style={styles.card}>
          <Text style={styles.cardTitle}>{workout.name}</Text>
          <Text style={styles.cardInfo}>Duration: {workout.duration}</Text>
          <Text style={styles.cardInfo}>Calories: {workout.calories}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardInfo: {
    fontSize: 14,
    color: "#555",
  },
});

import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  // Dummy user data
  const user = {
    name: "Fakhri Fitra",
    email: "fakhri@example.com",
    workoutsCompleted: 24,
    maintenanceCalories: 2500,
    profileImage: "https://i.pravatar.cc/150?img=12",
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.workoutsCompleted}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.maintenanceCalories}</Text>
          <Text style={styles.statLabel}>Maintenance Calories</Text>
        </View>
      </View>

      {/* About / Bio */}
      <View style={styles.aboutContainer}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.aboutText}>
          This is a dummy profile page. You can add user bio, achievements, and
          other details here.
        </Text>
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
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    color: "#555",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
    textAlign: "center",
  },
  aboutContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: "#555",
  },
});

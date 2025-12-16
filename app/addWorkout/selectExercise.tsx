// app/workouts/select-exercise.tsx
import { useWorkout } from "@/context/WorkoutContext";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function SelectExerciseScreen() {
  const router = useRouter();
  const { setSelectedExercises } = useWorkout();

  const [exercises, setExercises] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchExercises = async (pageNumber = 1, searchText = "") => {
    try {
      setLoading(true);
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const res = await axios.get(
        `http://192.168.18.247:3000/api/v1/exercises?page=${pageNumber}&limit=10&search=${searchText}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      const { data, pagination } = res.data;
      setExercises(pageNumber === 1 ? data : [...exercises, ...data]);
      setPage(pageNumber);
      setTotalPages(pagination.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const selectExercise = (exercise: any) => {
    setSelectedExercises((prev: any) => {
      if (prev.some((ex: any) => ex.exerciseId === exercise.id)) return prev;

      return [
        ...prev,
        {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: 3,
          reps: 10,
          rest: 60,
          weight: 0,
        },
      ];
    });

    router.back();
  };
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search exercise"
        placeholderTextColor="#888"
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          fetchExercises(1, text);
        }}
      />

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => selectExercise(item)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.targetMuscles.join(", ")}</Text>
            </View>
            <FontAwesome5 name="plus" color="#1D24CA" />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator />
          ) : page < totalPages ? (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={() => fetchExercises(page + 1, search)}
            >
              <Text style={{ color: "#1D24CA" }}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 15 },
  search: {
    backgroundColor: "#111",
    color: "#FFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  image: { width: 50, height: 50, borderRadius: 25 },
  name: { color: "#FFF", fontWeight: "700" },
  meta: { color: "#888", fontSize: 12 },
  loadMore: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1D24CA",
    alignItems: "center",
    marginVertical: 10,
  },
});

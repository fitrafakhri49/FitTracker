import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddWorkoutScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [workoutName, setWorkoutName] = useState("");
  const [exercisesList, setExercisesList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Debounce helper
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const fetchExercises = async (pageNumber = 1, search = "") => {
    try {
      setLoading(true);
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const response = await axios.get(
        `http://192.168.18.247:3000/api/v1/exercises?page=${pageNumber}&limit=10&search=${search}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );

      const { data, pagination } = response.data;
      setExercisesList((prev) =>
        pageNumber === 1 ? data : [...prev, ...data]
      );
      setTotalPages(pagination.totalPages);
      setPage(pageNumber);
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      Alert.alert("Error", "Failed to fetch exercises");
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((text: string) => {
      fetchExercises(1, text);
    }, 500),
    []
  );

  useEffect(() => {
    fetchExercises();
  }, []);

  // Fungsi addWorkout
  const addWorkout = async () => {
    if (!workoutName || selectedExercises.length === 0) {
      Alert.alert("Error", "Please enter workout name and select exercises");
      return;
    }
    try {
      const sessionStr = await AsyncStorage.getItem("sb-session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const payload = {
        name: workoutName,
        exercises: selectedExercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          weight: ex.weight,
        })),
      };

      await axios.post("http://192.168.18.247:3000/api/v1/workouts", payload, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      router.back();
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      Alert.alert("Error", "Failed to add workout");
    }
  };

  // Tombol Add Workout di header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 15 }} onPress={addWorkout}>
          <FontAwesome5 name="plus" size={20} color="#1D24CA" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedExercises, workoutName]);

  const toggleExercise = (exercise: any) => {
    const exists = selectedExercises.find(
      (ex) => ex.exerciseId === exercise.id
    );
    if (exists) {
      setSelectedExercises((prev) =>
        prev.filter((ex) => ex.exerciseId !== exercise.id)
      );
    } else {
      setSelectedExercises((prev) => [
        {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: 3,
          reps: 10,
          rest: 60,
          weight: 0, // ✅ TAMBAH
        },
        ...prev,
      ]);
    }
  };

  const updateExercise = (exerciseId: string, field: string, value: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const loadMore = () => {
    if (page < totalPages) fetchExercises(page + 1, searchText);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={styles.label}>Workout Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter workout name"
        placeholderTextColor="#888"
        value={workoutName}
        onChangeText={setWorkoutName}
      />

      <TextInput
        style={styles.searchInput}
        placeholder="Search exercise"
        placeholderTextColor="#888"
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          debouncedFetch(text);
        }}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>All Equipment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>All Muscles</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={exercisesList}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const selected = selectedExercises.find(
            (ex) => ex.exerciseId === item.id
          );
          return (
            <TouchableOpacity
              style={[
                styles.exerciseItem,
                selected && { backgroundColor: "#1D24CA20" },
              ]}
              onPress={() => toggleExercise(item)}
            >
              <View style={styles.exerciseLeft}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.exerciseImage}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseTarget}>
                    {item.targetMuscles.join(", ")}
                  </Text>
                  <Text style={styles.exerciseInfo}>
                    Body: {item.bodyParts.join(", ")} | Equip:{" "}
                    {item.equipments.join(", ")}
                  </Text>
                </View>
              </View>
              <FontAwesome5
                name="arrow-up-right-from-square"
                size={16}
                color="#FFF"
              />
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={() =>
          loading ? (
            <ActivityIndicator color="#1D24CA" />
          ) : page < totalPages ? (
            <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
              <Text style={{ color: "#1D24CA" }}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {selectedExercises.map((ex) => (
        <View key={ex.exerciseId} style={styles.exerciseSettings}>
          <Text style={styles.exerciseSettingsTitle}>
            {ex.name}{" "}
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Info",
                  "Sets: jumlah putaran\nReps: jumlah pengulangan tiap set\nRest: waktu istirahat antar set (detik)"
                )
              }
            >
              <FontAwesome5 name="info-circle" size={16} color="#FFF" />
            </TouchableOpacity>
          </Text>

          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Sets:</Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={String(ex.sets)}
              onChangeText={(val) =>
                updateExercise(ex.exerciseId, "sets", Number(val))
              }
            />
          </View>

          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Reps:</Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={String(ex.reps)}
              onChangeText={(val) =>
                updateExercise(ex.exerciseId, "reps", Number(val))
              }
            />
          </View>

          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Rest (s):</Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={String(ex.rest)}
              onChangeText={(val) =>
                updateExercise(ex.exerciseId, "rest", Number(val))
              }
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Weight:</Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={String(ex.weight ?? 0)}
              onChangeText={(val) =>
                updateExercise(ex.exerciseId, "weight", Number(val))
              }
            />
            <Text>KG</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// Styles sama seperti sebelumnya
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  label: { color: "#FFF", fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    padding: 10,
    color: "#FFF",
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: "#111",
    color: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1D24CA",
  },
  filterText: { color: "#FFF" },
  exerciseItem: {
    padding: 12,
    backgroundColor: "#111",
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseLeft: { flexDirection: "row", alignItems: "center" },
  exerciseImage: { width: 50, height: 50, borderRadius: 25 },
  exerciseName: { color: "#FFF", fontWeight: "700" },
  exerciseTarget: { color: "#AAA", fontSize: 12 },
  exerciseInfo: { color: "#888", fontSize: 10 },
  loadMoreBtn: {
    padding: 12,
    alignItems: "center",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1D24CA",
    borderRadius: 10,
    marginVertical: 10,
  },
  exerciseSettings: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#222",
    padding: 10,
    borderRadius: 10,
  },
  exerciseSettingsTitle: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  rowField: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  fieldLabel: { color: "#FFF", width: 70, fontWeight: "600" },
  inputSmall: {
    width: 60,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 8,
    padding: 5,
    color: "#FFF",
    textAlign: "center",
  },
});

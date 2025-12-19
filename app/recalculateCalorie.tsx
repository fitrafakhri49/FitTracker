import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ===== ENUMS BACKEND =====
type Gender = "MALE" | "FEMALE";
type Activity =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE"
  | "EXTRA_ACTIVE"; // Tambahkan EXTRA_ACTIVE

export default function RecalculateCaloriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ===== STATE =====
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [activity, setActivity] = useState<Activity | "">("");

  // ===== LOAD USER =====
  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem("sb-session");
      if (!raw) return;
      const token = JSON.parse(raw).access_token;

      const res = await axios.get(
        "http://192.168.18.247:3000/api/v1/users/me/maintenance-calories",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = res.data;

      if (user.birthDate) setBirthDate(new Date(user.birthDate));
      if (user.heightCm) setHeightCm(String(user.heightCm));
      if (user.weightKg) setWeightKg(String(user.weightKg));
      if (user.gender) setGender(user.gender);
      if (user.activity) setActivity(user.activity);
    } catch (err) {
      console.log("Failed to load user:", err);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // ===== PARSE DATE =====
  const parseBirthDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString();
  };

  // ===== SUBMIT =====
  const submit = async () => {
    try {
      setLoading(true);

      const raw = await AsyncStorage.getItem("sb-session");
      if (!raw) throw new Error("Not authenticated");
      const token = JSON.parse(raw).access_token;

      const payload = {
        birthDate: parseBirthDate(birthDate),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        gender: gender || null,
        activity: activity || null,
      };

      // VALIDASI
      if (
        !payload.birthDate ||
        !payload.heightCm ||
        !payload.weightKg ||
        !payload.gender ||
        !payload.activity
      ) {
        throw new Error("Please complete all required fields");
      }

      // UPDATE PROFILE
      await axios.put(
        "http://192.168.18.247:3000/api/v1/users/me/profile",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // RECALCULATE
      const res = await axios.post(
        "http://192.168.18.247:3000/api/v1/users/me/recalculate-calories",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        "Success",
        `Maintenance Calories: ${res.data.maintenanceCalories}`
      );
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recalculate Calories</Text>

      {/* DATE PICKER */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        <Text style={{ color: birthDate ? "#FFF" : "#666" }}>
          {birthDate ? birthDate.toDateString() : "Select Birth Date"}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setBirthDate(selectedDate);
          }}
        />
      )}

      {/* HEIGHT & WEIGHT */}
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={heightCm}
        onChangeText={setHeightCm}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={weightKg}
        onChangeText={setWeightKg}
      />

      {/* ACTIVITY PICKER */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={activity}
          onValueChange={(v) => setActivity(v)}
          style={styles.picker}
        >
          <Picker.Item label="Select Activity" value="" />
          <Picker.Item
            label="Sedentary: little or no exercise"
            value="SEDENTARY"
          />
          <Picker.Item label="Light: exercise 1-3 times/week" value="LIGHT" />
          <Picker.Item
            label="Moderate: exercise 4-5 times/week"
            value="MODERATE"
          />
          <Picker.Item
            label="Active: daily exercise or intense 3-4x/week"
            value="ACTIVE"
          />
          <Picker.Item
            label="Very Active: intense 6-7 times/week"
            value="VERY_ACTIVE"
          />
          <Picker.Item
            label="Extra Active: very intense daily / physical job"
            value="EXTRA_ACTIVE"
          />
        </Picker>
      </View>

      {/* GENDER PICKER */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          onValueChange={(v) => setGender(v)}
          style={styles.picker}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="MALE" />
          <Picker.Item label="Female" value="FEMALE" />
        </Picker>
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Save & Recalculate</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: "center",
    color: "#FFF",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: { color: "#FFF" },
  button: {
    backgroundColor: "#1D24CA",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#FFF", textAlign: "center", fontWeight: "600" },
});

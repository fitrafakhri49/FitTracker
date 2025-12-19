import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface WorkoutPlan {
  id: string;
  date: string;
  completed?: boolean; // tambahkan properti completed
  workout: {
    id: string;
    name: string;
    WorkoutExercise: {
      id: string;
      sets: number;
      reps: number;
      weight: number;
      exercise: { name: string };
    }[];
  };
}

interface WorkoutPlanContextType {
  plans: WorkoutPlan[];
  loading: boolean;
  fetchPlans: () => Promise<void>;
  addPlan: (plan: WorkoutPlan) => void;
  markWorkoutCompleted: (workoutId: string) => Promise<void>; // tambahkan fungsi
}

const WorkoutPlanContext = createContext<WorkoutPlanContextType | null>(null);

export const WorkoutPlanProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    const raw = await AsyncStorage.getItem("sb-session");
    if (!raw) throw new Error("No session");
    return JSON.parse(raw).access_token;
  };

  const fetchPlans = async () => {
    setLoading(true);
    const token = await getToken();

    const res = await axios.get("http://192.168.18.247:3000/api/v1/plan", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // tambahkan properti completed default false
    const plansWithCompleted = res.data.data.map((p: WorkoutPlan) => ({
      ...p,
      completed: p.completed || false,
    }));

    setPlans(plansWithCompleted);
    setLoading(false);
  };

  const addPlan = (plan: WorkoutPlan) => {
    setPlans((prev) => [plan, ...prev]);
  };

  // Fungsi menandai workout sudah selesai
  const markWorkoutCompleted = async (workoutId: string) => {
    try {
      const token = await getToken();

      // Patch ke backend (buat endpoint di backend nanti)
      await axios.patch(
        `http://192.168.18.247:3000/api/v1/plan/${workoutId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update state lokal
      setPlans((prev) =>
        prev.map((p) =>
          p.workout.id === workoutId ? { ...p, completed: true } : p
        )
      );
    } catch (err) {
      console.error("Error marking workout completed:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <WorkoutPlanContext.Provider
      value={{ plans, loading, fetchPlans, addPlan, markWorkoutCompleted }}
    >
      {children}
    </WorkoutPlanContext.Provider>
  );
};

export const useWorkoutPlans = () => {
  const ctx = useContext(WorkoutPlanContext);
  if (!ctx) throw new Error("useWorkoutPlans must be inside provider");
  return ctx;
};

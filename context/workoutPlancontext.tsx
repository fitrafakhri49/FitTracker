import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface WorkoutPlan {
  id: string;
  date: string;
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

    setPlans(res.data.data);
    setLoading(false);
  };

  const addPlan = (plan: WorkoutPlan) => {
    setPlans((prev) => [plan, ...prev]);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <WorkoutPlanContext.Provider
      value={{ plans, loading, fetchPlans, addPlan }}
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

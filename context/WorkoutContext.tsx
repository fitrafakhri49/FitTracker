import React, { createContext, useContext, useState } from "react";

const WorkoutContext = createContext<any>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);

  return (
    <WorkoutContext.Provider
      value={{ selectedExercises, setSelectedExercises }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used inside WorkoutProvider");
  }
  return context;
};

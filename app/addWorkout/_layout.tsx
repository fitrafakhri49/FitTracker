// app/addWorkout/_layout.tsx
import { WorkoutProvider } from "@/context/WorkoutContext";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <WorkoutProvider>
      <Stack />
    </WorkoutProvider>
  );
}

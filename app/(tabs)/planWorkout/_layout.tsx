import { WorkoutProvider } from "@/context/WorkoutContext";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <WorkoutProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </WorkoutProvider>
  );
}

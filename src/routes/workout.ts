import { Router } from "express";
// import { syncExercises } from "../controllers/exercise.controller";
import { createWorkout,deleteWorkout,getAllUserWorkout,getSpecificWorkout, saveWorkoutHistory,getAllHistoryWorkoutExercise } from "../controllers/workout";
import { requireAuth } from "../middlewares/auth";
// import {  requireAuth} from "../middlewares/auth";
const router = Router();

router.post("/workouts", requireAuth, createWorkout);
router.get("/workouts", requireAuth, getAllUserWorkout);
router.get("/workouts/:id", requireAuth, getSpecificWorkout);
router.delete("/workouts/:id", requireAuth, deleteWorkout);
router.post("/workouts/:id/history",requireAuth,saveWorkoutHistory)
router.get("/workouts/history/exercises",requireAuth,getAllHistoryWorkoutExercise);

export default router;

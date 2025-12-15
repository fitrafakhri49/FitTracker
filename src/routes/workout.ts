import { Router } from "express";
// import { syncExercises } from "../controllers/exercise.controller";
import { createWorkout,getAllUserWorkout } from "../controllers/workout";
import { requireAuth } from "../middlewares/auth";
// import {  requireAuth} from "../middlewares/auth";
const router = Router();

router.post("/workouts", requireAuth, createWorkout);
router.get("/workouts", requireAuth, getAllUserWorkout);
// router.get("/exercises/sync", syncExercises);


export default router;

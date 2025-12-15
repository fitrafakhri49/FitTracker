import { Router } from "express";
// import { syncExercises } from "../controllers/exercise.controller";
import { createWorkout,getAllUserWorkout,getSpecificWorkout } from "../controllers/workout";
import { requireAuth } from "../middlewares/auth";
// import {  requireAuth} from "../middlewares/auth";
const router = Router();

router.post("/workouts", requireAuth, createWorkout);
router.get("/workouts", requireAuth, getAllUserWorkout);
router.get("/workouts/:id", requireAuth, getSpecificWorkout);


export default router;

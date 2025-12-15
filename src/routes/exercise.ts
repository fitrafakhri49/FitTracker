import { Router } from "express";
import { syncExercises } from "../controllers/exercise.controller";

const router = Router();

router.post("/exercises/sync", syncExercises);
// router.get("/exercises/sync", syncExercises);

export default router;

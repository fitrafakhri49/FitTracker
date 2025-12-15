import { Router } from "express";
import { syncExercises } from "../controllers/exercise.controller";
import { getExercises } from "../controllers/exercise";

const router = Router();

router.post("/exercises/sync", syncExercises);
router.get("/exercises", getExercises);

export default router;

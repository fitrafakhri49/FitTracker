import { Router } from "express";
import { getPlanWorkout, planWorkout,completeWorkoutPlan } from "../controllers/planWorkout";
import { requireAuth } from "../middlewares/auth";

const router=Router()


router.post("/plan",requireAuth,planWorkout)
router.get("/plan",requireAuth,getPlanWorkout)
router.patch("/plan/:planId/complete", requireAuth, completeWorkoutPlan);


export default router
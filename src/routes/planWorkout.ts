import { Router } from "express";
import { getPlanWorkout, planWorkout } from "../controllers/planWorkout";
import { requireAuth } from "../middlewares/auth";

const router=Router()


router.post("/plan",requireAuth,planWorkout)
router.get("/plan",requireAuth,getPlanWorkout)

export default router
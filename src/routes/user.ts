import { Router } from "express";
import { recalculateCalories ,getMaintenanceCaloriesController,updateProfile} from "../controllers/user";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/users/me/recalculate-calories", requireAuth,recalculateCalories);
router.get("/users/me/maintenance-calories", requireAuth,getMaintenanceCaloriesController);
router.put("/users/me/profile", requireAuth,updateProfile );




export default router;


import { Request, Response } from "express";
import { updateMaintenanceCalories } from "../services/calorie";
export async function recalculateCalories(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
  
      const user = await updateMaintenanceCalories(userId);
  
      res.json({
        message: "Maintenance calories updated",
        maintenanceCalories: user.maintenanceCalories,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
  
import { Request, Response } from "express";
import {
  updateMaintenanceCalories,
 
} from "../services/calorie";
import { prisma } from "../prisma/client";

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



export async function getMaintenanceCaloriesController(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).user.id;

    // Ambil maintenanceCalories langsung dari DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        maintenanceCalories: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      maintenanceCalories: user.maintenanceCalories,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id; // diasumsikan sudah ada middleware auth yang menaruh user di req.user
      const { birthDate, heightCm, weightKg, gender, activity } = req.body;
  
      if (!birthDate || !heightCm || !weightKg || !gender || !activity) {
        return res.status(400).json({ message: "Incomplete profile data" });
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          birthDate: new Date(birthDate),
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          gender,
          activity,
        },
      });
  
      res.json({ message: "Profile updated", user: updatedUser });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
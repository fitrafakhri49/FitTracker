import { prisma }from "../prisma/client";
import { calculateMaintenanceCalories} from "../utils/calorie";

export async function updateMaintenanceCalories(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.birthDate || !user.heightCm || !user.weightKg || !user.activity || !user.gender) {
      throw new Error("Incomplete profile");
    }
  
    const calories = calculateMaintenanceCalories({
      gender: user.gender,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      birthDate: user.birthDate,
      activity: user.activity,
    });
  
    return prisma.user.update({
      where: { id: userId },
      data: { maintenanceCalories: calories },
    });
  }
  



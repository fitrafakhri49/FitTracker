import { Request,Response } from "express";
import { prisma }from "../prisma/client";

export async function planWorkout(req:Request,res:Response) {
    try {
        const user = (req as any).user;
  
        if (!user?.id) {
          return res.status(401).json({ message: "User not authenticated" });
        }
    
        
        let dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });
        
        if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                id: user.id,
                email: user.email || undefined, // sesuaikan dengan field Prisma
                name: user.user_metadata?.full_name || undefined, // opsional
            },
        });
        console.log("Created new user in Prisma:", dbUser);
    }
    const {workoutId,date}=req.body
    if (!workoutId || !date) {
        return res.status(400).json({
          message: "workoutId dan planDate wajib diisi",
        });
      }
      const workout = await prisma.workout.findFirst({
        where: {
          id: workoutId,
          user_id: user.id,
        },
      });
  
      if (!workout) {
        return res.status(404).json({
          message: "Workout tidak ditemukan",
        });
      }
      const plan = await prisma.workoutPlan.create({
        data: {
          userId: user.id,
          workoutId,
          date: new Date(date),
        },
        include: {
          workout: {
            include: {
              WorkoutExercise: {
                include: {
                  exercise: true,
                },
              },
            },
          },
        },
      });
      return res.status(201).json({
        success: true,
        message: "Workout berhasil dijadwalkan",
        data: plan,
      });
} catch (error:any) {
    console.error("Create workout plan error:", error);
    return res.status(500).json({ message: error.message });
    }
}

export async function getPlanWorkout(req:Request,res:Response) {
    try {
        const user = (req as any).user;
  
        if (!user?.id) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        const planWorkout=await prisma.workoutPlan.findMany({
            where:{userId:user.id},
            orderBy:{
                date:"asc"
            },
            include: {
                workout: {
                  include: {
                    WorkoutExercise: {
                      include: {
                        exercise: true,
                      },
                    },
                  },
                },
              },
        })

        return res.status(201).json({
            success: true,
            message: "Workout berhasil didapatkan",
            data: planWorkout,
          });

    } catch (error:any) {
        console.error("Create workout plan error:", error);
        return res.status(500).json({ message: error.message });
    }
}
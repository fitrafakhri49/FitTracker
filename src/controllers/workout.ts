import { prisma } from "../prisma/client";
import { Request,Response } from "express";
import { supabase } from "../supabase/client";
import { requireAuth,AuthRequest } from "../middlewares/auth";

export async function createWorkout(req: Request, res: Response) {
    try {
      const user = (req as any ).user;
  
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
  
      // Validasi body
      const { name, exercises } = req.body;
      if (!name || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({
          message: "Workout name and exercises are required",
        });
      }
  
      const exerciseIds = exercises.map((e) => e.exerciseId);
      const count = await prisma.exercise.count({
        where: { id: { in: exerciseIds } },
      });
  
      if (count !== exerciseIds.length) {
        return res.status(400).json({
          message: "One or more exercises not found",
        });
      }
  
      // Buat workout + relasi WorkoutExercise
      const workout = await prisma.workout.create({
        data: {
          name,
          user_id: user.id,
          WorkoutExercise: {
            create: exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              weight:ex.weight ?? null
            })),
          },
        },
        include: {
          WorkoutExercise: {
            include: {
              exercise: true,
            },
          },
        },
      });
  
      res.status(201).json({ success: true, data: workout });
    } catch (error: any) {
      console.error("Create workout error:", error);
      res.status(500).json({ message: error.message });
    }
  }


  export async function getAllUserWorkout(req:Request,res:Response) {
    try {
        const user = (req as any).user
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

          const workouts = await prisma.workout.findMany({
            where: { user_id: user.id },
            orderBy: { createdAt: "desc" },
            include: {
              WorkoutExercise: {
                include: {
                  exercise: true, // ambil detail exercise
                },
              },
            },
          });
      
          res.status(200).json({ success: true, data: workouts });
    } catch (error:any) {
        console.error("Create workout error:", error);
        res.status(500).json({ message: error.message });
    }
  }

  export async function getSpecificWorkout(req: Request, res: Response) {
    try {
        const user = (req as any).user
  
      if (!user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
  
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Workout ID is required" });
      }
  
      const workout = await prisma.workout.findFirst({
        where: {
          id,
          user_id: user.id,
        },
        include: {
          WorkoutExercise: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  exerciseType: true,
                  imageUrl: true,
                  videoUrl: true,
                  bodyParts: true,
                  equipments: true,
                  targetMuscles: true,
                  secondaryMuscles: true,
                },
              },
            },
          },
        },
      });
  
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
  
      res.status(200).json({
        success: true,
        data: workout,
      });
    } catch (error: any) {
      console.error("Get specific workout error:", error);
      res.status(500).json({ message: error.message });
    }
  }
  
  

  
  export async function saveWorkoutHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
  
      if (!user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
  
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Workout ID is required" });
      }
  
      // 1️⃣ Ambil workout + exercises
      const workout = await prisma.workout.findFirst({
        where: {
          id,
          user_id: user.id,
        },
        include: {
          WorkoutExercise: {
            include: {
              exercise: true,
            },
          },
        },
      });
  
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
  
      // 2️⃣ Simpan ke history (TRANSACTION)
      const history = await prisma.$transaction(async (tx) => {
        // header history
        const workoutHistory = await tx.workoutHistory.create({
          data: {
            user_id: user.id,
            workoutId: workout.id,
            name: workout.name,
          },
        });
  
        // detail exercises
        for (const we of workout.WorkoutExercise) {
          await tx.workoutHistoryExercise.create({
            data: {
              workoutHistoryId: workoutHistory.id,
              exerciseId: we.exerciseId!,
              name: we.exercise?.name || "Unknown Exercise",
              sets: we.sets,
              reps: we.reps,
              weight: we.weight ?? 0,
            },
          });
        }
  
        return workoutHistory;
      });
  
      return res.status(201).json({
        success: true,
        message: "Workout history saved successfully",
        data: history,
      });
    } catch (error: any) {
      console.error("Save workout history error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
  

  export async function deleteWorkout(req: Request, res: Response) {
    try {
      const user = (req as any).user;
  
      if (!user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
  
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Workout ID is required" });
      }
  
      // Pastikan workout milik user
      const workout = await prisma.workout.findFirst({
        where: {
          id,
          user_id: user.id,
        },
      });
  
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
  
      await prisma.$transaction([
        prisma.workoutExercise.deleteMany({
          where: {
            workoutId: id,
          },
        }),
        prisma.workout.delete({
          where: {
            id,
          },
        }),
      ]);
  
      return res.status(200).json({
        success: true,
        message: "Workout deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete workout error:", error);
      res.status(500).json({ message: error.message });
    }
  }
  
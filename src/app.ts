import  express  from "express";
import user from "./routes/auth";
import dotenv from "dotenv";
import cors from "cors";
import exerciseRoutes from "./routes/exercise";
import workoutRoutes from "./routes/workout";
import planRoutes from "./routes/planWorkout";
import notificationRoutes from "./routes/notification";
import userStatsRoute from "./routes/user";


dotenv.config();

const app=express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/v1/auth",user)
app.use("/api/v1",exerciseRoutes,workoutRoutes,planRoutes,notificationRoutes,userStatsRoute)


app.listen(process.env.PORT,()=>{
    console.log(`server is running at ${process.env.PORT}`)
    console.log(process.env.RAPID_API_KEY);
    

})
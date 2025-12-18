import { Router } from "express";
import { pushTokenNotification} from "../controllers/notifications";

const router = Router();

router.post("/send-notification", pushTokenNotification);

export default router;

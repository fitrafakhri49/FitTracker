import { Router } from "express";
import { login, register, googleVerify } from "../controllers/auth";
import { requireAuth } from "../middlewares/auth";
const router = Router();

router.post("/login", login);
router.post("/register", register);
// router.get('/profile', requireAuth, (req, res) => {
//   const user = (req as any).user;
//   res.json({ message: "Ini profile user", user });
// });
// router.get("/google", googleLogin);
// router.get("/callback", googleCallback);
router.post("/google-verify", googleVerify);

export default router;

import { Router } from "express";
import { loginUser, refreshAccessToken, registerUser, logoutUser } from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import {upload} from "../middlewares/multer.middlewares.js"



const router = Router()


router.route("/register").post(
    upload.fields([
      {
        name:"avatar",
        maxCount: 1,

      },
      {
        name:"coverImage",
        maxCount: 1,
      }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

























export default router;
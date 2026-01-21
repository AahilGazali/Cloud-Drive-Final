import { Router } from "express";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import folderRoutes from "./modules/folders/folder.routes.js";
import fileRoutes from "./modules/files/file.routes.js";
import trashRoutes from "./modules/trash/trash.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import shareRoutes from "./modules/shares/share.routes.js";
import feedbackRoutes from "./modules/feedback/feedback.routes.js";
import testRoutes from "./routes/test.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/folders", folderRoutes);
router.use("/files", fileRoutes);
router.use("/trash", trashRoutes);
router.use("/search", searchRoutes);
router.use("/shares", shareRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/test", testRoutes);

export default router;

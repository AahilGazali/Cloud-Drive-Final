import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { create, list, listAll, setup } from "./feedback.controller.js";

const router = Router();

// Setup endpoint (one-time table creation)
router.post("/setup", authenticate, setup);

// All feedback routes require authentication
router.post("/", authenticate, create);
router.get("/", authenticate, list);
router.get("/all", authenticate, listAll);

export default router;

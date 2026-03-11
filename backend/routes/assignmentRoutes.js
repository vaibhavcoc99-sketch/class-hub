const express = express();
import { createAssignment, getAssignments } from "../controllers/assignmentController.js";

const router = express.Router();
router.post("/", createAssignment);
router.get("/", getAssignments);

export default router;
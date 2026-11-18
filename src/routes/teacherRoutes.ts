import { Router, Request, Response } from "express";
import Teacher from "../models/Teacher";
import AppError from "../utils/AppError";

const router = Router();

// POST /teachers
// not part of the 6 required apis but we need some way to add teachers before creating sessions
router.post("/", async (req: Request, res: Response) => {
  const { fullName, email, specialization, experience } = req.body || {};

  if (!fullName || !email || !specialization || experience === undefined) {
    throw new AppError("fullName, email, specialization and experience are required", 400);
  }

  const teacher = await Teacher.create({ fullName, email, specialization, experience });

  res.status(201).json({ success: true, data: teacher });
});

export default router;

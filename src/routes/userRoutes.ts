import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Session from "../models/Session";
import AppError from "../utils/AppError";

const router = Router();

// POST /users
router.post("/", async (req: Request, res: Response) => {
  const { fullName, email, phone } = req.body || {};

  if (!fullName || !email || !phone) {
    throw new AppError("fullName, email and phone are required", 400);
  }

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) {
    throw new AppError("User with this email already exists", 409);
  }

  const user = await User.create({ fullName, email, phone });

  res.status(201).json({ success: true, data: user });
});

// GET /users/:id/sessions
router.get("/:id/sessions", async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const result = await Session.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "teachers",
        localField: "teacherId",
        foreignField: "_id",
        as: "teacher",
      },
    },
    { $unwind: "$teacher" },
    {
      $project: {
        startTime: 1,
        endTime: 1,
        status: 1,
        completedAt: 1,
        teacher: {
          _id: "$teacher._id",
          fullName: "$teacher.fullName",
          specialization: "$teacher.specialization",
        },
      },
    },
    {
      $facet: {
        upcomingSessions: [{ $match: { status: "BOOKED" } }, { $sort: { startTime: 1 } }],
        completedSessions: [{ $match: { status: "COMPLETED" } }, { $sort: { completedAt: -1 } }],
      },
    },
  ]);

  res.status(200).json({ success: true, data: result[0] });
});

export default router;

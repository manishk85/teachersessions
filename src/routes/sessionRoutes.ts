import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Session from "../models/Session";
import Teacher from "../models/Teacher";
import User from "../models/User";
import AppError from "../utils/AppError";

const router = Router();

// POST /sessions
router.post("/", async (req: Request, res: Response) => {
  const { teacherId, startTime, endTime } = req.body || {};

  if (!teacherId || !startTime || !endTime) {
    throw new AppError("teacherId, startTime and endTime are required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    throw new AppError("Invalid teacher id", 400);
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError("startTime and endTime must be valid dates", 400);
  }

  if (end <= start) {
    throw new AppError("endTime must be greater than startTime", 400);
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  const session = await Session.create({
    teacherId,
    startTime: start,
    endTime: end,
  });

  res.status(201).json({ success: true, data: session });
});

// GET /sessions/available?dateTimestamp=1763424000000
router.get("/available", async (req: Request, res: Response) => {
  const dateTimestamp = req.query.dateTimestamp;

  if (!dateTimestamp) {
    throw new AppError("dateTimestamp query param is required", 400);
  }

  let timestamp = Number(dateTimestamp);
  if (isNaN(timestamp)) {
    throw new AppError("dateTimestamp must be a number", 400);
  }

  // if someone sends seconds instead of milliseconds
  if (String(Math.floor(timestamp)).length <= 10) {
    timestamp = timestamp * 1000;
  }

  // whole day in UTC for the given timestamp
  const dayStart = new Date(timestamp);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const sessions = await Session.aggregate([
    {
      $match: {
        status: "AVAILABLE",
        startTime: { $gte: dayStart, $lt: dayEnd },
      },
    },
    {
      $lookup: {
        from: "teachers",
        localField: "teacherId",
        foreignField: "_id",
        as: "teacher",
      },
    },
    { $unwind: "$teacher" },
    { $sort: { startTime: 1 } },
    {
      $project: {
        startTime: 1,
        endTime: 1,
        status: 1,
        teacher: {
          _id: "$teacher._id",
          fullName: "$teacher.fullName",
          specialization: "$teacher.specialization",
          experience: "$teacher.experience",
        },
      },
    },
  ]);

  res.status(200).json({ success: true, count: sessions.length, data: sessions });
});

// POST /sessions/:id/book
router.post("/:id/book", async (req: Request, res: Response) => {
  const sessionId = req.params.id as string;
  const { userId } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError("Invalid session id", 400);
  }

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.status === "BOOKED") {
    throw new AppError("Session is already booked", 409);
  }

  if (session.status !== "AVAILABLE") {
    throw new AppError("Only available sessions can be booked", 400);
  }

  // checking status again inside the update so two requests at the same time
  // can't both book the same session
  const bookedSession = await Session.findOneAndUpdate(
    { _id: sessionId, status: "AVAILABLE" },
    { $set: { status: "BOOKED", userId: user._id } },
    { new: true }
  );

  if (!bookedSession) {
    throw new AppError("Session is already booked", 409);
  }

  res.status(200).json({ success: true, data: bookedSession });
});

// PATCH /sessions/:id/complete
router.patch("/:id/complete", async (req: Request, res: Response) => {
  const sessionId = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError("Invalid session id", 400);
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.status !== "BOOKED") {
    throw new AppError("Only booked sessions can be marked as completed", 400);
  }

  const completedSession = await Session.findOneAndUpdate(
    { _id: sessionId, status: "BOOKED" },
    { $set: { status: "COMPLETED", completedAt: new Date() } },
    { new: true }
  );

  if (!completedSession) {
    throw new AppError("Only booked sessions can be marked as completed", 400);
  }

  res.status(200).json({ success: true, data: completedSession });
});

export default router;

import express, { Response } from "express";
import {
  AuthenticatedRequest,
  authenticateJWT,
  authorizeRole,
} from "../middlewares/auth_middleware.js";
import { timeValidation } from "../validators/auth.js";
import { checkAppointmentOverlap } from "../middlewares/overlapCheck.js";
import { validationResult } from "express-validator";
import getLocalTime from "../utils/localTime.js";
import { Appointment, Role, Status } from "../models/database.js";

const appointmentRouter = express.Router();

// All appointments
appointmentRouter.get("/appointment", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const appointments = await Appointment.find().select("availabilityId studentId professorId startTime endTime status").sort({startTime: 1});
    if (!appointments.length) {
      res.status(404).json({ error: "No appointment found" });
      return;
    }
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error occurred while finding appointments" });
  }
});

// Appointment by ID
appointmentRouter.get("/appointment/id/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).select("availabilityId studentId professorId  startTime endTime status");
    if (!appointment) {
      res.status(404).json({ error: "No appointment found" });
      return;
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Error occurred while finding appointment" });
  }
});

// All personal appointments
appointmentRouter.get("/appointments/all", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.user?.id;
    const role = req.user?.role;
    const filter = role === Role.PROFESSOR ? { professorId: id } : { studentId: id };
    const appointments = await Appointment.find(filter).select("availabilityId studentId professorId startTime endTime status");

    if (!appointments.length) {
      res.status(404).json({ error: "No appointment found" });
      return;
    }
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// All personal upcoming appointments
appointmentRouter.get("/appointments/upComing", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.user?.id;
    const role = req.user?.role;
    const currentTime = getLocalTime();
    const filter = role === Role.PROFESSOR
      ? { professorId: id, endTime: { $gt: currentTime } }
      : { studentId: id, endTime: { $gt: currentTime } };

    const appointments = await Appointment.find(filter).select("availabilityId studentId professorId startTime endTime status");
    
    if (!appointments.length) {
      res.status(404).json({ error: "No appointment found" });
      return;
    }
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// New appointment by student
appointmentRouter.post(
  "/appointment/professor/:professorId/availability/:availabilityId",
  authenticateJWT,
  authorizeRole(Role.STUDENT),
  timeValidation,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      await checkAppointmentOverlap(req, res, async () => {
        const { professorId, availabilityId } = req.params;
        const studentId = req.user?.id;
        const { startTime, endTime } = req.body;

        const newAppointment = new Appointment({
          studentId,
          professorId,
          availabilityId,
          startTime,
          endTime,
        });

        await newAppointment.save();
        res.status(200).json({ message: "Appointment request has been sent" });
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Accepting and cancelling a request by professor
appointmentRouter.patch(
  "/appointment/professor/:appointmentId",
  authenticateJWT,
  authorizeRole(Role.PROFESSOR),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const { status } = req.body;

      if (!Object.values(Status).includes(status)) {
        res.status(400).json({ error: "Status value is not valid" });
        return;
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }

      if (appointment.status === status) {
        res.status(200).json({ message: `Appointment already ${status}` });
        return;
      }

      appointment.status = status;
      await appointment.save();

      res.status(200).json({ message: `Appointment is ${status}` });
    } catch (error) {
      res.status(500).json({ error: "Error occurred while processing appointment request" });
    }
  }
);

export default appointmentRouter;

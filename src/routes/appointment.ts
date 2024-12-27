import express,{ Response } from "express";
import { AuthenticatedRequest, authenticateJWT, authorizeRole } from "../middlewares/auth_middleware.ts";
import prisma from "../lib/prisma.ts";
import { Role } from "@prisma/client";
import { timeValidation } from "../validators/auth.ts";
import { checkAppointmentOverlap } from "../middlewares/overlapCheck.ts";

const appointmentRouter = express.Router();

// all appointments
appointmentRouter.get("/appointment", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const appointments = await prisma.appointment.findMany();
        if (!appointments) {
            res.status(404).json({ error: "No appointment found" });
            return;
        }
    
        res.status(200).json(appointments);
        return;
    } catch (error) {
        res.status(500).json({ error: "Error occured while finding appointments" });
        return;
    }
})

// appointment by id
appointmentRouter.get("/appointment/id/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id;

        const appointment = await prisma.appointment.findUnique({ where: {id} });
        if (!appointment) {
            res.status(404).json({ error: "No appointment found" });
            return;
        }

        res.status(200).json(appointment);
        return;
    } catch (error) {
        res.status(500).json({ error: "Error occured while finding appointment" });
        return;
    }
})

// new appointment by student
appointmentRouter.post("/appointment/professor/:professorId/availability/:availabilityId", authenticateJWT, authorizeRole(Role.STUDENT), timeValidation, checkAppointmentOverlap, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const professorId = req.params.professorId;
        const availabilityId = req.params.availabilityId;
        const studentId = req.user?.id as string;
    
        const { startTime, endTime } = req.body;
    
        await prisma.appointment.create({
            data: { studentId, professorId, availabilityId, startTime, endTime }
        });
    
        res.status(200).json({ message: "Appointment request has been sent" });
        return;
    } catch (error) {
        res.status(500).json({ error: "Error occured while scheduling appointment "});
        return;
    }
})


export default appointmentRouter;
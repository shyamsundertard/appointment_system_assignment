import express,{ Response } from "express";
import { AuthenticatedRequest, authenticateJWT, authorizeRole } from "../middlewares/auth_middleware.ts";
import prisma from "../lib/prisma.ts";
import { Role, Status } from "@prisma/client";
import { timeValidation } from "../validators/auth.ts";
import { checkAppointmentOverlap } from "../middlewares/overlapCheck.ts";
import { validationResult } from "express-validator";
import getLocalTime from "../utils/localTime.ts";

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

//all personal appointments
appointmentRouter.get("/appointments/all",authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = req.user?.id;
        const role = req.user?.role;
        let appointments;

        if (role == Role.PROFESSOR) {
            appointments = await prisma.appointment.findMany({
                where: {professorId: id}
            })
        }else {
            appointments = await prisma.appointment.findMany({
                where: { studentId: id}
            })
        }

        if (!appointments) {
            res.status(404).json({ error: "No appointment found" });
            return;
        }
        
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: "Interval server occured" });
    }
})

//all personal upcoming appointments
appointmentRouter.get("/Appointments/upComing",authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = req.user?.id;
        const role = req.user?.role;
        let appointments;

        const currentTime = getLocalTime();
        console.log(currentTime);   
        

        if (role == Role.PROFESSOR) {
            appointments = await prisma.appointment.findMany({
                where: {
                    professorId: id,
                    AND: [
                        {endTime: {gt: new Date(currentTime) }}
                    ]
                }
            });
        }else {
            appointments = await prisma.appointment.findMany({
                where: { 
                    studentId: id,
                    AND: [
                        {endTime: {gt: currentTime }}
                    ]
                }
            });
        }

        if (!appointments) {
            res.status(404).json({ error: "No appointment found" });
            return;
        }
        
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: "Interval server occured" });
    }
})

// new appointment by student
appointmentRouter.post("/appointment/professor/:professorId/availability/:availabilityId", authenticateJWT, authorizeRole(Role.STUDENT), timeValidation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    try {
        await checkAppointmentOverlap(req, res, async () => {
            const professorId = req.params.professorId;
            const availabilityId = req.params.availabilityId;
            const studentId = req.user?.id as string;
        
            const { startTime, endTime } = req.body;
        
            await prisma.appointment.create({
                data: { studentId, professorId, availabilityId, startTime, endTime }
            })
            .then(() => {
                res.status(200).json({ message: "Appointment request has been sent" });
            })
            .catch((error) => {
                res.status(500).json({ error: "Error occured while creating appointment" });
            });
        });    
    } catch (error) {
        res.status(500).json({ error: "Internal server error"});
    }
})

// accepting and cancelling a request by professor
appointmentRouter.patch("/appointment/professor/:appointmentId", authenticateJWT, authorizeRole(Role.PROFESSOR), async (req: AuthenticatedRequest, res:Response): Promise<void> => {
    try {
        const id = req.params.appointmentId;
        const {status} = req.body as { status: Status };

        if (!Object.values(Status).includes(status)) {
            res.status(400).json({ error: "Status value is not valid" });
            return;
        }

        const existingAppointment = await prisma.appointment.findUnique({
            where: {id}
        });
        if (!existingAppointment) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }

        if (existingAppointment.status == status) {
            res.status(200).json({ message: `Appointment already ${status}` });
            return;
        }

        await prisma.appointment.update({
            where: {id},
            data: {status: status as Status}
        });

        res.status(200).json({ message: `Appointment is ${status}`})
    } catch (error) {
        res.status(500).json({ error: "Error occured while processing appointment request"});
        return;
    }
})

export default appointmentRouter;
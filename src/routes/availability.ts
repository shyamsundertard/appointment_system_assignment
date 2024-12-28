import express, {Request, Response} from "express";
import prisma from "../lib/prisma.js";
import { AuthenticatedRequest, authenticateJWT, authorizeRole } from "../middlewares/auth_middleware.js";
import { timeValidation } from "../validators/auth.js";
import { validationResult } from "express-validator";
import { checkAvailabilityOverlap } from "../middlewares/overlapCheck.js";
import { Role } from "@prisma/client";
import getLocalTime from "../utils/localTime.js";

const availabilityRouter = express.Router();
const currentTime = getLocalTime();

//all time slots
availabilityRouter.get("/availability", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    try {
        const slots = await prisma.availability.findMany({
            include: {
                appointments: true,
            }
        });
        if (!slots || slots.length == 0) {
            res.status(404).json({ error: "No slot found" });
            return;
        }
        res.status(200).json(slots);
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error occured while finding availability slots!" });
    }
})

//slot by id
availabilityRouter.get("/availability/id/:id", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const slot = await prisma.availability.findUnique({
            where: {id} ,
            include: {appointments: true}
        });
        if (!slot) {
            res.status(404).json({ error: "Slot not exist" });
            return;
        }

        res.status(200).json(slot);
    } catch (error) {
        res.status(500).json({ error: "Error occured while finding time slot" });
    }
})

// active timeSlots by professorId for professor
availabilityRouter.get("/availability/professor/timeSlots/active", authenticateJWT, authorizeRole(Role.PROFESSOR), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       const professorId = req.user?.id;
       const slots = await prisma.availability.findMany({ 
        where: { 
            professorId,
            AND: [
                {endTime: { gt: new Date(currentTime)}}
            ]
         },
        include: {
            appointments: true
        }
       });
       if (!slots || slots.length == 0) {
        res.status(404).json({ error: "No availability slot found"});
        return;
       }

       res.status(200).json({
        timeSlots: slots.map(slot => ({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            appointments: slot.appointments
        }))
       });

       return;

    } catch (error) {
        res.status(500).json({ error: "Error fetching slots"});
    }
})

// all timeSlots by professorId for professor
availabilityRouter.get("/availability/professor/timeSlots", authenticateJWT, authorizeRole(Role.PROFESSOR), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       const professorId = req.user?.id;
       const slots = await prisma.availability.findMany({ 
        where: { professorId },
        include: {
            appointments: true
        }
       });
       if (!slots || slots.length == 0) {
        res.status(404).json({ error: "No availability slot found"});
        return;
       }

       res.status(200).json({
        timeSlots: slots.map(slot => ({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            appointments: slot.appointments
        }))
       });

       return;

    } catch (error) {
        res.status(500).json({ error: "Error fetching slots"});
    }
})

//active timeSlots by professorId for student
availabilityRouter.get("/availability/student/activeTimeSlots/:professorId", authenticateJWT, authorizeRole(Role.STUDENT), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       const professorId = req.params.id;
       const slots = await prisma.availability.findMany({ 
        where: { 
            professorId,
            AND: [
                {endTime: {gt: new Date(currentTime) }}
            ]
         },
        include: {
            appointments: true
        }
       });
       if (!slots || slots.length == 0) {
        res.status(404).json({ error: "No availability slot found"});
        return;
       }

       res.status(200).json({
        timeSlots: slots.map(slot => ({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            appointments: slot.appointments
        }))
       });

       return;

    } catch (error) {
        res.status(500).json({ error: "Error fetching slots"});
    }
})

//new slot
availabilityRouter.post("/availability/new", authenticateJWT, authorizeRole(Role.PROFESSOR), timeValidation, async (req:AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        await checkAvailabilityOverlap(req,res, async () => {
            const id = req.user?.id as string;
            const {startTime, endTime} = req.body;
            await prisma.availability.create({
                data: { professorId:id, startTime, endTime},
            })
            .then(() => {
                res.status(200).json({ message: "New slot created successfully"});
            })
            .catch((error) => {
                res.status(500).json({ error: "Error creating availability slot" });
            });
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
})

export default availabilityRouter;
import express, { Request, Response } from "express";
import { AuthenticatedRequest, authenticateJWT, authorizeRole } from "../middlewares/auth_middleware.js";
import { timeValidation } from "../validators/auth.js";
import { validationResult } from "express-validator";
import { checkAvailabilityOverlap } from "../middlewares/overlapCheck.js";
import getLocalTime from "../utils/localTime.js";
import { Availability, Role } from "../models/database.js";
const availabilityRouter = express.Router();
const currentTime = getLocalTime();

// All time slots
availabilityRouter.get("/availability", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    try {
        const slots = await Availability.find().select("professorId startTime endTime").sort({ startTime: 1 }).populate('appointments');
        if (!slots || slots.length == 0) {
            res.status(404).json({ error: "No slot found" });
            return;
        }
        res.status(200).json(slots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error occurred while finding availability slots!" });
    }
});

// Slot by ID
availabilityRouter.get("/availability/id/:id", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const slot = await Availability.findById(id).select("professorId startTime endTime").populate('appointments');
        if (!slot) {
            res.status(404).json({ error: "Slot not exist" });
            return;
        }
        res.status(200).json(slot);
    } catch (error) {
        res.status(500).json({ error: "Error occurred while finding time slot" });
    }
});

// Active timeSlots by professorId for professor
availabilityRouter.get("/availability/professor/timeSlots/active", authenticateJWT, authorizeRole(Role.PROFESSOR), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const professorId = req.user?.id;
        const slots = await Availability.find({ 
            professorId, 
            endTime: { $gt: new Date(currentTime) }
        }).sort({startTime: 1}).populate('appointments');
        
        if (!slots || slots.length == 0) {
            res.status(404).json({ error: "No availability slot found" });
            return;
        }

        res.status(200).json({
            activeTimeSlots: slots.map(slot => ({
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                appointments: slot.appointments
            }))
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching slots" });
    }
});

// All timeSlots by professorId for professor
availabilityRouter.get("/availability/professor/timeSlots", authenticateJWT, authorizeRole(Role.PROFESSOR), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const professorId = req.user?.id;
        const slots = await Availability.find({ professorId }).sort({startTime: 1}).populate('appointments');
        
        if (!slots || slots.length == 0) {
            res.status(404).json({ error: "No availability slot found" });
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
    } catch (error) {
        res.status(500).json({ error: "Error fetching slots" });
    }
});

// Active timeSlots by professorId for student
availabilityRouter.get("/availability/student/activeTimeSlots/:professorId", authenticateJWT, authorizeRole(Role.STUDENT), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const professorId = req.params.professorId;
        const slots = await Availability.find({ 
            professorId, 
            endTime: { $gt: new Date(currentTime) }
        }).sort({startTime: 1}).populate('appointments');
        
        if (!slots || slots.length == 0) {
            res.status(404).json({ error: "No availability slot found" });
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
    } catch (error) {
        res.status(500).json({ error: "Error fetching slots" });
    }
});

// New slot
availabilityRouter.post("/availability/new", authenticateJWT, authorizeRole(Role.PROFESSOR), timeValidation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        await checkAvailabilityOverlap(req, res, async () => {
            const id = req.user?.id as string;
            const { startTime, endTime } = req.body;
            const newSlot = new Availability({
                professorId: id,
                startTime,
                endTime
            });

            await newSlot.save()
                .then(() => {
                    res.status(200).json({ message: "New slot created successfully" });
                })
                .catch((error) => {
                    res.status(500).json({ error: "Error creating availability slot" });
                });
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default availabilityRouter;

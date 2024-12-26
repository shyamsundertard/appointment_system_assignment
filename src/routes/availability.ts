import express, {Request, Response} from "express";
import prisma from "../lib/prisma.ts";
import { AuthenticatedRequest, authenticateJWT, authorizeRole } from "../middlewares/auth_middleware.ts";
import { timeValidation } from "../validators/auth.ts";
import { validationResult } from "express-validator";
import { checkAvailabilityOverlap } from "../middlewares/overlapCheck.ts";

const availabilityRouter = express.Router();

//all time slots
availabilityRouter.get("/availability", async (req: Request, res: Response): Promise<void> => {
    try {
        const slots = await prisma.availability.findMany();
        if (!slots || slots.length == 0) {
            res.status(404).json({ error: "No slot found" });
            return;
        }
        res.status(200).json(slots);
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
})

//slot by id
availabilityRouter.get("/availability/id/:id", async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const slot = await prisma.availability.findUnique({ where: {id} });
        if (!slot) {
            res.status(404).json({ error: "Slot not exist" });
            return;
        }

        res.status(500).json(slot);
    } catch (error) {
        res.status(500).json(error);
    }
})

//new slot
availabilityRouter.post("/availability/new", authenticateJWT, authorizeRole("PROFESSOR"), timeValidation, checkAvailabilityOverlap, async (req:AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const id = req.user?.id as string;
    try {
        const {startTime, endTime} = req.body;
        await prisma.availability.create({
            data: { professorId:id, startTime, endTime},
        });

        res.status(200).json({ message: "New slot created successfully"});
    } catch (error) {
        res.status(500).json(error);
    }
})

export default availabilityRouter;
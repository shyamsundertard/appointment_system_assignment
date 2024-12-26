import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth_middleware.ts";
import prisma from "../lib/prisma.ts";
import getLocalTime from "../utils/localTime.ts";


export const checkAvailabilityOverlap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const professorId = req.user?.id;
        const {startTime, endTime} = req.body;

        if (startTime >= endTime) {
            res.status(400).json({ error: "End time must be after Start time"});
            return;
        }

        const currentTime = getLocalTime();
        
        if (new Date(startTime) <= new Date(currentTime)) {
            res.status(400).json({ error: "Cannot create availability slot in past" });
            return;
        }

        const existingSlots = await prisma.availability.findMany({
            where: {
                professorId,
                OR: [
                    {
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime: { gt: startTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { lt: endTime } },
                            { endTime: { gte: endTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { gte: startTime } },
                            { endTime: { lte: endTime } }
                        ]
                    }
                ]
            }
        });

        if (existingSlots.length > 0) {
            res.status(400).json({ 
                error: "Time slot overlaps with existing availability slot", 
                conflictingSlots: existingSlots.map(slot => ({
                    id: slot.id,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                }))
        });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: "Error checking availability slot overlap"});
    }
}
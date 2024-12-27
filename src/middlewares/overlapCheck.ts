import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth_middleware.ts";
import prisma from "../lib/prisma.ts";
import getLocalTime from "../utils/localTime.ts";
import { Role, Status } from "@prisma/client";


export const checkAvailabilityOverlap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const professorId = req.user?.id;
        const {startTime, endTime} = req.body;

        if (new Date(startTime) >= new Date(endTime)) {
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
                error: "Time slot overlaps with existing availability slots", 
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
        return;
    }
}

export const checkAppointmentOverlap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const studentId = req.user?.id;
        const availabilityId = req.params.availabilityId;
        const professorId = req.params.professorId;
        const { startTime, endTime } = req.body;

        if ( new Date(startTime) >= new Date(endTime) ) {
            res.status(500).json({ error: "End time must be after Start time" });
            return;
        }

        const currentTime = getLocalTime();
        if ( new Date(startTime) <= new Date(currentTime) ) {
            res.status(500).json({ error: "Cannot create appointment in past" });
            return;
        }

        const prof = await prisma.user.findUnique({
            where: {
                id: professorId,
                role: Role.PROFESSOR
            }
        });
        if (!prof) {
            res.status(404).json({ error: " No Professor found for given id"});
            return;
        }

        const slot = await prisma.availability.findUnique({
            where: { id: availabilityId , professorId}
        });
        if (!slot) {
            res.status(404).json({ error: "No availability slot found for given id and professor" });
            return;
        }
        if ( new Date(startTime) < slot.startTime || new Date(startTime) > slot.endTime || new Date(endTime) > slot.endTime || new Date(endTime) < slot.startTime) {
            res.status(400).json({
                error: "Professor is not available for this duration",
                availableWindow: {
                    startTime: slot.startTime,
                    endTime: slot.endTime
                }
            });
            return;
        }

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                availabilityId,
                OR: [
                    {
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime : { gt: startTime } }
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
                ],
                // status: Status.CONFIRMED
            }
        });
        if (existingAppointments.length > 0) {
            res.status(400).json({ error: "This appointment overlaps with existing appointments",
                conflictingAppointments: existingAppointments.map(appointment => ({
                    id: appointment.id,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime
                }))
            });
            return;
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Error checking appointment overlap" });
        return;
    }
}
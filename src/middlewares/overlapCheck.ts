import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth_middleware.js";
import getLocalTime from "../utils/localTime.js";
import { Availability, User, Appointment , Role , Status } from "../models/database.js";

export const checkAvailabilityOverlap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const professorId = req.user?.id;
        const { startTime, endTime } = req.body;

        if (new Date(startTime) >= new Date(endTime)) {
            res.status(400).json({ error: "End time must be after Start time" });
            return;
        }

        const currentTime = getLocalTime();

        if (new Date(startTime) <= new Date(currentTime)) {
            res.status(400).json({ error: "Cannot create availability slot in past" });
            return;
        }

        const existingSlots = await Availability.find({
            professorId,
            $or: [
                {
                    $and: [
                        { startTime: { $lte: startTime } },
                        { endTime: { $gt: startTime } }
                    ]
                },
                {
                    $and: [
                        { startTime: { $lt: endTime } },
                        { endTime: { $gte: endTime } }
                    ]
                },
                {
                    $and: [
                        { startTime: { $gte: startTime } },
                        { endTime: { $lte: endTime } }
                    ]
                }
            ]
        }).sort({startTime: 1});

        if (existingSlots.length > 0) {
            res.status(400).json({ 
                error: "Time slot overlaps with existing availability slots", 
                conflictingSlots: existingSlots.map(slot => ({
                    id: slot._id,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                }))
            });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: "Error checking availability slot overlap" });
        return;
    }
};

export const checkAppointmentOverlap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const studentId = req.user?.id;
        const availabilityId = req.params.availabilityId;
        const professorId = req.params.professorId;
        const { startTime, endTime } = req.body;

        if (new Date(startTime) >= new Date(endTime)) {
            res.status(400).json({ error: "End time must be after Start time" });
            return;
        }

        const currentTime = getLocalTime();
        if (new Date(startTime) <= new Date(currentTime)) {
            res.status(400).json({ error: "Cannot create appointment in past" });
            return;
        }

        const prof = await User.findOne({
            _id: professorId,
            role: Role.PROFESSOR
        });
        if (!prof) {
            res.status(404).json({ error: "No Professor found for given id" });
            return;
        }

        const slot = await Availability.findOne({
            _id: availabilityId,
            professorId
        });
        if (!slot) {
            res.status(404).json({ error: "No availability slot found for given id and professor" });
            return;
        }

        if (new Date(startTime) < slot.startTime || new Date(startTime) > slot.endTime || new Date(endTime) > slot.endTime || new Date(endTime) < slot.startTime) {
            const windows = await Availability.find({professorId}).sort({startTime: 1});
            res.status(400).json({
                error: "Professor is not available for this duration",
                thisWindow: {
                    startTime: slot.startTime,
                    endTime: slot.endTime
                },
                allAvailableWindows: windows.map(window => ({
                    id: window.id,
                    startTime: window.startTime,
                    endTime: window.endTime
                }))
            });
            return;
        }

            const existingAppointments = await Appointment.find({
                availabilityId,
                studentId,
                $or: [
                    {
                        $and: [
                            { startTime: { $lte: startTime } },
                            { endTime: { $gt: startTime } },
                        ],
                    },
                    {
                        $and: [
                            { startTime: { $lt: endTime } },
                            { endTime: { $gte: endTime } },
                        ],
                    },
                    {
                        $and: [
                            { startTime: { $gte: startTime } },
                            { endTime: { $lte: endTime } },
                        ],
                    },
                ],
            })
                .select("startTime endTime status")
                .populate('professorId', 'name role')
                .sort({ startTime: 1 });
        
                let messages: { status: string; message: string; details?: any }[] = [];

                for (const appointment of existingAppointments) {
                    if (appointment.professorId._id.toString() === professorId) {
                        messages.push({
                            status: appointment.status,
                            message: `A ${appointment.status} appointment already exists with this professor during the requested time.`,
                            details: appointment,
                        });
                    } else {
                        if (appointment.professorId._id.toString() != professorId && appointment.status === 'CONFIRMED') {
                            messages.push({
                                status: appointment.status,
                                message: "A CONFIRMED appointment with another professor during this time is already confirmed.",
                                details: appointment,
                            });
                        } else if (appointment.professorId._id.toString() != professorId && appointment.status === 'PENDING') {
                            messages.push({
                                status: appointment.status,
                                message: "This is a PENDING appointment with another professor at the same time.",
                                details: appointment,
                            });
                        }
                    }
                }
                
                if (messages.length > 0) {
                    messages.sort((a, b) => {
                        if (a.status === "PENDING" && b.status === "CONFIRMED") return 1;
                        if (a.status === "CONFIRMED" && b.status === "PENDING") return -1;
                        return 0;
                    });
                    res.status(200).json({
                        message: "Conflicts found during the requested time slot.",
                        conflicts: messages,
                    });
                    return;
                }

        next();
    } catch (error) {
        console.error("Error occurred during appointment creation:", error);
        res.status(500).json({ error: "Error checking appointment overlap" });
        return;
    }
};

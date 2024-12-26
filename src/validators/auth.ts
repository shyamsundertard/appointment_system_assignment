import { Role } from "@prisma/client";
import { body } from "express-validator";

export const registrationValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isLength({min: 8}).withMessage("Password must be atleast 8 characters long"),
    body("role").notEmpty().withMessage("Role is required").custom((value) => {
        if (!Object.values(Role).includes(value)) {
            throw new Error("Invalid role");
        }
        return true;
    })
]

export const loginValidation = [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required")
]

export const timeValidation = [
    body("startTime").isLength({min: 24, max: 24}).withMessage("Invalid DateTime format, expected: YYYY-MM-DDTHH:mm:ss.uuuZ").isISO8601().withMessage("Invalid DateTime format, expected: YYYY-MM-DDTHH:mm:ss.uuuZ"),
    body("endTime").isLength({min: 24, max: 24}).withMessage("Invalid DateTime format, expected: YYYY-MM-DDTHH:mm:ss.uuuZ").isISO8601().withMessage("Invalid DateTime format, expected: YYYY-MM-DDTHH:mm:ss.uuuZ")
]
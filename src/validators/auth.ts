import { Role } from "@prisma/client";
import { error } from "console";
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
    body("startTime")
    .exists()
    .withMessage("startTime is required")
    .notEmpty()
    .withMessage("startTime cannot be empty")
    .custom((value) => {
        const dateRegex = /^d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (!dateRegex.test(value)) {
            throw new Error("Invalid DateTime format, expected: YYYY-MM-DDTHH:mm:ss.sssZ");
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error("Invalid date value");
        }
        return;
    }),
    body("endTime")
        .exists()
        .withMessage("endTime is required")
        .notEmpty()
        .withMessage("endTime cannot be empty")
        .custom((value) => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
            if (!dateRegex.test(value)) {
                throw new Error("Invalid DateTime format, expected: YYYY-MM-DDTHH:mm:ss.sssZ");
            }
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error("Invalid date value");
            }
            return true;
        }),
]
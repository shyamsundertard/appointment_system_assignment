import { body } from "express-validator";

const validRoles = ["PROFESSOR", "STUDENT"];

export const registrationValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isLength({min: 8}).withMessage("Password must be atleast 8 characters long"),
    body("role").notEmpty().withMessage("Role is required").custom((value) => {
        if (!validRoles.includes(value)) {
            throw new Error("Invalid role");
        }
        return true;
    })
]

export const loginValidation = [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required")
]
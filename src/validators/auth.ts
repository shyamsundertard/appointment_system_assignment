import { body } from "express-validator";

export const registrationValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isLength({min: 8}).withMessage("Password must be atleast 8 characters long"),
    body("role").notEmpty().withMessage("Role is required")
]

export const loginValidation = [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isEmpty().withMessage("Password is required")
]
import { check } from "express-validator";

const registrationValidation = [
  check("email").isEmail().withMessage("Enter a valid email address"),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  check("name").notEmpty().withMessage("Name is required"),
  check("role").notEmpty().withMessage("Role is required"),
];

export default registrationValidation;

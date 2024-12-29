import express, { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  loginValidation,
  registrationValidation,
} from "../validators/auth.js";
import { body, validationResult } from "express-validator";
import { authenticateJWT } from "../middlewares/auth_middleware.js";
import { User, Role, RoleType } from "../models/database.js";
import mongoose from "mongoose";

const userRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = process.env.TOKEN_NAME;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

if (!TOKEN_NAME) {
  throw new Error("TOKEN_NAME is not defined in environment variables");
}

// All users
userRouter.get("/users", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("name email role");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error occurred while fetching users" });
  }
});

// User by ID
userRouter.get("/users/id/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("name email role");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error occurred while fetching user" });
  }
});

// User by role
userRouter.get("/users/role/:role", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.params;

    if (!Object.values(Role).includes(role as RoleType)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }
      

    const users = await User.find({ role }).select("name email");
    if (users.length === 0) {
      res.status(404).json({ message: "No users found for specified role" });
      return;
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error occurred while fetching user" });
  }
});

// Registration
userRouter.post("/register", 
  registrationValidation, 
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
  try {
        const { email, password, name, role } = req.body;
        const lcEmail = email.toLowerCase();
        const ucName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
        const hashedPassword = await bcrypt.hash(password, 14);
        const newUser = new User({ email: lcEmail, password: hashedPassword, name: ucName, role });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      res.status(400).json({
        message: 'Email already Exists'
      });
      return;
    }

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        message: error.errors.role?.message || 'Validation failed'
      });
      return;
    }
    
    res.status(500).json({ error: "Error occurred during user registration" });
  }
});

// Login
userRouter.post("/login", loginValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .status(200)
      .cookie(TOKEN_NAME, token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      })
      .json({ message: "Logged in successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error occurred during login" });
  }
});

export default userRouter;

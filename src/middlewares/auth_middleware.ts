import { Request, Response, NextFunction } from "express";
import jwtVerify from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }

const { verify } = jwtVerify;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = process.env.TOKEN_NAME;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

if (!TOKEN_NAME) {
    throw new Error("TOKEN_NAME is not defined in environment variables");
}

export const authenticateJWT = (req: AuthenticatedRequest, res:Response, next: NextFunction) => {
    try {
        const token = req.cookies[TOKEN_NAME];
        if (!token) {
            res.status(401).json({ error: "Access denied, no token provided" });
            return;
        }

        const decoded = verify(token, JWT_SECRET) as { id: string, name: string, email: string, role: string};

        req.user = decoded;

        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

export const authorizeRole = (role: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if( req.user?.role != role) {
        res.status(403).json({ error: "Access forbidden"});
        return;
    }
    next();
}
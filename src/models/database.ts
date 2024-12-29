import mongoose from 'mongoose';

// Enums for Role and Status with TypeScript types
export const Role = Object.freeze({
  STUDENT: 'STUDENT',
  PROFESSOR: 'PROFESSOR',
} as const);

export type RoleType = typeof Role[keyof typeof Role];

export const Status = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const);

export type StatusType = typeof Status[keyof typeof Status];

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    validate: {
      validator: function(value: string) {
        return Object.values(Role).includes(value as RoleType);
      },
      message: () => 'Invalid role. Role must be either STUDENT or PROFESSOR'
    }
  },
}, { timestamps: true });

// Availability Schema
const availabilitySchema = new mongoose.Schema({
  professorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
}, { timestamps: true });

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  availabilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    required: true,
    default: Status.PENDING,
    validate: {
      validator: function(value: string) {
        return Object.values(Status).includes(value as StatusType);
      },
      message: () => 'Invalid status. Status must be one of: PENDING, CONFIRMED, CANCELLED, or COMPLETED'
    }
  },
}, { timestamps: true });

// Models
export const User = mongoose.model('User', userSchema);
export const Availability = mongoose.model('Availability', availabilitySchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);
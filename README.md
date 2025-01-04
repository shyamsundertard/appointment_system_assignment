# College Appointment System Backend

## Overview
This project implements backend APIs for a college appointment system, enabling:
- **Students** to authenticate, view available appointment slots, and book appointments with professors.
- **Professors** to authenticate, specify availability, manage appointment requests (accept/reject), and view their bookings.
- The system ensures no duplicate user registration, validates all inputs, and notifies students if a new appointment clashes with an existing appointment.

---

 - **Codebase Overview and Database Structure**:
   https://drive.google.com/file/d/1hIXjzqVl9LtVpUHFf7cXfW0GBjRIAE4i/view?usp=sharing

 - **API Flow Demonstration with Postman**:
   https://drive.google.com/file/d/1DHQJel104qd6vM1QB77LVJ_MLKWPIWXk/view?usp=sharing

---

## Features
- **Authentication**:
  - Secure login for students and professors using JWT tokens.
  - Only authenticated users can interact with the APIs.
- **Role-Specific APIs**:
  - APIs are user-specific and restricted based on roles:
    - Students can book appointments and view professor availability.
    - Professors can specify availability, accept/reject booking requests, and view their appointments.
- **Registration Validation**:
  - Prevents duplicate registrations by checking for existing users with the same email address.
- **Availability Management**:
  - Professors can specify their available time slots.
  - Middleware checks for overlapping availability slots.
- **Booking System**:
  - Students can view available slots and book appointments with professors.
  - Professors can accept or reject appointment requests.
  - Middleware notifies students of appointment slot clashes.
- **Input Validation**:
  - Validators ensure all inputs meet the required format (e.g., no empty fields, valid email formats).
- **AWS Integration**:
  - Data is stored in AWS DocumentDB.
  - Code is deployed on AWS EC2.

---

## Tech Stack
- **Node.js** with **Express** for backend framework.
- **TypeScript** for strong typing and maintainability.
- **Mongoose** for interacting with AWS DocumentDB.
- **bcrypt** for secure password hashing.
- **JWT (JSON Web Tokens)** for authentication.
- **AWS EC2** for hosting the application.
- **AWS DocumentDB** for the database.

---

## Middleware and Validators
- **Authentication Middleware**:
  - Ensures only logged-in users can access protected routes.
- **Duplicate Registration Check**:
  - Validates that users cannot register with an already registered email address.
- **Overlap Check Middleware**:
  - Validates that professors do not add overlapping availability slots.
  - Checks that students do not book overlapping appointments.
- **Input Validation**:
  - Ensures required fields are not empty.
  - Verifies the correct format of inputs (e.g., email addresses, date-time strings)

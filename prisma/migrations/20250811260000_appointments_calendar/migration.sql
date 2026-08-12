-- Step 1: add new enum values (must commit before use)
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'FAILED';

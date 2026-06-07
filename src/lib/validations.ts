import { z } from "zod";
import { AttendanceStatus, Gender, Role } from "@prisma/client";
import { CAMP, SCORE_CATEGORIES } from "@/lib/constants";

// ---------------------------------------------------------------------------
//  Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

// ---------------------------------------------------------------------------
//  Staff / Users
// ---------------------------------------------------------------------------

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Enter a valid email address").toLowerCase(),
  password: passwordRules,
  role: z.nativeEnum(Role).default(Role.STAFF),
  phone: z.string().max(30).optional().or(z.literal("")),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Enter a valid email address").toLowerCase(),
  // Optional on update — only changes the password when provided.
  password: z.union([passwordRules, z.literal("")]).optional(),
  role: z.nativeEnum(Role),
  phone: z.string().max(30).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ---------------------------------------------------------------------------
//  Camper
// ---------------------------------------------------------------------------

export const camperSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  age: z.coerce
    .number({ invalid_type_error: "Age is required" })
    .int("Age must be a whole number")
    .min(CAMP.minAge, `Campers must be at least ${CAMP.minAge}`)
    .max(CAMP.maxAge, `Campers must be ${CAMP.maxAge} or younger`),
  gender: z.nativeEnum(Gender).default(Gender.UNSPECIFIED),
  guardianName: z.string().min(2, "Guardian name is required").max(120),
  guardianPhone: z.string().min(5, "Guardian phone is required").max(30),
  emergencyContact: z.string().min(2, "Emergency contact is required").max(160),
  medicalNotes: z.string().max(1000).optional().or(z.literal("")),
  groupId: z.string().optional().or(z.literal("")),
  registrationDate: z.coerce.date().optional(),
});
export type CamperInput = z.infer<typeof camperSchema>;

export const updateCamperSchema = camperSchema.extend({
  id: z.string().min(1),
});
export type UpdateCamperInput = z.infer<typeof updateCamperSchema>;

export const moveCamperSchema = z.object({
  camperId: z.string().min(1),
  groupId: z.string().optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
//  Group
// ---------------------------------------------------------------------------

export const groupSchema = z.object({
  name: z.string().min(2, "Group name is required").max(60),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a hex value like #3b82f6")
    .default("#3b82f6"),
  description: z.string().max(500).optional().or(z.literal("")),
  leaderId: z.string().optional().or(z.literal("")),
});
export type GroupInput = z.infer<typeof groupSchema>;

export const updateGroupSchema = groupSchema.extend({
  id: z.string().min(1),
});
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// ---------------------------------------------------------------------------
//  Scoring
// ---------------------------------------------------------------------------

export const scoreEntrySchema = z.object({
  groupId: z.string().min(1, "Select a group"),
  points: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .int("Points must be a whole number")
    .refine((n) => n !== 0, "Points cannot be zero")
    .refine((n) => Math.abs(n) <= 1000, "Points must be between -1000 and 1000"),
  category: z
    .string()
    .min(1)
    .default("General")
    .refine(
      (c) => (SCORE_CATEGORIES as readonly string[]).includes(c) || c.length <= 60,
      "Invalid category",
    ),
  reason: z.string().min(2, "A reason is required").max(300),
});
export type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;

// ---------------------------------------------------------------------------
//  Attendance
// ---------------------------------------------------------------------------

export const attendanceRecordSchema = z.object({
  camperId: z.string().min(1),
  status: z.nativeEnum(AttendanceStatus),
  note: z.string().max(200).optional().or(z.literal("")),
});

export const attendanceSchema = z.object({
  groupId: z.string().min(1, "Select a group"),
  date: z.coerce.date(),
  notes: z.string().max(300).optional().or(z.literal("")),
  records: z
    .array(attendanceRecordSchema)
    .min(1, "Add at least one attendance record"),
});
export type AttendanceInput = z.infer<typeof attendanceSchema>;

// ---------------------------------------------------------------------------
//  Score categories (admin-managed)
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(60, "Keep it under 60 characters"),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const renameCategorySchema = categorySchema.extend({
  id: z.string().min(1),
});
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;

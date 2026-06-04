import { AttendanceStatus, Gender, Role } from "@prisma/client";

/** Camp metadata. */
export const CAMP = {
  name: "St. Joseph's Cathedral Summer Camp",
  shortName: "St. Joseph's Camp",
  ageRange: "8–18",
  type: "Day Camp",
  dates: "July 6 – July 31, 2026",
  hours: "4:00 PM – 8:00 PM",
  minAge: 8,
  maxAge: 18,
} as const;

/** Default page size for paginated tables. */
export const PAGE_SIZE = 10;

/** Pre-defined scoring categories shown in the scoring UI. */
export const SCORE_CATEGORIES = [
  "General",
  "Sportsmanship",
  "Bible Quiz",
  "Talent Show",
  "Cleanliness",
  "Teamwork",
  "Punctuality",
  "Memory Verse",
  "Service Project",
] as const;

/** Suggested colors when creating a group. */
export const GROUP_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#14b8a6",
] as const;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  STAFF: "Staff",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  UNSPECIFIED: "Unspecified",
};

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; badge: string }
> = {
  PRESENT: {
    label: "Present",
    color: "#22c55e",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  ABSENT: {
    label: "Absent",
    color: "#ef4444",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  LATE: {
    label: "Late",
    color: "#eab308",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  EXCUSED: {
    label: "Excused",
    color: "#3b82f6",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
};

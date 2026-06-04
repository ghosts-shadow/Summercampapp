/**
 * Seed script for St. Joseph's Cathedral Summer Camp.
 *
 * Creates an admin account, staff, six groups, ~60 campers, a scoring ledger,
 * attendance sessions, and an initial ranking snapshot.
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient, Gender, AttendanceStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- helpers --------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function phone(): string {
  return `(${randInt(200, 989)}) ${randInt(200, 989)}-${randInt(1000, 9999)}`;
}

const FIRST_NAMES = [
  "Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Sophia",
  "James", "Isabella", "William", "Mia", "Benjamin", "Charlotte", "Lucas",
  "Amelia", "Henry", "Harper", "Alexander", "Evelyn", "Michael", "Abigail",
  "Daniel", "Emily", "Jacob", "Elizabeth", "Logan", "Sofia", "Jackson",
  "Avery", "Sebastian", "Ella", "Mateo", "Scarlett", "Jack", "Grace",
  "Owen", "Chloe", "Theodore", "Victoria", "Aiden", "Riley", "Samuel",
  "Aria", "Joseph", "Lily", "John", "Nora", "David", "Zoey",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
];

const GROUPS = [
  { name: "Red Lions", color: "#ef4444", description: "Courageous and bold — the pride of the camp." },
  { name: "Blue Eagles", color: "#3b82f6", description: "Soaring high with focus and teamwork." },
  { name: "Green Vipers", color: "#22c55e", description: "Swift, sharp, and always striking first." },
  { name: "Gold Falcons", color: "#eab308", description: "Precision and excellence in everything." },
  { name: "Purple Panthers", color: "#a855f7", description: "Mysterious, graceful, and powerful." },
  { name: "Orange Foxes", color: "#f97316", description: "Clever and quick on their feet." },
];

const SCORE_CATEGORIES = [
  "Sportsmanship", "Bible Quiz", "Talent Show", "Cleanliness",
  "Teamwork", "Punctuality", "Memory Verse", "Service Project",
];

const SCORE_REASONS_POSITIVE = [
  "Won the relay race",
  "Excellent teamwork during craft time",
  "First place in the Bible quiz",
  "Cleanest cabin inspection",
  "Outstanding talent show performance",
  "Helped set up for evening service",
  "Perfect memory verse recitation",
  "Great sportsmanship during games",
];

const SCORE_REASONS_NEGATIVE = [
  "Late returning from break",
  "Untidy activity area",
  "Disruption during quiet time",
];

async function main() {
  console.log("🌱  Seeding St. Joseph's Cathedral Summer Camp...\n");

  // ---- Clean slate (respecting FK order) --------------------------------
  await prisma.activityLog.deleteMany();
  await prisma.rankingHistory.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.scoreEntry.deleteMany();
  await prisma.camper.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // ---- Admin ------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@stjosephscamp.org";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Camp Administrator";

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
      phone: phone(),
    },
  });
  console.log(`✅  Admin created:  ${admin.email}  /  ${adminPassword}`);

  // ---- Staff (one leader per group) -------------------------------------
  const staffSeeds = [
    { name: "Sarah Mitchell", email: "sarah.mitchell@stjosephscamp.org" },
    { name: "David Okafor", email: "david.okafor@stjosephscamp.org" },
    { name: "Maria Santos", email: "maria.santos@stjosephscamp.org" },
    { name: "James Bennett", email: "james.bennett@stjosephscamp.org" },
    { name: "Grace Adeyemi", email: "grace.adeyemi@stjosephscamp.org" },
    { name: "Peter Novak", email: "peter.novak@stjosephscamp.org" },
  ];

  const staffPassword = "Staff123!";
  const staff = [];
  for (const s of staffSeeds) {
    const u = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash: await bcrypt.hash(staffPassword, 12),
        role: Role.STAFF,
        phone: phone(),
      },
    });
    staff.push(u);
  }
  console.log(`✅  ${staff.length} staff created (password: ${staffPassword})`);

  // ---- Groups -----------------------------------------------------------
  const groups = [];
  for (let i = 0; i < GROUPS.length; i++) {
    const g = await prisma.group.create({
      data: {
        name: GROUPS[i].name,
        color: GROUPS[i].color,
        description: GROUPS[i].description,
        leaderId: staff[i]?.id,
      },
    });
    groups.push(g);
  }
  console.log(`✅  ${groups.length} groups created`);

  // ---- Campers ----------------------------------------------------------
  const TOTAL_CAMPERS = 60;
  const campers = [];
  for (let i = 0; i < TOTAL_CAMPERS; i++) {
    const group = groups[i % groups.length];
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const c = await prisma.camper.create({
      data: {
        firstName,
        lastName,
        age: randInt(8, 18),
        gender: pick([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
        guardianName: `${pick(FIRST_NAMES)} ${lastName}`,
        guardianPhone: phone(),
        emergencyContact: `${pick(FIRST_NAMES)} ${lastName} — ${phone()}`,
        medicalNotes:
          Math.random() < 0.2
            ? pick(["Peanut allergy", "Asthma — carries inhaler", "Requires daily medication at 6 PM", "No known conditions"])
            : null,
        groupId: group.id,
        registrationDate: new Date(2026, 5, randInt(1, 30)), // June 2026
      },
    });
    campers.push(c);
  }
  console.log(`✅  ${campers.length} campers created`);

  // ---- Score entries (ledger) + group totals ----------------------------
  const groupTotals: Record<string, number> = {};
  for (const g of groups) groupTotals[g.id] = 0;

  let scoreEntryCount = 0;
  for (const g of groups) {
    const entries = randInt(8, 16);
    for (let i = 0; i < entries; i++) {
      const positive = Math.random() < 0.8;
      const points = positive ? randInt(5, 50) : -randInt(5, 20);
      const reason = positive ? pick(SCORE_REASONS_POSITIVE) : pick(SCORE_REASONS_NEGATIVE);
      await prisma.scoreEntry.create({
        data: {
          groupId: g.id,
          points,
          category: pick(SCORE_CATEGORIES),
          reason,
          staffId: pick([admin.id, ...staff.map((s) => s.id)]),
          createdAt: new Date(2026, 6, randInt(6, 20), randInt(16, 19), randInt(0, 59)),
        },
      });
      groupTotals[g.id] += points;
      scoreEntryCount++;
    }
  }

  // Persist denormalized totals.
  for (const g of groups) {
    await prisma.group.update({
      where: { id: g.id },
      data: { totalScore: groupTotals[g.id] },
    });
  }
  console.log(`✅  ${scoreEntryCount} score entries created`);

  // ---- Attendance sessions (first two camp weeks) -----------------------
  // July 6–17, 2026 weekdays.
  const campDays: Date[] = [];
  for (let d = 6; d <= 17; d++) {
    const date = new Date(2026, 6, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) campDays.push(date); // skip weekends
  }

  let attendanceSessions = 0;
  for (const day of campDays) {
    for (const g of groups) {
      const groupCampers = campers.filter((c) => c.groupId === g.id);
      const session = await prisma.attendance.create({
        data: {
          date: day,
          groupId: g.id,
          recordedById: g.leaderId,
          records: {
            create: groupCampers.map((c) => {
              const r = Math.random();
              const status =
                r < 0.85
                  ? AttendanceStatus.PRESENT
                  : r < 0.93
                    ? AttendanceStatus.LATE
                    : r < 0.98
                      ? AttendanceStatus.ABSENT
                      : AttendanceStatus.EXCUSED;
              return { camperId: c.id, status };
            }),
          },
        },
      });
      attendanceSessions++;
      void session;
    }
  }
  console.log(`✅  ${attendanceSessions} attendance sessions created`);

  // ---- Ranking snapshot -------------------------------------------------
  const ranked = [...groups].sort((a, b) => groupTotals[b.id] - groupTotals[a.id]);
  for (let i = 0; i < ranked.length; i++) {
    await prisma.rankingHistory.create({
      data: {
        groupId: ranked[i].id,
        rank: i + 1,
        score: groupTotals[ranked[i].id],
      },
    });
  }
  console.log(`✅  Ranking snapshot created`);

  // ---- Activity log -----------------------------------------------------
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: "SEED",
      entity: "System",
      message: "Database seeded with demo data.",
    },
  });

  console.log("\n🎉  Seeding complete!\n");
  console.log("    Login at /login");
  console.log(`    Admin:  ${adminEmail}  /  ${adminPassword}`);
  console.log(`    Staff:  ${staffSeeds[0].email}  /  ${staffPassword}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

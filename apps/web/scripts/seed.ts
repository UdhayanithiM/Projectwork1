// apps/web/scripts/seed.ts

import { PrismaClient, Difficulty, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Proper cleanup respecting relations
  await prisma.report.deleteMany({});
  await prisma.behavioralInterview.deleteMany({});
  await prisma.technicalAssessment.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.codingQuestion.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleared existing data.");

  // 2. Create Users
  const passwordHash = await hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@fortitwin.com",
      name: "System Admin",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const hr = await prisma.user.create({
    data: {
      email: "hr@fortitwin.com",
      name: "Sarah Recruiter",
      password: passwordHash,
      role: Role.HR,
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "Alex Candidate",
      password: passwordHash,
      role: Role.STUDENT,
      profileData: {
        skills: ["React", "Node.js"],
        experience_years: 2,
        seniority: "Junior",
      },
    },
  });

  console.log("👥 Created Users: Admin, HR, Student");

  // 3. Create Coding Questions

  await prisma.codingQuestion.create({
    data: {
      title: "Two Sum",
      description:
        "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      difficulty: Difficulty.EASY,
      testCases: [
        { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
        { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
      ],
    },
  });

  await prisma.codingQuestion.create({
    data: {
      title: "Reverse String",
      description:
        "Write a function that reverses a string. The input string is given as an array of characters.",
      difficulty: Difficulty.EASY,
      testCases: [
        { input: { s: ["h", "e", "l", "l", "o"] }, expectedOutput: ["o", "l", "l", "e", "h"] },
      ],
    },
  });

  await prisma.codingQuestion.create({
    data: {
      title: "Longest Substring Without Repeating Characters",
      description:
        "Given a string `s`, find the length of the longest substring without repeating characters.",
      difficulty: Difficulty.MEDIUM,
      testCases: [
        { input: { s: "abcabcbb" }, expectedOutput: 3 },
        { input: { s: "bbbbb" }, expectedOutput: 1 },
      ],
    },
  });

  await prisma.codingQuestion.create({
    data: {
      title: "Group Anagrams",
      description:
        "Given an array of strings `strs`, group the anagrams together.",
      difficulty: Difficulty.MEDIUM,
      testCases: [
        {
          input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] },
          expectedOutput: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]],
        },
      ],
    },
  });

  await prisma.codingQuestion.create({
    data: {
      title: "Median of Two Sorted Arrays",
      description:
        "Given two sorted arrays, return the median of the two sorted arrays.",
      difficulty: Difficulty.HARD,
      testCases: [
        { input: { nums1: [1, 3], nums2: [2] }, expectedOutput: 2.0 },
        { input: { nums1: [1, 2], nums2: [3, 4] }, expectedOutput: 2.5 },
      ],
    },
  });

  console.log("📚 Seeded Question Bank (Easy, Medium, Hard)");
  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

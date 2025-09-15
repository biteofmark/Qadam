import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  hasCalculator: boolean("has_calculator").default(false),
  hasPeriodicTable: boolean("has_periodic_table").default(false),
});

export const variants = pgTable("variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").notNull().references(() => blocks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  variantId: varchar("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
});

export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").default(false),
});

export const testResults = pgTable("test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  variantId: varchar("variant_id").notNull().references(() => variants.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: real("percentage").notNull(),
  timeSpent: integer("time_spent").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const subjectProgress = pgTable("subject_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectName: text("subject_name").notNull(),
  totalAnswered: integer("total_answered").default(0),
  correctAnswered: integer("correct_answered").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
});

export const userRankings = pgTable("user_rankings", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  totalScore: integer("total_score").default(0),
  testsCompleted: integer("tests_completed").default(0),
  averagePercentage: real("average_percentage").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
});

export const insertVariantSchema = createInsertSchema(variants).omit({
  id: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  completedAt: true,
});

// Analytics Zod DTO schemas
export const analyticsOverviewSchema = z.object({
  totalTests: z.number(),
  averageScore: z.number(),
  totalTimeSpent: z.number(),
  bestSubject: z.string(),
  worstSubject: z.string(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  recentActivity: z.number(),
});

export const subjectAggregateSchema = z.object({
  subjectName: z.string(),
  testsCount: z.number(),
  averageScore: z.number(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  averageTimeSpent: z.number(),
});

export const historyPointSchema = z.object({
  date: z.string(),
  testsCompleted: z.number(),
  averageScore: z.number(),
  totalTimeSpent: z.number(),
});

export const correctnessBreakdownSchema = z.object({
  date: z.string(),
  correctAnswers: z.number(),
  incorrectAnswers: z.number(),
  totalQuestions: z.number(),
});

export const comparisonStatsSchema = z.object({
  userRank: z.number(),
  totalUsers: z.number(),
  userScore: z.number(),
  averageScore: z.number(),
  percentile: z.number(),
  topUserScore: z.number(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Variant = typeof variants.$inferSelect;
export type InsertVariant = z.infer<typeof insertVariantSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export type SubjectProgress = typeof subjectProgress.$inferSelect;
export type UserRanking = typeof userRankings.$inferSelect;

// Analytics types
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type SubjectAggregate = z.infer<typeof subjectAggregateSchema>;
export type HistoryPoint = z.infer<typeof historyPointSchema>;
export type CorrectnessBreakdown = z.infer<typeof correctnessBreakdownSchema>;
export type ComparisonStats = z.infer<typeof comparisonStatsSchema>;

import { type User, type InsertUser, type Block, type InsertBlock, type Variant, type InsertVariant, 
         type Subject, type InsertSubject, type Question, type InsertQuestion, type Answer, type InsertAnswer,
         type TestResult, type InsertTestResult, type SubjectProgress, type UserRanking,
         type AnalyticsOverview, type SubjectAggregate, type HistoryPoint, type CorrectnessBreakdown, type ComparisonStats } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blocks
  getAllBlocks(): Promise<Block[]>;
  getBlock(id: string): Promise<Block | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
  updateBlock(id: string, block: Partial<InsertBlock>): Promise<Block | undefined>;
  deleteBlock(id: string): Promise<void>;
  
  // Variants
  getVariantsByBlock(blockId: string): Promise<Variant[]>;
  getVariant(id: string): Promise<Variant | undefined>;
  createVariant(variant: InsertVariant): Promise<Variant>;
  updateVariant(id: string, variant: Partial<InsertVariant>): Promise<Variant | undefined>;
  deleteVariant(id: string): Promise<void>;
  
  // Subjects
  getSubjectsByVariant(variantId: string): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<void>;
  
  // Questions
  getQuestionsBySubject(subjectId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<void>;
  
  // Answers
  getAnswersByQuestion(questionId: string): Promise<Answer[]>;
  getAnswer(id: string): Promise<Answer | undefined>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: string, answer: Partial<InsertAnswer>): Promise<Answer | undefined>;
  deleteAnswer(id: string): Promise<void>;
  
  // Test Results
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getTestResultsByUser(userId: string): Promise<TestResult[]>;
  getUserRanking(userId: string): Promise<UserRanking | undefined>;
  updateUserRanking(userId: string): Promise<void>;
  getAllRankings(): Promise<UserRanking[]>;
  
  // Subject Progress
  getSubjectProgress(userId: string): Promise<SubjectProgress[]>;
  updateSubjectProgress(userId: string, subjectName: string, totalAnswered: number, correctAnswered: number): Promise<void>;
  
  // Analytics
  getAnalyticsOverview(userId: string): Promise<AnalyticsOverview>;
  getSubjectAggregates(userId: string): Promise<SubjectAggregate[]>;
  getHistory(userId: string, rangeDays?: number): Promise<HistoryPoint[]>;
  getCorrectnessBreakdown(userId: string, rangeDays?: number): Promise<CorrectnessBreakdown[]>;
  getComparison(userId: string): Promise<ComparisonStats>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private blocks: Map<string, Block>;
  private variants: Map<string, Variant>;
  private subjects: Map<string, Subject>;
  private questions: Map<string, Question>;
  private answers: Map<string, Answer>;
  private testResults: Map<string, TestResult>;
  private subjectProgress: Map<string, SubjectProgress>;
  private userRankings: Map<string, UserRanking>;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.blocks = new Map();
    this.variants = new Map();
    this.subjects = new Map();
    this.questions = new Map();
    this.answers = new Map();
    this.testResults = new Map();
    this.subjectProgress = new Map();
    this.userRankings = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample blocks
    const physicsBlock = await this.createBlock({
      name: "Физика-Математика",
      hasCalculator: true,
      hasPeriodicTable: true,
    });
    
    const chemistryBlock = await this.createBlock({
      name: "Химия-Биология",
      hasCalculator: false,
      hasPeriodicTable: true,
    });
    
    // Create sample variants
    for (let i = 1; i <= 8; i++) {
      const variant = await this.createVariant({
        blockId: physicsBlock.id,
        name: `Вариант ${i}`,
      });
      
      // Create subjects for each variant
      const physicsSubject = await this.createSubject({
        variantId: variant.id,
        name: "Физика",
      });
      
      const mathSubject = await this.createSubject({
        variantId: variant.id,
        name: "Математика",
      });
      
      // Create sample questions
      for (let j = 1; j <= 10; j++) {
        const question = await this.createQuestion({
          subjectId: physicsSubject.id,
          text: `Физика вопрос ${j} для варианта ${i}`,
        });
        
        // Create answers for each question
        for (let k = 1; k <= 4; k++) {
          await this.createAnswer({
            questionId: question.id,
            text: `Ответ ${k}`,
            isCorrect: k === 1, // First answer is correct
          });
        }
      }
      
      for (let j = 1; j <= 10; j++) {
        const question = await this.createQuestion({
          subjectId: mathSubject.id,
          text: `Математика вопрос ${j} для варианта ${i}`,
        });
        
        // Create answers for each question
        for (let k = 1; k <= 4; k++) {
          await this.createAnswer({
            questionId: question.id,
            text: `Ответ ${k}`,
            isCorrect: k === 1, // First answer is correct
          });
        }
      }
    }
    
    // Create variants for chemistry block
    for (let i = 1; i <= 6; i++) {
      const variant = await this.createVariant({
        blockId: chemistryBlock.id,
        name: `Вариант ${i}`,
      });
      
      const chemistrySubject = await this.createSubject({
        variantId: variant.id,
        name: "Химия",
      });
      
      const biologySubject = await this.createSubject({
        variantId: variant.id,
        name: "Биология",
      });
      
      // Create sample questions for chemistry and biology
      for (let j = 1; j <= 10; j++) {
        const chemQuestion = await this.createQuestion({
          subjectId: chemistrySubject.id,
          text: `Химия вопрос ${j} для варианта ${i}`,
        });
        
        const bioQuestion = await this.createQuestion({
          subjectId: biologySubject.id,
          text: `Биология вопрос ${j} для варианта ${i}`,
        });
        
        // Create answers
        for (let k = 1; k <= 4; k++) {
          await this.createAnswer({
            questionId: chemQuestion.id,
            text: `Ответ ${k}`,
            isCorrect: k === 1,
          });
          
          await this.createAnswer({
            questionId: bioQuestion.id,
            text: `Ответ ${k}`,
            isCorrect: k === 1,
          });
        }
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getAllBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values());
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.get(id);
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const id = randomUUID();
    const block: Block = { 
      ...insertBlock, 
      id, 
      hasCalculator: insertBlock.hasCalculator ?? false, 
      hasPeriodicTable: insertBlock.hasPeriodicTable ?? false 
    };
    this.blocks.set(id, block);
    return block;
  }

  async updateBlock(id: string, updateData: Partial<InsertBlock>): Promise<Block | undefined> {
    const existing = this.blocks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.blocks.set(id, updated);
    return updated;
  }

  async deleteBlock(id: string): Promise<void> {
    this.blocks.delete(id);
  }

  async getVariantsByBlock(blockId: string): Promise<Variant[]> {
    return Array.from(this.variants.values()).filter(v => v.blockId === blockId);
  }

  async getVariant(id: string): Promise<Variant | undefined> {
    return this.variants.get(id);
  }

  async createVariant(insertVariant: InsertVariant): Promise<Variant> {
    const id = randomUUID();
    const variant: Variant = { ...insertVariant, id };
    this.variants.set(id, variant);
    return variant;
  }

  async updateVariant(id: string, updateData: Partial<InsertVariant>): Promise<Variant | undefined> {
    const existing = this.variants.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.variants.set(id, updated);
    return updated;
  }

  async deleteVariant(id: string): Promise<void> {
    this.variants.delete(id);
  }

  async getSubjectsByVariant(variantId: string): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(s => s.variantId === variantId);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = randomUUID();
    const subject: Subject = { ...insertSubject, id };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: string, updateData: Partial<InsertSubject>): Promise<Subject | undefined> {
    const existing = this.subjects.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.subjects.set(id, updated);
    return updated;
  }

  async deleteSubject(id: string): Promise<void> {
    this.subjects.delete(id);
  }

  async getQuestionsBySubject(subjectId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.subjectId === subjectId);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existing = this.questions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: string): Promise<void> {
    this.questions.delete(id);
  }

  async getAnswersByQuestion(questionId: string): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(a => a.questionId === questionId);
  }

  async getAnswer(id: string): Promise<Answer | undefined> {
    return this.answers.get(id);
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const id = randomUUID();
    const answer: Answer = { 
      ...insertAnswer, 
      id, 
      isCorrect: insertAnswer.isCorrect ?? false 
    };
    this.answers.set(id, answer);
    return answer;
  }

  async updateAnswer(id: string, updateData: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const existing = this.answers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.answers.set(id, updated);
    return updated;
  }

  async deleteAnswer(id: string): Promise<void> {
    this.answers.delete(id);
  }

  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const id = randomUUID();
    const result: TestResult = { 
      ...insertResult, 
      id, 
      completedAt: new Date() 
    };
    this.testResults.set(id, result);
    return result;
  }

  async getTestResultsByUser(userId: string): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(r => r.userId === userId);
  }

  async getUserRanking(userId: string): Promise<UserRanking | undefined> {
    return this.userRankings.get(userId);
  }

  async updateUserRanking(userId: string): Promise<void> {
    const userResults = await this.getTestResultsByUser(userId);
    const totalScore = userResults.reduce((sum, result) => sum + result.score, 0);
    const testsCompleted = userResults.length;
    const averagePercentage = testsCompleted > 0 
      ? userResults.reduce((sum, result) => sum + result.percentage, 0) / testsCompleted 
      : 0;

    const ranking: UserRanking = {
      userId,
      totalScore,
      testsCompleted,
      averagePercentage,
      lastUpdated: new Date(),
    };

    this.userRankings.set(userId, ranking);
  }

  async getAllRankings(): Promise<UserRanking[]> {
    return Array.from(this.userRankings.values()).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }

  async getSubjectProgress(userId: string): Promise<SubjectProgress[]> {
    return Array.from(this.subjectProgress.values()).filter(p => p.userId === userId);
  }

  async updateSubjectProgress(userId: string, subjectName: string, totalAnswered: number, correctAnswered: number): Promise<void> {
    const key = `${userId}-${subjectName}`;
    const existing = Array.from(this.subjectProgress.values()).find(
      p => p.userId === userId && p.subjectName === subjectName
    );

    if (existing) {
      existing.totalAnswered = (existing.totalAnswered || 0) + totalAnswered;
      existing.correctAnswered = (existing.correctAnswered || 0) + correctAnswered;
      existing.lastActivity = new Date();
      this.subjectProgress.set(existing.id, existing);
    } else {
      const id = randomUUID();
      const progress: SubjectProgress = {
        id,
        userId,
        subjectName,
        totalAnswered,
        correctAnswered,
        lastActivity: new Date(),
      };
      this.subjectProgress.set(id, progress);
    }
  }

  // Analytics methods
  async getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
    const userResults = await this.getTestResultsByUser(userId);
    const subjectProgress = await this.getSubjectProgress(userId);
    
    if (userResults.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        bestSubject: "",
        worstSubject: "",
        totalQuestions: 0,
        correctAnswers: 0,
        recentActivity: 0,
      };
    }

    const totalTests = userResults.length;
    const averageScore = userResults.reduce((sum, r) => sum + r.percentage, 0) / totalTests;
    const totalTimeSpent = userResults.reduce((sum, r) => sum + r.timeSpent, 0);
    const totalQuestions = userResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const correctAnswers = userResults.reduce((sum, r) => sum + r.score, 0);

    // Calculate best and worst subjects
    const subjectStats = subjectProgress.reduce((acc, p) => {
      const totalAnswered = p.totalAnswered || 0;
      const correctAnswered = p.correctAnswered || 0;
      const percentage = totalAnswered > 0 ? (correctAnswered / totalAnswered) * 100 : 0;
      acc[p.subjectName] = percentage;
      return acc;
    }, {} as Record<string, number>);

    const subjects = Object.keys(subjectStats);
    const bestSubject = subjects.reduce((best, current) => 
      subjectStats[current] > subjectStats[best] ? current : best, subjects[0] || "");
    const worstSubject = subjects.reduce((worst, current) => 
      subjectStats[current] < subjectStats[worst] ? current : worst, subjects[0] || "");

    // Calculate recent activity (tests in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentActivity = userResults.filter(r => 
      r.completedAt && new Date(r.completedAt) > weekAgo
    ).length;

    return {
      totalTests,
      averageScore,
      totalTimeSpent,
      bestSubject,
      worstSubject,
      totalQuestions,
      correctAnswers,
      recentActivity,
    };
  }

  async getSubjectAggregates(userId: string): Promise<SubjectAggregate[]> {
    const userResults = await this.getTestResultsByUser(userId);
    const subjectProgress = await this.getSubjectProgress(userId);
    
    // Group test results by subject
    const subjectGroups: Record<string, TestResult[]> = {};
    
    for (const result of userResults) {
      const variant = await this.getVariant(result.variantId);
      if (!variant) continue;
      
      const subjects = await this.getSubjectsByVariant(variant.id);
      for (const subject of subjects) {
        if (!subjectGroups[subject.name]) {
          subjectGroups[subject.name] = [];
        }
        subjectGroups[subject.name].push(result);
      }
    }

    const aggregates: SubjectAggregate[] = [];
    
    for (const subjectName in subjectGroups) {
      const results = subjectGroups[subjectName];
      const progress = subjectProgress.find(p => p.subjectName === subjectName);
      
      const testsCount = results.length;
      const averageScore = testsCount > 0 ? 
        results.reduce((sum, r) => sum + r.percentage, 0) / testsCount : 0;
      const totalQuestions = progress?.totalAnswered || 0;
      const correctAnswers = progress?.correctAnswered || 0;
      const averageTimeSpent = testsCount > 0 ? 
        results.reduce((sum, r) => sum + r.timeSpent, 0) / testsCount : 0;

      aggregates.push({
        subjectName,
        testsCount,
        averageScore,
        totalQuestions,
        correctAnswers,
        averageTimeSpent,
      });
    }

    return aggregates.sort((a, b) => b.averageScore - a.averageScore);
  }

  async getHistory(userId: string, rangeDays: number = 30): Promise<HistoryPoint[]> {
    const userResults = await this.getTestResultsByUser(userId);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);
    
    // Filter results within date range
    const filteredResults = userResults.filter(r => 
      r.completedAt && 
      new Date(r.completedAt) >= startDate && 
      new Date(r.completedAt) <= endDate
    );

    // Group by date
    const dateGroups: Record<string, TestResult[]> = {};
    
    for (const result of filteredResults) {
      if (!result.completedAt) continue;
      const dateKey = new Date(result.completedAt).toISOString().split('T')[0];
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(result);
    }

    const history: HistoryPoint[] = [];
    
    // Generate all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayResults = dateGroups[dateKey] || [];
      
      const testsCompleted = dayResults.length;
      const averageScore = testsCompleted > 0 ? 
        dayResults.reduce((sum, r) => sum + r.percentage, 0) / testsCompleted : 0;
      const totalTimeSpent = dayResults.reduce((sum, r) => sum + r.timeSpent, 0);

      history.push({
        date: dateKey,
        testsCompleted,
        averageScore,
        totalTimeSpent,
      });
    }

    return history;
  }

  async getCorrectnessBreakdown(userId: string, rangeDays: number = 30): Promise<CorrectnessBreakdown[]> {
    const userResults = await this.getTestResultsByUser(userId);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);
    
    // Filter results within date range
    const filteredResults = userResults.filter(r => 
      r.completedAt && 
      new Date(r.completedAt) >= startDate && 
      new Date(r.completedAt) <= endDate
    );

    // Group by date
    const dateGroups: Record<string, TestResult[]> = {};
    
    for (const result of filteredResults) {
      if (!result.completedAt) continue;
      const dateKey = new Date(result.completedAt).toISOString().split('T')[0];
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(result);
    }

    const breakdown: CorrectnessBreakdown[] = [];
    
    // Generate all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayResults = dateGroups[dateKey] || [];
      
      const correctAnswers = dayResults.reduce((sum, r) => sum + r.score, 0);
      const totalQuestions = dayResults.reduce((sum, r) => sum + r.totalQuestions, 0);
      const incorrectAnswers = totalQuestions - correctAnswers;

      breakdown.push({
        date: dateKey,
        correctAnswers,
        incorrectAnswers,
        totalQuestions,
      });
    }

    return breakdown;
  }

  async getComparison(userId: string): Promise<ComparisonStats> {
    const allRankings = await this.getAllRankings();
    const userRanking = await this.getUserRanking(userId);
    
    if (!userRanking || allRankings.length === 0) {
      return {
        userRank: 0,
        totalUsers: 0,
        userScore: 0,
        averageScore: 0,
        percentile: 0,
        topUserScore: 0,
      };
    }

    const sortedRankings = allRankings.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    const userRank = sortedRankings.findIndex(r => r.userId === userId) + 1;
    const totalUsers = sortedRankings.length;
    const userScore = userRanking.averagePercentage || 0;
    const averageScore = sortedRankings.reduce((sum, r) => sum + (r.averagePercentage || 0), 0) / totalUsers;
    const percentile = totalUsers > 0 ? ((totalUsers - userRank + 1) / totalUsers) * 100 : 0;
    const topUserScore = sortedRankings[0]?.averagePercentage || 0;

    return {
      userRank,
      totalUsers,
      userScore,
      averageScore,
      percentile,
      topUserScore,
    };
  }
}

export const storage = new MemStorage();

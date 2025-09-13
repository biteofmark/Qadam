import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBlockSchema, insertVariantSchema, insertSubjectSchema, insertQuestionSchema, insertAnswerSchema, insertTestResultSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Blocks routes
  app.get("/api/blocks", async (req, res) => {
    try {
      const blocks = await storage.getAllBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения блоков" });
    }
  });

  app.get("/api/blocks/:id", async (req, res) => {
    try {
      const block = await storage.getBlock(req.params.id);
      if (!block) {
        return res.status(404).json({ message: "Блок не найден" });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения блока" });
    }
  });

  app.post("/api/blocks", async (req, res) => {
    try {
      const validatedData = insertBlockSchema.parse(req.body);
      const block = await storage.createBlock(validatedData);
      res.status(201).json(block);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания блока" });
    }
  });

  app.put("/api/blocks/:id", async (req, res) => {
    try {
      const validatedData = insertBlockSchema.partial().parse(req.body);
      const block = await storage.updateBlock(req.params.id, validatedData);
      if (!block) {
        return res.status(404).json({ message: "Блок не найден" });
      }
      res.json(block);
    } catch (error) {
      res.status(400).json({ message: "Ошибка обновления блока" });
    }
  });

  app.delete("/api/blocks/:id", async (req, res) => {
    try {
      await storage.deleteBlock(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления блока" });
    }
  });

  // Variants routes
  app.get("/api/blocks/:blockId/variants", async (req, res) => {
    try {
      const variants = await storage.getVariantsByBlock(req.params.blockId);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения вариантов" });
    }
  });

  app.get("/api/variants/:id", async (req, res) => {
    try {
      const variant = await storage.getVariant(req.params.id);
      if (!variant) {
        return res.status(404).json({ message: "Вариант не найден" });
      }
      res.json(variant);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения варианта" });
    }
  });

  app.post("/api/variants", async (req, res) => {
    try {
      const validatedData = insertVariantSchema.parse(req.body);
      const variant = await storage.createVariant(validatedData);
      res.status(201).json(variant);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания варианта" });
    }
  });

  // Subjects routes
  app.get("/api/variants/:variantId/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjectsByVariant(req.params.variantId);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения предметов" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания предмета" });
    }
  });

  // Questions routes
  app.get("/api/subjects/:subjectId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestionsBySubject(req.params.subjectId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения вопросов" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания вопроса" });
    }
  });

  // Answers routes
  app.get("/api/questions/:questionId/answers", async (req, res) => {
    try {
      const answers = await storage.getAnswersByQuestion(req.params.questionId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения ответов" });
    }
  });

  app.post("/api/answers", async (req, res) => {
    try {
      const validatedData = insertAnswerSchema.parse(req.body);
      const answer = await storage.createAnswer(validatedData);
      res.status(201).json(answer);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания ответа" });
    }
  });

  // Test routes
  app.get("/api/variants/:variantId/test", async (req, res) => {
    try {
      const variant = await storage.getVariant(req.params.variantId);
      if (!variant) {
        return res.status(404).json({ message: "Вариант не найден" });
      }

      const subjects = await storage.getSubjectsByVariant(req.params.variantId);
      const testData = [];

      for (const subject of subjects) {
        const questions = await storage.getQuestionsBySubject(subject.id);
        const questionsWithAnswers = [];

        for (const question of questions) {
          const answers = await storage.getAnswersByQuestion(question.id);
          questionsWithAnswers.push({
            ...question,
            answers,
          });
        }

        testData.push({
          subject,
          questions: questionsWithAnswers,
        });
      }

      res.json({
        variant,
        testData,
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения теста" });
    }
  });

  app.post("/api/test-results", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Требуется авторизация" });
      }

      const validatedData = insertTestResultSchema.parse({
        ...req.body,
        userId: req.user?.id,
      });

      const result = await storage.createTestResult(validatedData);
      
      // Update user ranking
      await storage.updateUserRanking(req.user?.id!);

      // Update subject progress if provided
      if (req.body.subjectProgress) {
        for (const [subjectName, progress] of Object.entries(req.body.subjectProgress as Record<string, any>)) {
          await storage.updateSubjectProgress(
            req.user?.id!,
            subjectName,
            progress.totalAnswered,
            progress.correctAnswered
          );
        }
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Ошибка сохранения результата" });
    }
  });

  // User profile routes
  app.get("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Требуется авторизация" });
      }

      const testResults = await storage.getTestResultsByUser(req.user?.id!);
      const ranking = await storage.getUserRanking(req.user?.id!);
      const subjectProgress = await storage.getSubjectProgress(req.user?.id!);

      res.json({
        user: req.user,
        testResults,
        ranking,
        subjectProgress,
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения профиля" });
    }
  });

  // Rankings routes
  app.get("/api/rankings", async (req, res) => {
    try {
      const rankings = await storage.getAllRankings();
      const rankingsWithUsernames = [];

      for (const ranking of rankings) {
        const user = await storage.getUser(ranking.userId);
        if (user) {
          rankingsWithUsernames.push({
            ...ranking,
            username: user.username,
          });
        }
      }

      res.json(rankingsWithUsernames);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения рейтинга" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

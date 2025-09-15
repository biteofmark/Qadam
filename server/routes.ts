import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBlockSchema, insertVariantSchema, insertSubjectSchema, insertQuestionSchema, insertAnswerSchema, insertTestResultSchema,
         insertNotificationSchema, insertNotificationSettingsSchema, insertReminderSchema, notificationTypeSchema,
         analyticsOverviewSchema, subjectAggregateSchema, historyPointSchema, correctnessBreakdownSchema, comparisonStatsSchema } from "@shared/schema";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  next();
}

// Admin authorization middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: "Требуются права администратора" });
  }
  
  next();
}

// Helper function to check if user is admin
function isAdmin(user: any): boolean {
  return user && user.username === "admin";
}

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

  app.post("/api/blocks", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBlockSchema.parse(req.body);
      const block = await storage.createBlock(validatedData);
      res.status(201).json(block);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания блока" });
    }
  });

  app.put("/api/blocks/:id", requireAdmin, async (req, res) => {
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

  app.delete("/api/blocks/:id", requireAdmin, async (req, res) => {
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

  app.post("/api/variants", requireAdmin, async (req, res) => {
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

  app.post("/api/subjects", requireAdmin, async (req, res) => {
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

  app.post("/api/questions", requireAdmin, async (req, res) => {
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

  app.post("/api/answers", requireAdmin, async (req, res) => {
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

      // Get the block for this variant
      const block = await storage.getBlock(variant.blockId);
      if (!block) {
        return res.status(404).json({ message: "Блок не найден" });
      }

      const subjects = await storage.getSubjectsByVariant(req.params.variantId);
      const testData = [];

      for (const subject of subjects) {
        const questions = await storage.getQuestionsBySubject(subject.id);
        const questionsWithAnswers = [];

        for (const question of questions) {
          const answers = await storage.getAnswersByQuestion(question.id);
          // Filter out isCorrect field to prevent revealing correct answers to client
          const safeAnswers = answers.map(answer => ({
            id: answer.id,
            text: answer.text,
          }));
          questionsWithAnswers.push({
            ...question,
            answers: safeAnswers,
          });
        }

        testData.push({
          subject,
          questions: questionsWithAnswers,
        });
      }

      res.json({
        variant: { ...variant, block },
        testData,
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения теста" });
    }
  });

  app.post("/api/test-results", requireAuth, async (req, res) => {
    try {

      const { variantId, answers, timeSpent } = req.body;
      
      if (!variantId || !answers || timeSpent === undefined) {
        return res.status(400).json({ message: "Недостаточно данных" });
      }

      // Get all questions for this variant to calculate score
      const subjects = await storage.getSubjectsByVariant(variantId);
      let totalQuestions = 0;
      let correctAnswers = 0;
      
      for (const subject of subjects) {
        const questions = await storage.getQuestionsBySubject(subject.id);
        for (const question of questions) {
          totalQuestions++;
          const questionAnswers = await storage.getAnswersByQuestion(question.id);
          const userAnswerId = answers[question.id];
          
          if (userAnswerId) {
            const selectedAnswer = questionAnswers.find(a => a.id === userAnswerId);
            if (selectedAnswer?.isCorrect) {
              correctAnswers++;
            }
          }
        }
      }
      
      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      const validatedData = insertTestResultSchema.parse({
        userId: req.user?.id,
        variantId,
        score: correctAnswers,
        totalQuestions,
        percentage,
        timeSpent,
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

      // Create test completion notification
      const variant = await storage.getVariant(variantId);
      if (variant) {
        let achievementMessage = "";
        if (percentage >= 90) {
          achievementMessage = " Отличная работа! 🌟";
        } else if (percentage >= 70) {
          achievementMessage = " Хорошо! 👍";
        }

        await storage.createNotification({
          userId: req.user?.id!,
          type: "TEST_COMPLETED",
          title: "Тест завершен",
          message: `Вы завершили тест ${variant.name}. Результат: ${correctAnswers}/${totalQuestions} (${Math.round(percentage)}%).${achievementMessage}`,
          metadata: {
            testResultId: result.id,
            variantId: variant.id,
            score: correctAnswers,
            totalQuestions,
            percentage: Math.round(percentage),
            timeSpent,
          },
          isRead: false,
          channels: ["in_app"],
        });

        // Create achievement notification for high scores
        if (percentage >= 95) {
          await storage.createNotification({
            userId: req.user?.id!,
            type: "ACHIEVEMENT",
            title: "Новое достижение! 🏆",
            message: `Превосходный результат! Вы набрали ${Math.round(percentage)}% в тесте ${variant.name}. Поздравляем!`,
            metadata: {
              achievement: "HIGH_SCORE",
              testResultId: result.id,
              percentage: Math.round(percentage),
            },
            isRead: false,
            channels: ["in_app"],
          });
        }
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Ошибка сохранения результата" });
    }
  });

  // User profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {

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

  // Get latest test result for current user
  app.get("/api/profile/latest-result", requireAuth, async (req, res) => {
    try {

      const testResults = await storage.getTestResultsByUser(req.user?.id!);
      
      if (testResults.length === 0) {
        return res.status(404).json({ message: "Результаты тестов не найдены" });
      }

      // Sort by completedAt and get the latest one
      const latestResult = testResults.sort((a, b) => 
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
      )[0];

      res.json(latestResult);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения последнего результата" });
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

  // Analytics routes
  app.get("/api/analytics/overview", requireAuth, async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview(req.user?.id!);
      const validatedData = analyticsOverviewSchema.parse(overview);
      res.json(validatedData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения общей аналитики" });
    }
  });

  app.get("/api/analytics/subjects", requireAuth, async (req, res) => {
    try {
      const subjects = await storage.getSubjectAggregates(req.user?.id!);
      const validatedData = subjects.map(subject => subjectAggregateSchema.parse(subject));
      res.json(validatedData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения аналитики по предметам" });
    }
  });

  app.get("/api/analytics/history", requireAuth, async (req, res) => {
    try {
      const rangeDays = req.query.range ? parseInt(req.query.range as string) : 30;
      
      if (isNaN(rangeDays) || rangeDays <= 0 || rangeDays > 365) {
        return res.status(400).json({ message: "Недопустимый диапазон дней (1-365)" });
      }

      const history = await storage.getHistory(req.user?.id!, rangeDays);
      const validatedData = history.map(point => historyPointSchema.parse(point));
      res.json(validatedData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения исторической аналитики" });
    }
  });

  app.get("/api/analytics/correctness", requireAuth, async (req, res) => {
    try {
      const rangeDays = req.query.range ? parseInt(req.query.range as string) : 30;
      
      if (isNaN(rangeDays) || rangeDays <= 0 || rangeDays > 365) {
        return res.status(400).json({ message: "Недопустимый диапазон дней (1-365)" });
      }

      const breakdown = await storage.getCorrectnessBreakdown(req.user?.id!, rangeDays);
      const validatedData = breakdown.map(point => correctnessBreakdownSchema.parse(point));
      res.json(validatedData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения аналитики правильности ответов" });
    }
  });

  app.get("/api/analytics/comparison", requireAuth, async (req, res) => {
    try {
      const comparison = await storage.getComparison(req.user?.id!);
      const validatedData = comparisonStatsSchema.parse(comparison);
      res.json(validatedData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения сравнительной аналитики" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type ? notificationTypeSchema.parse(req.query.type) : undefined;
      
      const result = await storage.getNotifications(req.user?.id!, page, limit, type);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения уведомлений" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user?.id!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения количества непрочитанных уведомлений" });
    }
  });

  app.post("/api/notifications/:id/mark-read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id, req.user?.id!);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка отметки уведомления как прочитанного" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user?.id!);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка отметки всех уведомлений как прочитанных" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id, req.user?.id!);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления уведомления" });
    }
  });

  app.post("/api/notifications/broadcast", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.omit({ userId: true }).parse(req.body);
      
      // Get all users and create notifications for each
      const rankings = await storage.getAllRankings();
      const notifications = [];
      
      for (const ranking of rankings) {
        const notification = await storage.createNotification({
          ...validatedData,
          userId: ranking.userId,
        });
        notifications.push(notification);
      }
      
      res.status(201).json({ created: notifications.length });
    } catch (error) {
      res.status(400).json({ message: "Ошибка рассылки уведомлений" });
    }
  });

  // Notification Settings routes
  app.get("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings(req.user?.id!);
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings = {
          userId: req.user?.id!,
          testCompletedEnabled: true,
          testReminderEnabled: true,
          systemMessageEnabled: true,
          achievementEnabled: true,
          inAppEnabled: true,
          pushEnabled: false,
          emailEnabled: false,
          reminderIntervalMinutes: 30,
          maxRemindersPerDay: 3,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          updatedAt: new Date(),
        };
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения настроек уведомлений" });
    }
  });

  app.put("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertNotificationSettingsSchema.parse({
        ...req.body,
        userId: req.user?.id!,
      });
      const settings = await storage.upsertNotificationSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Ошибка обновления настроек уведомлений" });
    }
  });

  // Reminder routes
  app.get("/api/reminders", requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getReminders(req.user?.id!);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения напоминаний" });
    }
  });

  app.post("/api/reminders", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReminderSchema.parse({
        ...req.body,
        userId: req.user?.id!,
      });
      const reminder = await storage.createReminder(validatedData);
      res.status(201).json(reminder);
    } catch (error) {
      res.status(400).json({ message: "Ошибка создания напоминания" });
    }
  });

  app.patch("/api/reminders/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReminderSchema.partial().parse(req.body);
      const reminder = await storage.updateReminder(req.params.id, validatedData);
      if (!reminder) {
        return res.status(404).json({ message: "Напоминание не найдено" });
      }
      res.json(reminder);
    } catch (error) {
      res.status(400).json({ message: "Ошибка обновления напоминания" });
    }
  });

  app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteReminder(req.params.id, req.user?.id!);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления напоминания" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

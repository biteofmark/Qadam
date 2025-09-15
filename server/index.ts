import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Helper function to check if current time is within quiet hours
function isWithinQuietHours(quietHoursStart: string, quietHoursEnd: string): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  if (quietHoursStart === quietHoursEnd) {
    return false; // No quiet hours if start and end are the same
  }
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
  }
  
  // Handle same-day quiet hours (e.g., 13:00 to 14:00)
  return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
}

// Background job to check for due reminders and send notifications
async function processReminders() {
  try {
    const dueReminders = await storage.getDueReminders();
    
    for (const reminder of dueReminders) {
      // Get user notification settings
      const settings = await storage.getNotificationSettings(reminder.userId);
      
      // Skip if reminder notifications are disabled
      if (settings && !settings.testReminderEnabled) {
        continue;
      }
      
      // Skip if within quiet hours
      if (settings && isWithinQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) {
        continue;
      }
      
      // Check daily limit if settings exist
      if (settings?.maxRemindersPerDay) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayReminderCount = await storage.countNotificationsByTypeSince(
          reminder.userId, 
          "TEST_REMINDER",
          today
        );
        
        if (todayReminderCount >= settings.maxRemindersPerDay) {
          continue; // Skip if daily limit reached
        }
      }
      
      // Get variant information for the reminder
      const variant = await storage.getVariant(reminder.variantId);
      if (!variant) {
        continue;
      }
      
      // Create reminder notification
      await storage.createNotification({
        userId: reminder.userId,
        type: "TEST_REMINDER",
        title: "Время для тестирования! ⏰",
        message: `Не забудьте пройти тест ${variant.name}. Удачи!`,
        metadata: {
          reminderId: reminder.id,
          variantId: reminder.variantId,
          variantName: variant.name,
        },
        isRead: false,
        channels: settings?.inAppEnabled ? ["in_app"] : [],
      });
      
      // Mark reminder as sent
      await storage.markReminderAsSent(reminder.id);
      
      // Handle recurrence if needed
      if (reminder.recurrence) {
        const nextDueDate = new Date(reminder.dueAt);
        switch (reminder.recurrence) {
          case "daily":
            nextDueDate.setDate(nextDueDate.getDate() + 1);
            break;
          case "weekly":
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case "monthly":
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
        }
        
        if (nextDueDate > new Date()) {
          await storage.updateReminder(reminder.id, {
            dueAt: nextDueDate,
          });
        }
      }
    }
  } catch (error) {
    log(`Error processing reminders: ${error}`);
  }
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the reminder scheduler (runs every 60 seconds)
    setInterval(processReminders, 60 * 1000);
    log("Reminder scheduler started");
  });
})();

const { db } = require('./server/db.ts');
const { eq } = require('drizzle-orm');
const { testResults, users } = require('./shared/schema.ts');

async function addTodayTestResults() {
  try {
    console.log('Adding test results for today...');
    
    // Get an existing user
    const existingUsers = await db.select().from(users).limit(5);
    if (existingUsers.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }
    
    const today = new Date();
    
    // Add various test results for today
    const testResultsData = [
      {
        id: `test-result-today-1-${Date.now()}`,
        userId: existingUsers[0].id,
        variantId: 'variant-1',
        score: 85,
        percentage: 85,
        totalQuestions: 100,
        timeSpent: 7200, // 2 hours
        answers: JSON.stringify({ q1: 'a1', q2: 'a2' }),
        completedAt: new Date() // Today
      },
      {
        id: `test-result-today-2-${Date.now()}`,
        userId: existingUsers[0].id,
        variantId: 'variant-2', 
        score: 92,
        percentage: 92,
        totalQuestions: 100,
        timeSpent: 6000, // 1.67 hours
        answers: JSON.stringify({ q1: 'a1', q2: 'a2' }),
        completedAt: new Date() // Today
      },
      {
        id: `test-result-today-3-${Date.now()}`,
        userId: existingUsers[1]?.id || existingUsers[0].id,
        variantId: 'variant-1',
        score: 78,
        percentage: 78,
        totalQuestions: 100,
        timeSpent: 8100, // 2.25 hours
        answers: JSON.stringify({ q1: 'a1', q2: 'a2' }),
        completedAt: new Date() // Today
      }
    ];
    
    for (const result of testResultsData) {
      await db.insert(testResults).values(result);
      console.log(`Added test result with score: ${result.score}`);
    }
    
    console.log('Successfully added today test results!');
    
    // Test the getTodayBestResult function
    console.log('\nTesting getTodayBestResult...');
    const { DatabaseStorage } = require('./server/storage.ts');
    const storage = new DatabaseStorage();
    const bestResult = await storage.getTodayBestResult();
    console.log('Best result today:', bestResult);
    
  } catch (error) {
    console.error('Error adding test results:', error);
  }
  
  process.exit(0);
}

addTodayTestResults();
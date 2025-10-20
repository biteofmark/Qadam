import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { blocks, variants, subjects, questions, answers } from './shared/schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // 1. Создаем блок "ЕНТ 2025"
    const [block] = await db.insert(blocks).values({
      name: 'ЕНТ 2025',
      hasCalculator: true,
      hasPeriodicTable: true
    }).returning();
    console.log('✅ Block created:', block.name);

    // 2. Создаем вариант "Вариант 1" (бесплатный)
    const [variant] = await db.insert(variants).values({
      blockId: block.id,
      name: 'Вариант 1',
      isFree: true,
      duration: 180, // 3 часа
      questionsPerSubject: 5
    }).returning();
    console.log('✅ Variant created:', variant.name);

    // 3. Создаем предметы
    const subjectsList = [
      { name: 'Математика', order: 1 },
      { name: 'Физика', order: 2 },
      { name: 'Химия', order: 3 }
    ];

    const createdSubjects = [];
    for (const subj of subjectsList) {
      const [subject] = await db.insert(subjects).values({
        blockId: block.id,
        name: subj.name,
        order: subj.order
      }).returning();
      createdSubjects.push(subject);
      console.log('✅ Subject created:', subject.name);
    }

    // 4. Создаем вопросы для каждого предмета
    for (const subject of createdSubjects) {
      for (let i = 1; i <= 5; i++) {
        const [question] = await db.insert(questions).values({
          variantId: variant.id,
          subjectId: subject.id,
          questionNumber: i,
          questionText: `${subject.name} - Вопрос ${i}`,
          questionType: 'single'
        }).returning();

        // Создаем ответы
        const answerOptions = ['A', 'B', 'C', 'D', 'E'];
        for (let j = 0; j < 5; j++) {
          await db.insert(answers).values({
            questionId: question.id,
            answerText: `Ответ ${answerOptions[j]}`,
            isCorrect: j === 0 // Первый ответ правильный
          });
        }
        
        console.log(`✅ Question created: ${subject.name} Q${i}`);
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log(`Created:
    - 1 block (ЕНТ 2025)
    - 1 variant (Вариант 1)
    - ${createdSubjects.length} subjects
    - ${createdSubjects.length * 5} questions
    - ${createdSubjects.length * 5 * 5} answers
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
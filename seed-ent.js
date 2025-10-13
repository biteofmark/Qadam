import { config } from 'dotenv';
config();

import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema.ts';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool, { schema });

async function seedENTData() {
    try {
        console.log('🎯 Добавляем данные ЕНТ (Физика-Математика)...');

        // 1. Создаем блок ЕНТ
        const entBlock = await db.insert(schema.blocks).values({
            name: 'ЕНТ Физика-Математика',
            hasCalculator: true
        }).returning();

        console.log('✅ Блок создан:', entBlock[0].name);

        // 2. Создаем вариант теста
        const entVariant = await db.insert(schema.variants).values({
            blockId: entBlock[0].id,
            name: 'ЕНТ 2024 - Физика/Математика',
            isFree: true
        }).returning();

        console.log('✅ Вариант создан');

        // 3. Создаем предметы (120 вопросов)
        const subjects = await db.insert(schema.subjects).values([
            { variantId: entVariant[0].id, name: 'История Казахстана' },
            { variantId: entVariant[0].id, name: 'Математическая грамотность' },
            { variantId: entVariant[0].id, name: 'Грамотность чтения' },
            { variantId: entVariant[0].id, name: 'Математика' },
            { variantId: entVariant[0].id, name: 'Физика' }
        ]).returning();

        console.log('✅ Предметы созданы');

        // 4. Создаем вопросы для каждого предмета
        const questionsData = [];

        // История Казахстана - 20 вопросов
        for (let i = 1; i <= 20; i++) {
            questionsData.push({
                subjectId: subjects[0].id,
                text: `История Казахстана вопрос ${i}: Когда было принято принятие Конституции РК?`
            });
        }

        // Математическая грамотность - 10 вопросов
        for (let i = 1; i <= 10; i++) {
            questionsData.push({
                subjectId: subjects[1].id,
                text: `Математическая грамотность вопрос ${i}: Решите уравнение 2x + 5 = 15`
            });
        }

        // Грамотность чтения - 10 вопросов
        for (let i = 1; i <= 10; i++) {
            questionsData.push({
                subjectId: subjects[2].id,
                text: `Грамотность чтения вопрос ${i}: Проанализируйте текст и ответьте на вопрос`
            });
        }

        // Математика - 40 вопросов
        for (let i = 1; i <= 40; i++) {
            questionsData.push({
                subjectId: subjects[3].id,
                text: `Математика вопрос ${i}: Найдите производную функции f(x) = x² + 3x`
            });
        }

        // Физика - 40 вопросов
        for (let i = 1; i <= 40; i++) {
            questionsData.push({
                subjectId: subjects[4].id,
                text: `Физика вопрос ${i}: Рассчитайте силу тяжести действующую на тело массой 10кг`
            });
        }

        const questions = await db.insert(schema.questions).values(questionsData).returning();
        console.log(`✅ Вопросы созданы: ${questions.length} всего`);

        // 5. Создаем ответы для каждого вопроса (по 4 варианта)
        const answersData = [];
        
        questions.forEach((question, index) => {
            const subjectIndex = Math.floor(index / 20); // Определяем предмет по индексу вопроса
            
            // Создаем 4 варианта ответа для каждого вопроса
            for (let j = 1; j <= 4; j++) {
                answersData.push({
                    questionId: question.id,
                    text: `Вариант ответа ${j} для вопроса ${index + 1}`,
                    isCorrect: j === 1 // Первый вариант правильный
                });
            }
        });

        await db.insert(schema.answers).values(answersData);
        console.log(`✅ Ответы созданы: ${answersData.length} всего`);

        // 6. Создаем тестового пользователя
        const testUser = await db.insert(schema.users).values({
            username: 'student2024',
            email: 'student@ent.kz',
            password: 'ent_password_2024'
        }).returning();

        console.log('✅ Тестовый пользователь создан:', testUser[0].username);

        console.log('🎉 Данные ЕНТ успешно добавлены!');
        console.log('📊 Статистика:');
        console.log('   - Блоков: 1');
        console.log('   - Вариантов: 1');
        console.log('   - Предметов: 5');
        console.log('   - Вопросов: 120');
        console.log('   - Ответов: 480');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка при добавлении данных:', error);
        process.exit(1);
    }
}

seedENTData();
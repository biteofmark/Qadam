import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function createAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Создаем админа
    const result = await client.query(
      `INSERT INTO users (username, password, email, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (username) DO UPDATE 
       SET role = $4, password = $2
       RETURNING id, username, role`,
      ['admin', hashedPassword, 'admin@qadam.com', 'admin']
    );

    console.log('✅ Admin user created/updated:', result.rows[0]);
    console.log('\nLogin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createAdmin();

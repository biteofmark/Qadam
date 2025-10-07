import { spawn } from 'child_process';

const server = spawn('npx', ['tsx', 'server/index.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (error) => {
    console.error('Ошибка запуска:', error);
});

server.on('close', (code) => {
    console.log(`Сервер завершился с кодом: ${code}`);
});
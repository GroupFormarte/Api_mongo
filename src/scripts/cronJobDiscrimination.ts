// import cron from 'node-cron';

// cron.schedule('0 2 * * *', async () => {
//   console.log('[Cron] Ejecutando discriminación nocturna...');
//   const { execSync } = require('child_process');
//   try {
//     execSync('npx ts-node src/scripts/migrations/calculateDiscrimination.ts', 
//       { stdio: 'inherit' });
//   } catch (e) {
//     console.error('[Cron] Error en discriminación:', e);
//   }
// });

// // npm install node-cron
// // npm install @types/node-cron --save-dev
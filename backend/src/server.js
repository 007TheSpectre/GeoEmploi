import app from './app.js';
import { startCron } from './modules/cron/archive.js';

const PORT = process.env.PORT || 3000;

startCron();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

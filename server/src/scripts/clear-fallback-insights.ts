import db from '../db/index.js';

const stale = db
  .prepare(
    `DELETE FROM insights WHERE text LIKE '%GATELLM_API_KEY%' OR text LIKE '%Операция сохранена%'`,
  )
  .run();

console.log(`Удалено устаревших инсайтов: ${stale.changes}`);

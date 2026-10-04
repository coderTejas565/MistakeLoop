import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const result = await pool.query(`
    SELECT
      rc.id,
      rc.question_id,
      rc.kind,
      rc.stage,
      rc.state,
      rc.due_at,
      q.subtopic
    FROM review_cards rc
    JOIN questions q ON q.id = rc.question_id
    ORDER BY rc.id;
  `);

  console.table(result.rows);
  console.log("Review card count:", result.rowCount);

  await pool.end();
}

main().catch(async (error) => {
  console.error("Review card verification failed:", error);
  await pool.end();
  process.exit(1);
});
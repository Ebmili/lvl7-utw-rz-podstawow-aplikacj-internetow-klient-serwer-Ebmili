const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      email VARCHAR(100),
      password VARCHAR(100)
    );
  `;
  await pool.query(query);
};

const createScheduleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      day_of_week INTEGER,
      start_time TIME,
      end_time TIME,
      date DATE
    );
  `;
  await pool.query(query);
};


createUserTable();
createScheduleTable();


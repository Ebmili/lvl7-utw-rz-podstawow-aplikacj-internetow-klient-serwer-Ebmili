const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'coffee',
  host: 'localhost',
  database: 'coffee',
  password: 'coffee',
  port: 5432,
});

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users');
    const users = usersResult.rows;

    const schedulesResult = await pool.query('SELECT * FROM users LEFT JOIN schedules ON users.id = schedules.user_id');
    const schedules = schedulesResult.rows;

    res.render('home', { users, schedules, filterDate: null });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users');
    const users = usersResult.rows;

    const schedulesResult = await pool.query('SELECT * FROM schedules');
    const schedules = schedulesResult.rows;

    const filterDate = req.body.filterDate;
    
    const resetButtonClicked = req.body.hasOwnProperty('reset');

    let filteredSchedules;
    if (resetButtonClicked) {
      filteredSchedules = schedules;
    } else {
      filteredSchedules = filterDate
        ? schedules.filter(schedule => new Date(schedule.date).toISOString().split('T')[0] === filterDate)
        : schedules;
    }

    res.render('home', { users, schedules, filteredSchedules, filterDate, resetButtonClicked });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/newUser', async (req, res) => {
  res.render('new-user');
});

app.post('/newUser', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const userResult = await pool.query('INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
      [firstName, lastName, email, password]);

    const userId = userResult.rows[0].id;

    res.redirect(`/new-schedule/${userId}`);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/new-user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      res.status(404).send('User not found');
      return;
    }

    const user = result.rows[0];
    res.render('new-user', { user, backToHome: true });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/new-schedule/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      res.status(404).send('User not found');
      return;
    }

    const user = result.rows[0];
    res.render('new-schedule', { user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/new-schedule/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { dayOfWeek, date, startTime, endTime } = req.body;

  console.log('Received data:', userId, dayOfWeek, date, startTime, endTime);

  try {
    const formattedDate = new Date(date).toDateString();

    await pool.query('INSERT INTO schedules (user_id, day_of_week, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5)',
      [userId, dayOfWeek, formattedDate, startTime, endTime]);

    console.log('Schedule added successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.post('/delete-schedule/:scheduleId', async (req, res) => {
  const scheduleId = req.params.scheduleId;

  try {
    await pool.query('DELETE FROM schedules WHERE id = $1', [scheduleId]);

    console.log('Schedule deleted successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.post('/delete-user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await pool.query('DELETE FROM schedules WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('User and associated schedules deleted successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});


app.get('/edit-schedule/:scheduleId', async (req, res) => {
  const scheduleId = req.params.scheduleId;

  try {
    const result = await pool.query('SELECT * FROM schedules WHERE id = $1', [scheduleId]);

    if (result.rows.length === 0) {
      res.status(404).send('Schedule not found');
      return;
    }

    const schedule = result.rows[0];
    res.render('edit-schedule', { schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/edit-schedule/:scheduleId', async (req, res) => {
  const scheduleId = req.params.scheduleId;
  const { dayOfWeek, date, startTime, endTime } = req.body;

  try {
    const formattedDate = new Date(date).toDateString();

    await pool.query('UPDATE schedules SET day_of_week = $1, date = $2, start_time = $3, end_time = $4 WHERE id = $5',
      [dayOfWeek, formattedDate, startTime, endTime, scheduleId]);

    console.log('Schedule updated successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.post('/delete-user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await pool.query('DELETE FROM schedules WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('User and associated schedules deleted successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


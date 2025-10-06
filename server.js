require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Submit feedback
app.post("/feedback", async (req, res) => {
  try {
    const {
      full_name,
      water_account_number,
      phone_number,
      zone,
      village,
      uses_giwasco,
      alternative_source,
      water_quality,
      days_per_week,
      contact_method,
      service_rating,
      improvement_areas,
      refer_neighbour,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO feedback 
      (full_name, water_account_number, phone_number, zone, village, uses_giwasco, alternative_source, water_quality, days_per_week, contact_method, service_rating, improvement_areas, refer_neighbour) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        full_name,
        water_account_number,
        phone_number,
        zone,
        village,
        uses_giwasco,
        alternative_source,
        water_quality,
        days_per_week,
        contact_method,
        service_rating,
        improvement_areas,
        refer_neighbour,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error inserting feedback:", err);
    res.status(500).send("Error saving feedback");
  }
});

// Get all feedback
app.get("/feedback", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM feedback ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching feedback:", err);
    res.status(500).send("Error fetching feedback");
  }
});

// --- Customer Service Week Feedback ---

// Submit customer service feedback
app.post("/customerswf", async (req, res) => {
  try {
    const {
      account_number,
      days_with_water,
      water_quality,
      service_rating,
      recommend_us,
      improvement_suggestions,
      longitude,
      latitude,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO csw_feedback
      (account_number, days_with_water, water_quality, service_rating, recommend_us, improvement_suggestions, longitude, latitude)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        account_number || null,
        days_with_water || null,
        water_quality || null,
        service_rating || null,
        recommend_us === undefined ? null : recommend_us,
        improvement_suggestions || null,
        longitude || null,
        latitude || null,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error inserting customer service feedback:", err);
    res.status(500).send("Error saving customer service feedback");
  }
});

// Get all customer service feedback
app.get("/customerswf", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM csw_feedback ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching customer service feedback:", err);
    res.status(500).send("Error fetching customer service feedback");
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

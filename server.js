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

app.post("/public-participation", async (req, res) => {
  const data = req.body;

  if (!data.consent_given) {
    return res.status(400).json({ error: "Consent not given" });
  }

  const query = `
    INSERT INTO tariff_public_participation_responses (
      ward,
      enumerator_name,
      consent_given,
      customer_status,
      phone_number,
      account_number,
      not_connected_reasons,
      wants_future_connection,
      connection_type,
      gender,
      age_group,
      vulnerable_groups,
      tariff_awareness_sources,
      tariff_understanding,
      willing_to_pay_more,
      payment_priorities,
      supports_tariff_adjustment,
      support_reason,
      expected_improvements
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19
    )
    RETURNING id;
  `;

  const values = [
    data.ward,
    data.enumerator_name,
    data.consent_given,
    data.customer_status,
    data.phone_number,
    data.account_number,
    data.not_connected_reasons,
    data.wants_future_connection,
    data.connection_type,
    data.gender,
    data.age_group,
    data.vulnerable_groups,
    data.tariff_awareness_sources,
    data.tariff_understanding,
    data.willing_to_pay_more,
    data.payment_priorities,
    data.supports_tariff_adjustment,
    data.support_reason,
    data.expected_improvements
  ];

  try {
    const result = await pool.query(query, values);
    res.status(201).json({
      success: true,
      submission_id: result.rows[0].id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save response" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

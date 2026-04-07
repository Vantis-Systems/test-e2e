const http = require("http");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method === "GET" && req.url === "/health") {
      const result = await pool.query("SELECT 1 AS ok");
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", db: result.rows[0].ok === 1 ? "connected" : "error" }));
      return;
    }

    if (req.method === "POST" && req.url === "/write") {
      await pool.query(
        "CREATE TABLE IF NOT EXISTS e2e_test (id SERIAL PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW(), payload TEXT)"
      );
      const result = await pool.query(
        "INSERT INTO e2e_test (payload) VALUES ($1) RETURNING id",
        ["e2e-" + Date.now()]
      );
      res.writeHead(200);
      res.end(JSON.stringify({ status: "written", id: result.rows[0].id }));
      return;
    }

    if (req.method === "GET" && req.url === "/read") {
      const result = await pool.query("SELECT id, created_at, payload FROM e2e_test ORDER BY id");
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", rows: result.rows }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "not found" }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

const port = process.env.PORT || 8080;
const server = http.createServer(handler);
server.listen(port, "0.0.0.0", () => {
  console.log("Server running on port " + port);
});

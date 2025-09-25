const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware ca să înțeleagă JSON
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.send("Infinite-IQ server is running ✅");
});

// Endpoint healthcheck pentru Render
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Pornim serverul
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

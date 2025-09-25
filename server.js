const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Servim fișiere statice (ex: index.html)
app.use(express.static(__dirname));

// Healthcheck pentru Render
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `server-${PORT}`;

app.get("/", (req, res) => {
  res.json({
    message: "Response from backend",
    instance: INSTANCE_ID,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", instance: INSTANCE_ID });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ${INSTANCE_ID} running on port ${PORT}`);
});
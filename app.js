require("dotenv").config({ debug: true });
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connect");
const imageRoutes = require("./routes/imageRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// Routes
app.use("/images", imageRoutes);

// Start server
const start = async () => {
  console.log("Starting server..."); // <-- Add this
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`server running at http://localhost:${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

start();

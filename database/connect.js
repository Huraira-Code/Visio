const mongoose = require("mongoose");

const url =
  "mongodb+srv://arham:1234@hms.6v2kiuj.mongodb.net/visionbotDB?appName=HMS";

const connectDB = async () => {
  console.log("Trying to connect to database..."); // this will always show

  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected ✅"); // this shows after successful connection
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // exit if cannot connect
  }
};

module.exports = connectDB;

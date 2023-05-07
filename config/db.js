const express = require("express");

const app = express();
const mongoose = require("mongoose");

const connectDB = async () => {
  const PORT = process.env.PORT || 8000;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");
    app.listen(PORT, () => {
      console.log(`server started on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error:${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

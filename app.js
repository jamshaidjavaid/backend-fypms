const express = require("express");
require("dotenv").config();
const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
  methods: "GET,PUT,PATCH,POST,DELETE",
};

const connectDB = require("./config/db");
connectDB();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const HttpError = require("./models/HttpError");

const app = express();
app.use(express.json());

app.use(cors(corsOptions));

app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

app.listen(5000);

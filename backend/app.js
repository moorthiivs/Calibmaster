const dotenv = require('dotenv');
const result = dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.info(".env file not found; using system environment variables (Production/Azure mode)");
  } else {
    console.error("Failed to load environment variables:", result.error);
  }
} else {
  console.info("Environment variables loaded successfully from .env file (Local mode)");
}

const routers = require('./routes/');
const srfItemsCronservices = require('./cron-service/srf-items-cron');
const masterEquipmentsCronservices = require('./cron-service/master-equipments-cron');
const userTrackCron = require('./cron-service/user-track-cron');
const cron = require('node-cron');
const { generateSrfNumber } = require("./utils/srfService");

const app = express();

// Cron Job Run
// srfItemsCronservices.sendNotificationMail_1();
// srfItemsCronservices.sendNotificationMail_2();
// masterEquipmentsCronservices.emailRemainder_1();
// masterEquipmentsCronservices.emailRemainder_2();

// Cron Job for Daily Midnight Reset (auto-logout + email reminders)
cron.schedule('0 0 * * *', async function () { // run every day at 12:00 AM
  try {
    await srfItemsCronservices.sendNotificationMail_1();
    await srfItemsCronservices.sendNotificationMail_2();
    await masterEquipmentsCronservices.emailRemainder_1();
    await masterEquipmentsCronservices.emailRemainder_2();
    await userTrackCron.autoLogout();
  } catch (err) {
    console.error('Error with cron job setup:', err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Heartbeat cron: marks sessions as LOGOUT if their updatedAt went silent for > 2.5 min.
// This fires every 2 minutes and is the primary safety net for browser closes / sleep mode.
cron.schedule('*/2 * * * *', async function () {
  try {
    await userTrackCron.heartbeatLogout();
  } catch (err) {
    console.error('Error with heartbeat logout cron:', err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

const whitelist = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      //for bypassing postman req with  no origin... Remove this if check when going to prodcution
      return callback(null, true);
    }
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      //console.log("Not allowed by cors");
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors());
app.use(express.static("public"));
app.use(express.json({ limit: "20mb", extended: true }));
app.use(express.urlencoded({ limit: "20mb", extended: true, parameterLimit: 50000 }));

dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');

// ── Login Rate Limiter: max 10 attempts per 15 minutes per IP ──
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "FAILURE",
    code: 429,
    message: "Too many login attempts from this IP. Please try again after 15 minutes."
  },
  skip: (req) => req.department === "root", // Never rate-limit root
});
app.use("/api/users/login", loginRateLimiter);

app.use('/', routers);

//Default Error Handler
app.use((error, req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userId = req.userId;
  const sessionId = req.sessionId;
  const code = error.code || 500;
  const path = error.path;
  const action = error.message;
  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
  logger.error(message);

  // Ensure status code is numeric and within valid HTTP range
  let statusCode = parseInt(code);
  if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  return res.status(statusCode).json({
    status: "FAILURE",
    message: error.message,
    code: code, // Keep original code in the body
  });
});

//Port on which the server will be exposed
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`App is running on port ${PORT}`);
});
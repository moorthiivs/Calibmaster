const dotenv = require('dotenv');
const result = dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
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
const employeeTrackCron = require('./cron-service/employee-track-cron');
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
    await employeeTrackCron.autoLogout();
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
    await employeeTrackCron.heartbeatLogout();
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


logger.info(`App Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Database User Loaded: ${process.env.DB_USERNAME ? 'Yes' : 'No'}`);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/', routers);

//Default Error Handler
app.use((error, req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userId = req.userId;
  const sessionId = req.sessionId;
  const code = error.code;
  const path = error.path;
  const action = error.message;
  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
  logger.error(message);

  return res.status(error.code).json({
    status: "FAILURE",
    message: error.message,
    code: error.code,
  });
});

//Port on which the server will be exposed
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`App is running on port ${PORT}`);
});
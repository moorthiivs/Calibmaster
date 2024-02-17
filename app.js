const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const logger = require("./utils/logger");
const dotenv = require('dotenv');
const routers = require('./routes/');
const srfItemsCronservices = require('./cron-service/srf-items-cron');
const masterEquipmentsCronservices = require('./cron-service/master-equipments-cron');

const app = express();

// Cron Job Run
// srfItemsCronservices.sendNotificationMail_1();
// srfItemsCronservices.sendNotificationMail_2();
masterEquipmentsCronservices.emailRemainder();

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

app.listen(PORT);

logger.info("app is running");
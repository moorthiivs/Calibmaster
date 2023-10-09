const express = require("express");
const bodyParser = require("body-parser");
const usersRoutes = require("./routes/users-routes");
const heartbeatRoute = require("./routes/heartbeat-route");
const companyRoutes = require("./routes/company-routes");
const srfRoutes = require("./routes/srf-routes");
const labRoutes = require("./routes/lab-routes");
const srfdownloadRoute = require("./routes/srfdownload-routes");
const masterlistRoutes = require("./routes/masterlist-routes");
const certificateRoutes = require("./routes/certificate-routes");
const uomRoutes = require("./routes/uom-routes");

const instrumentDisciplineRoutes = require("./routes/instrument-discipline-routes")
const instrumentGroupsRoutes = require("./routes/instrument-groups-routes");
const instrument = require("./routes/instrument-routes");
const instrumentTypes = require("./routes/instrument-types-routes")

const testRoutes = require("./routes/test-route");
const Authorization = require("./middleware/check-auth");
const path = require("path");
var cors = require("cors");
const logger = require("./utils/logger");

const app = express();

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
app.use(express.json({ limit: "20mb", extended: true }))
app.use(express.urlencoded({ limit: "20mb", extended: true, parameterLimit: 50000 }))

//app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Routes of the APP
app.use("/api/heartbeat", heartbeatRoute);
app.use("/api/users", usersRoutes);
app.use("/api/lab", Authorization, labRoutes);
app.use("/api/uom", uomRoutes);

app.use("/api/instrument-discipline", instrumentDisciplineRoutes);
app.use("/api/instrument-groups", instrumentGroupsRoutes);
app.use("/api/instrument", instrument);
app.use("/api/instrument-types", instrumentTypes);

app.use("/api/company", Authorization, companyRoutes);
app.use("/api/srf", Authorization, srfRoutes);
// app.use("/api/download", Authorization, srfdownloadRoute);
// app.use("/api/masterlist", Authorization, masterlistRoutes);
// app.use("/api/certificate", certificateRoutes);

app.use("/api/test", testRoutes);
app.get("/*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

//Default Error Handler
app.use((error, req, res, next) => {
  //console.log("error occured", error);
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userId = req.userId;
  const sessionId = req.sessionId;
  const code = error.code;
  const path = error.path;
  const action = error.message;
  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
  logger.error(message);
  res.status(error.code).json({
    status: "FAILURE",
    message: error.message,
    code: error.code,
  });
});

//Port on which the server will be exposed
const PORT = process.env.PORT || 5000;

app.listen(PORT);

logger.info("app is running");
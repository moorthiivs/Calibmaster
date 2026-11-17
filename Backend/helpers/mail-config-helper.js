const createDynamicTransport = (nodemailer, host, port, user, pass) => {
  const transportConfig = {
    name: "CalibMaster",
    host: host,
    port: port,
    secure: Number(port) === 465, // secure is true for 465, false for other ports
    tls: {
      rejectUnauthorized: false
    }
  };

  // Only include auth if a password is provided and it's not the string "no"
  if (pass && pass.toLowerCase() !== 'no' && pass !== '') {
    transportConfig.auth = {
      user: user,
      pass: pass,
    };
  }

  return nodemailer.createTransport(transportConfig);
};

module.exports = {
  createDynamicTransport,
};

var fs = require('fs');

const decodeBase64Image = (dataString) => {
  let response = {};
  if (!dataString || dataString.indexOf('base64,') === -1) {
    return new Error('Invalid input string');
  }
  const parts = dataString.split('base64,');
  if (parts.length !== 2) {
    return new Error('Invalid input string');
  }
  response.type = parts[0].replace('data:', '').replace(';', '');
  response.data = Buffer.from(parts[1], 'base64');

  return response;
}

const getBase64Image = (imagePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString('base64'));
      }
    });
  });
};

exports.decodeBase64Image = decodeBase64Image;
exports.getBase64Image = getBase64Image;
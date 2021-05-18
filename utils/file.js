const fs = require("fs");

const deleteFile = filePath => {
  try {
    fs.unlink(filePath);
  } catch (error) {
    console.log(`${filePath} do not exist`);
  }
};

module.exports = {
  deleteFile,
};

module.exports = (robot, execa = require('execa')) => {
  const pdfify = async () => {
    execa('node_modules/.bin/pdfify', []).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    });
  };

  robot.on('push', pdfify);
};

const jsyaml = require('js-yaml');
const PDFify = require('./lib/pdfify');

module.exports = async robot => {
  robot.on('push', async (event, context) => {
    const github = await robot.auth(event.payload.installation.id);
    const pdfify = new PDFify(github, event, context, robot.log);
    const yml = await pdfify.config(
      github,
      {
        owner: event.payload.repository.owner.name,
        repo: event.payload.repository.name
      },
      robot
    );
    const config = await jsyaml.safeLoad(yml, 'utf8');
    const push = await pdfify.push(config);

    pdfify.createPDFs();
    robot.log.debug(push);

    return push;
  });

  robot.on('pull_request.synchronize', async (event, context) => {
    const github = await robot.auth(event.payload.installation.id);
    const pdfify = new PDFify(github, event, context, robot.log);
    const pr = await pdfify.pr();

    robot.log.debug(pr);

    return pr;
  });
};

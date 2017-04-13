const jsyaml = require('js-yaml');

class PDFify {
  constructor(github, event, context, logger) {
    logger('constructor()');

    this.github = github;
    this.event = event;
    this.context = context;
    this.logger = logger;

    this.branch = this.event.payload.ref.replace('refs/heads', '') || null;

    logger.info(context.repo());
    logger.info(context.issue());

    logger.debug(`event:  ${event.event || undefined}`);
    logger.debug(`action: ${event.payload.action || undefined}`);
  }

  get commit() {
    this.logger.debug('commit()');
    const commit = this.event.payload.commits[0];

    return {
      author: commit.author.username,
      committer: commit.committer.username
    };
  }

  get pdfifyCommit() {
    this.logger.debug('pdfifyCommit()');
    return this.event.payload.commits[0].message.indexOf('[pdfify me]') > -1;
  }

  get pdfifyFiles() {
    this.logger.debug('pdfifyFiles()');
    const commit = this.event.payload.commits[0];
    const pdfify = [];
    const removed = [];
    const pdfifyFiles = file => {
      if (file.indexOf('.md') > -1) {
        pdfify.push(file);

        return file;
      }
    };
    const removedFiles = file => {
      if (file.indexOf('.md') > -1) {
        removed.push(file);

        return file;
      }
    };

    commit.added.map(pdfifyFiles);
    commit.modified.map(pdfifyFiles);
    commit.removed.map(removedFiles);

    const files = {
      pdfify,
      removed
    };

    return files;
  }

  async config() {
    this.logger.debug('config()');
    return this.github.repos
      .getContent(
        this.context.repo({
          path: PDFify.FILE_NAME
        })
      )
      .then(data => {
        const content = Buffer.from(data.content, 'base64').toString();

        return content;
      });
  }

  async push(config) {
    this.logger.debug('push()');

    this.config = config;

    return {
      commit: this.commit,
      pdfify: this.pdfifyCommit,
      files: this.pdfifyFiles,
      config
    };
  }

  async createPDFs() {
    return this.github.repos
      .createFile(
        this.context.repo({
          path: PDFify.FILE_NAME,
          message: 'PDF created',
          content: Buffer.from(jsyaml.safeDump(this.config)).toString('base64'),
          branch: this.branch,
          comitter: this.commit.committer
        })
      )
      .then(data => {
        this.logger.debug(data);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  async pr() {
    this.logger.debug('pr()');
    return {};
  }
}

PDFify.FILE_NAME = '.github/pdfify.yml';

module.exports = PDFify;

/*
    MIT License

    Copyright (c) 2020 Alexandru Ciobanu (alex+git@ciobanu.org)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

const fs = require('fs');
const path = require('path');
var util = require('util');

const { container, recorder, event, output } = codeceptjs;

const supportedHelpers = [
  'Playwright',
  'Protractor',
  'Puppeteer',
  'TestCafe',
  'WebDriver'
];

const defaultConfig = {
  uniqueNames: false
};

// Find the the acting helper that supports browser logs.
const getBrowserLogsHelper = (helpers) => {
  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      return helpers[helperName];
    }
  }

  return null;
};

// Cleans a test name to make is FS-compatible.
const cleanString = function (str) {
  if (!str) return '';

  str = str
    .replace(/ /g, '_')
    .replace(/"/g, "'")
    .replace(/\//g, '_')
    .replace(/</g, '(')
    .replace(/>/g, ')')
    .replace(/:/g, '_')
    .replace(/\\/g, '_')
    .replace(/\|/g, '_')
    .replace(/\?/g, '.')
    .replace(/\*/g, '^')
    .replace(/'/g, '');

  if (str.indexOf('{') !== -1) {
    str = str.substr(0, str.indexOf('{') - 3).trim();
  }

  return str;
};

// Gets an unique UUID for a test.
const _getUUID = (test) => {
  if (test.uuid) {
    return test.uuid;
  }

  if (test.ctx && test.ctx.test.uuid) {
    return test.ctx.test.uuid;
  }

  return Math.floor(new Date().getTime() / 1000);
};

module.exports = function (config) {
  const helpers = container.helpers();
  const helper = getBrowserLogsHelper(helpers);

  if (!helper) {
    output.plugin('browserLogOnFail', 'Unsupported acting helper.');
    return;
  }

  const options = Object.assign(defaultConfig, helper.options, config);

  if (container.mocha()) {
    options.reportDir =
      container.mocha().options.reporterOptions &&
      container.mocha().options.reporterOptions.reportDir;
  }

  event.dispatcher.on(event.test.failed, (test) => {
    recorder.add(
      'browser log of failed test',
      async () => {
        let fileName = cleanString(test.title);
        const ext = 'failed.txt';

        if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook')
          fileName = cleanString(`${test.title}_${test.ctx.test.title}`);
        if (options.uniqueNames && test) {
          const uuid = _getUUID(test);
          fileName = `${fileName.substring(0, 10)}_${uuid}.${ext}`;
        } else {
          fileName += `.${ext}`;
        }

        output.plugin(
          'browserLogOnFail',
          'Saving browser log for failed test.'
        );

        try {
          let filePath = path.join(global.output_dir, fileName);

          if (options.reportDir) {
            const mochaReportDir = path.resolve(
              process.cwd(),
              options.reportDir
            );

            if (!fs.existsSync(mochaReportDir)) {
              fs.mkdirSync(mochaReportDir);
            }

            filePath = path.join(mochaReportDir, fileName);
          }

          const logs = await helper.grabBrowserLogs();

          if (logs) {
            const text = logs.map((log) => util.format('%O', log)).join('\n');
            fs.writeFileSync(filePath, text);
          }

          test.artifacts.browserLogs = filePath;

          if (
            container.mocha().options.reporterOptions['mocha-junit-reporter'] &&
            container.mocha().options.reporterOptions['mocha-junit-reporter']
              .attachments
          ) {
            if (test.attachments) {
              test.attachments.push(filePath);
            } else {
              test.attachments = [filePath];
            }
          }

          const allureReporter = container.plugins('allure');
          if (allureReporter) {
            allureReporter.addAttachment(
              'Last Seen Browser Logs',
              fs.readFileSync(filePath),
              'text/json'
            );
          }
        } catch (err) {
          output.plugin(err);
          if (
            err &&
            err.type &&
            err.type === 'RuntimeError' &&
            err.message &&
            (err.message.indexOf('was terminated due to') > -1 ||
              err.message.indexOf(
                'no such window: target window already closed'
              ) > -1)
          ) {
            output.log(`Can't extract the browser log, ${err}`);
            helper.isRunning = false;
          }
        }
      },
      true
    );
  });
};

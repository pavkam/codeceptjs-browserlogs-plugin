# Browser Logs Recorder for CodeceptJS

[CodeceptJs](https://codecept.io) plugin that will save browser logs for each failed test. Use this plugin if your web app generates useful logs recorded by the browser.

The following helpers are supported:

* Playwright
* Protractor
* Puppeteer
* TestCafe
* WebDriver

## Setup

Install the plugin using:

```shell
npm i codeceptjs-browserlogs-plugin --save
```

Add the helper to your `codecept.conf.js` file:

```js
plugins: {
  BrowserLogsOnFail: {
    enabled: true,
    uniqueNames: true,
    require: 'codeceptjs-browserlogs-plugin'
  },
}
```

Set the `enabled` property explicitly to `false` to disable the plugin. To generate unique names for each log file (useful in automated testing) use the `uniqueNames` property.

And that is basically it. No other configuration is required.

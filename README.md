# Browser Logs Recorder for CodeceptJS

[CodeceptJs](https://codecept.io) plugin that will save browser logs on test failure.

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

Set the `enabled` property explicitly to `false` to disable the plugin. To generate unique names for each log use the `uniqueNames` property.
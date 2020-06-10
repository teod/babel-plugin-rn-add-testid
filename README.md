# Babel plugin for auto adding test ids and accessibility labels to react native apps

[![npm version](https://img.shields.io/npm/v/babel-plugin-rn-add-testid.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-rn-add-testid)

[Description](#description) | [Install](#install) | [Usage](#usage) | [How it works ?](#how-it-works)

## Description

This babel plugin is intended to be used on legacy react native applications which were not build with testing and accessibility in mind.
It adds <b>testID</b> and <b>accessibilityLabel</b> props to all of the `<Text/>` nodes, in order for these elements to be selectable with autiomation tools (e.g. [appium](https://appiumpro.com/editions/76-testing-react-native-apps-with-appium)).
This plugin by no means is intended to add accessibility to existing applications, please don't use it on production builds, only on <b>qa/dev</b> ones.

Please bear in mind, if you are building a react native application from scratch refrain from using this plugin and try to add proper <b>accessibility</b> rules for your app, this makes your app usable for people with disabilities.

## Install

<i>npm:</i>

```sh
npm install --save-dev babel-plugin-rn-add-testid
```

<i>yarn:</i>

```sh
yarn add babel-plugin-rn-add-testid --dev
```

## Usage

<b>babel.config.js</b>
```js
module.exports = {
  plugins: [
    'rn-add-test-id'
  ]
}
```

## How it works

The plugin parses the contents of the `<Text/>` node and adds its value(s) as <b>testID</b> and <b>accessibilityLabel</b> props. If the `<Text/>` node already has one of these props, it doesn't do anything.

<b>in:</b>
```javascript
<Text>Big brown fox</Text>

<Text>{value}</Text>
```
<b>out:</b>
```javascript
<Text
  testID="big_brown_fox"
  accessibilityLabel="Big brown fox"
>
  Big brown fox
</Text>

<Text
  testID={value}
  accessibilityLabel={value}
>
  {value}
</Text>
```

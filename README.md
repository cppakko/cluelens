<p align="center">
  <img src="./assets/icon.png" alt="ClueLens logo" width="120" height="120" />
</p>

<h1 align="center">ClueLens</h1>

<p align="center">
  A browser dictionary and translation extension for quick word lookup, sentence translation, and multi-source language references.
</p>

<p align="center">
  <a href="https://github.com/cppakko/cluelens/releases"><img src="https://img.shields.io/badge/version-v0.1.3-blue.svg" alt="Version" /></a>
  <a href="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-brightgreen.svg"><img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-brightgreen.svg" alt="Platform" /></a>
  <a href="https://github.com/cppakko/cluelens/blob/main/LICENSE"><img src="https://img.shields.io/github/license/cppakko/cluelens" alt="License" /></a>
  <a href="https://linux.do" alt="LINUX DO"><img src="https://shorturl.at/ggSqS" /></a>
</p>

## Preview

<p align="center">
  <img src="./assets/readme/preview.gif" alt="ClueLens preview" width="640" />
</p>

<p align="center">
  <img src="./assets/readme/screenshot.png" alt="ClueLens screenshot" width="640" />
</p>



## Supported Dictionaries

### Dictionaries

- Bing Dictionary
- Jisho
- DictionaryAPI
- Zdic
- Moegirl
- Wiktionary
- Urban Dictionary
- Open Multilingual Wordnet

### Translators

- Caiyun Translate
- Google Translate
- DeepLx

### AI-Assisted

- OpenAI


## Install From Stores

- [Chrome Web Store](https://chromewebstore.google.com/detail/cluelens-beta/boonogjfoanhlbengnmienaihflicpmp)
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/cluelens/)

## Install from Releases

Download the latest build from the [Releases](https://github.com/cppakko/cluelens/releases) page.

### Chrome/Chromium Browsers

1. Download and extract `cluelens-xxx-chrome.zip`
2. Open `chrome://extensions` or `edge://extensions`
3. Turn on **Developer mode**
4. Click **Load unpacked**
5. Choose the extracted folder

### Firefox

1. Download and extract `cluelens-xxx-firefox.zip`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the manifest file in the extracted folder

## Local Build

### Requirements

- Node.js 18+
- Yarn 1.x

### Install

```bash
yarn install
```

### Optional environment variables

Create a `.env` file if you want to provide a default Caiyun token:

### Run in development

```bash
yarn dev
```

For Firefox:

```bash
yarn dev:firefox
```

### Build locally

```bash
yarn build
```
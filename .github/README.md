<p align="center">
  <img src="../assets/icon.png" alt="ClueLens logo" width="120" height="120" />
</p>

<h1 align="center">ClueLens</h1>

<p align="center">
  A browser dictionary and translation extension with 18 lookup sources, automatic language detection, TTS pronunciation, vocabulary collection, and flexible panel layouts.
</p>

<p align="center">
  <a href="https://github.com/cppakko/cluelens/releases"><img src="https://img.shields.io/badge/version-v0.2.1-blue.svg" alt="Version" /></a>
  <a href="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-brightgreen.svg"><img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-brightgreen.svg" alt="Platform" /></a>
  <a href="https://github.com/cppakko/cluelens/blob/main/LICENSE"><img src="https://img.shields.io/github/license/cppakko/cluelens" alt="License" /></a>
  <a href="https://linux.do" alt="LINUX DO"><img src="https://shorturl.at/ggSqS" /></a>
</p>

<p align="center">
  English | <a href="./README_zh-CN.md">中文</a>
</p>

## Features

- **18 Lookup Sources**: Query 13 dictionaries, 4 translators, and 1 AI source in parallel from a single panel.
- **Automatic Language Detection**: Detect Chinese, Japanese, Korean, English, French, Spanish, and German to skip incompatible sources automatically.
- **Pronunciation and TTS**: Play source audio directly or use Web Speech API and Lingva with optional preload and auto-play.
- **Flexible Surfaces**: Use ClueLens as an inline floating panel, browser popup, or dedicated side panel, with context-menu and keyboard shortcut support.
- **Vocabulary Book**: Save words while browsing, search them later, reopen lookups, and export them as JSON or CSV.
- **Material Design 3 Theming**: Customize seed color, dark mode, hue, chroma, tone, and fonts, including Google Fonts and the SJTU mirror.
- **Backup and Restore**: Export or import settings, enabled source order, vocabulary, and supported per-source configs as JSON.

## Preview

<p align="center">
  <img src="../assets/readme/preview.gif" alt="ClueLens preview" width="640" />
</p>

<p align="center">
  <img src="../assets/readme/screenshot.png" alt="ClueLens screenshot" width="640" />
</p>

## Supported Sources

### Dictionaries

- Bing Dictionary
- Cambridge Dictionary
- DictionaryAPI
- DWDS
- Green's Dictionary of Slang
- Jisho
- Larousse
- Moegirl
- Open Multilingual Wordnet
- SpanishDict
- Urban Dictionary
- Wiktionary
- Zdic

### Translators

- Bing Translate
- Caiyun Translate
- DeepLx
- Google Translate

### AI-Assisted

- OpenAI with compatible APIs and local models

Most web-backed sources also expose an open-source-page action directly from the result card. The main exceptions are DictionaryAPI, Caiyun Translate, DeepLx, and OpenAI.

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

```bash
VITE_CAIYUN_DEFAULT_TOKEN=your-caiyun-token
```

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

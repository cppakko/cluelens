<p align="center">
  <img src="../assets/icon.png" alt="ClueLens logo" width="120" height="120" />
</p>

<h1 align="center">ClueLens</h1>

<p align="center">
  一款浏览器词典与翻译扩展，支持快速划词查词、句子翻译以及多源语言参考。
</p>

<p align="center">
  <a href="https://github.com/cppakko/cluelens/releases"><img src="https://img.shields.io/badge/version-v0.1.4-blue.svg" alt="Version" /></a>
  <a href="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-brightgreen.svg"><img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-brightgreen.svg" alt="Platform" /></a>
  <a href="https://github.com/cppakko/cluelens/blob/main/LICENSE"><img src="https://img.shields.io/github/license/cppakko/cluelens" alt="License" /></a>
  <a href="https://linux.do" alt="LINUX DO"><img src="https://shorturl.at/ggSqS" /></a>
</p>

<p align="center">
  <a href="./README.md">English</a> | 中文
</p>

## 功能介绍

- **快速划词翻译**：在任何网页选中文本即可即时查看释义和翻译。
- **多源支持**：同时支持访问丰富的词典、常规翻译器和AI辅助翻译工具。
- **语音朗读 (TTS)**：直接在面板中收听单词或句子真实发音音轨或 TTS 语音。
- **灵活的界面环境**：可根据您的偏好，配置并用作网页内联悬浮窗、浏览器弹窗（Popup）或者侧边栏（Side panel）。
- **高度定制化**：自由排序、开启/关闭特定的词典和翻译引擎，使其适应您的个人学习/翻译工作流。

## 截图

<p align="center">
  <img src="../assets/readme/preview.gif" alt="ClueLens preview" width="640" />
</p>

<p align="center">
  <img src="../assets/readme/screenshot.png" alt="ClueLens screenshot" width="640" />
</p>

## 支持的字典和机翻

### 词典

- Bing 词典
- Jisho (日语)
- DictionaryAPI
- 汉典 (Zdic)
- 萌娘百科 (Moegirl)
- Wiktionary
- Urban Dictionary
- Open Multilingual Wordnet

### 机翻

- 彩云小译
- Google 翻译
- DeepLx

### AI

- OpenAI

## 从商店安装

- [Chrome 应用商店](https://chromewebstore.google.com/detail/cluelens-beta/boonogjfoanhlbengnmienaihflicpmp)
- [Firefox 附加组件](https://addons.mozilla.org/zh-CN/firefox/addon/cluelens/)

## 通过 Releases 安装

您可以从 [Releases](https://github.com/cppakko/cluelens/releases) 页面下载最新构建好的扩展包。

### Chrome/Chromium 内核浏览器

1. 下载并解压 `cluelens-xxx-chrome.zip`
2. 在浏览器中打开 `chrome://extensions` 或 `edge://extensions`
3. 开启右上角的 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择您解压后的文件夹

### Firefox 浏览器

1. 下载并解压 `cluelens-xxx-firefox.zip`
2. 在浏览器中打开 `about:debugging#/runtime/this-firefox`
3. 点击 **临时载入附加组件...**
4. 选择解压后文件夹中的 manifest 文件即可

## 本地构建/开发

### 环境要求

- Node.js 18+
- Yarn 1.x

### 安装依赖

```bash
yarn install
```

### 可选环境变量

若需要提供自定义的默认彩云小译 Token，可以创建一个 `.env` 文件进行配置

### 开发环境运行

```bash
yarn dev
```

如需针对 Firefox 进行开发：

```bash
yarn dev:firefox
```

### 本地打包构建

```bash
yarn build
```

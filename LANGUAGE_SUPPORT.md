# 多语言支持文档 / Multi-Language Support Documentation

## 概述 / Overview

Quick-sh 现已支持多语言，可根据系统语言自动选择适合的语言显示。目前支持中文、英文和日文。

Quick-sh now supports multiple languages and automatically selects the appropriate language based on your system language. Currently supports Chinese, English, and Japanese.

## 支持的语言 / Supported Languages

- **中文 (Chinese)** - `zh`
- **English** - `en` 
- **日本語 (Japanese)** - `ja`

## 自动语言检测 / Automatic Language Detection

系统会根据以下环境变量自动检测语言：
The system automatically detects language based on these environment variables:

1. `LC_ALL`
2. `LC_MESSAGES` 
3. `LANG`
4. `LANGUAGE`

默认语言为英文。
Default language is English.

## 手动切换语言 / Manual Language Switching

### 临时切换 / Temporary Switch

```bash
# 切换到英文 / Switch to English
LANG=en_US q --help

# 切换到中文 / Switch to Chinese  
LANG=zh_CN q --help

# 切换到日文 / Switch to Japanese
LANG=ja_JP q --help
```

### 永久设置 / Permanent Setting

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中设置
# Set in ~/.bashrc or ~/.zshrc
export LANG=en_US.UTF-8  # 英文/English
export LANG=zh_CN.UTF-8  # 中文/Chinese
export LANG=ja_JP.UTF-8  # 日文/Japanese
```

## 语言文件位置 / Language Files Location

语言配置文件位于：
Language configuration files are located at:

- `locales/en.json` - 英文翻译 / English translations
- `locales/zh.json` - 中文翻译 / Chinese translations  
- `locales/ja.json` - 日文翻译 / Japanese translations

## 添加新语言 / Adding New Languages

如需添加新语言支持：
To add support for a new language:

1. 在 `locales/` 目录创建新的语言文件（如 `fr.json`）
   Create a new language file in `locales/` directory (e.g., `fr.json`)

2. 复制 `en.json` 的内容并翻译所有文本
   Copy content from `en.json` and translate all texts

3. 在 `lib/i18n.js` 中的 `SUPPORTED_LANGUAGES` 添加新语言
   Add the new language to `SUPPORTED_LANGUAGES` in `lib/i18n.js`

4. 在 `detectSystemLanguage()` 函数中添加语言映射
   Add language mapping in `detectSystemLanguage()` function

## 翻译覆盖范围 / Translation Coverage

所有用户可见的文本都已支持多语言：
All user-visible text now supports multiple languages:

- ✅ 帮助信息 / Help messages
- ✅ 状态显示 / Status display  
- ✅ 错误信息 / Error messages
- ✅ 命令输出 / Command output
- ✅ 远程脚本管理 / Remote script management
- ❌ 工具脚本（git-account, npm-version等）/ Tool scripts (partial)

## 示例 / Examples

### 查看帮助 / View Help

```bash
# 中文环境 / Chinese environment
$ q --help
🚀 快速脚本工具 (q) - 脚本管理工具
用法:
  q <script> [args...]    执行脚本
  ...

# 英文环境 / English environment  
$ LANG=en_US q --help
🚀 quick sh (q) - Script Management Tool
USAGE:
  q <script> [args...]    Execute a script
  ...

# 日文环境 / Japanese environment
$ LANG=ja_JP q --help  
🚀 クイックスクリプトツール (q) - スクリプト管理ツール
使用法:
  q <script> [args...]    スクリプトを実行
  ...
```

### 查看状态 / View Status

```bash
# 中文
$ q -l
📁 当前脚本路径: /path/to/scripts
🔗 配置的别名:
...

# English
$ LANG=en_US q -l
📁 Current script path: /path/to/scripts  
🔗 Configured aliases:
...
```

### 错误信息 / Error Messages

```bash
# 中文
$ q nonexistent
命令未找到: nonexistent
查找位置:
- 别名配置: ...

# English  
$ LANG=en_US q nonexistent
Command not found: nonexistent
Looked in:
- Alias config: ...
```

## 技术实现 / Technical Implementation

### 国际化模块 / i18n Module

- 位置：`lib/i18n.js`
- 功能：语言检测、翻译文本、参数替换
- Location: `lib/i18n.js`
- Features: Language detection, text translation, parameter substitution

### 使用方式 / Usage

```javascript
const { t } = require('./i18n');

// 简单翻译 / Simple translation
console.log(t('app.name'));

// 带参数翻译 / Translation with parameters
console.log(t('commands.pathSet', { path: '/some/path' }));
```

### 参数替换 / Parameter Substitution

使用 `{{参数名}}` 格式进行参数替换：
Use `{{paramName}}` format for parameter substitution:

```javascript
// 英文 / English
"pathSet": "Script path set to: {{path}}"

// 中文 / Chinese  
"pathSet": "脚本路径已设置为: {{path}}"

// 使用 / Usage
t('commands.pathSet', { path: '/home/user/scripts' })
```

## 贡献翻译 / Contributing Translations

欢迎贡献新的语言翻译或改进现有翻译！
We welcome contributions for new language translations or improvements to existing ones!

1. Fork 项目 / Fork the project
2. 添加或修改语言文件 / Add or modify language files
3. 测试翻译 / Test the translations
4. 提交 Pull Request / Submit a Pull Request

## 注意事项 / Notes

1. 系统会自动回退到英文如果请求的语言文件不存在
   System automatically falls back to English if requested language file doesn't exist

2. 翻译使用嵌套JSON结构便于组织
   Translations use nested JSON structure for better organization

3. 所有翻译都支持参数插值
   All translations support parameter interpolation

4. 语言检测基于系统环境变量，无需手动配置
   Language detection is based on system environment variables, no manual configuration needed 
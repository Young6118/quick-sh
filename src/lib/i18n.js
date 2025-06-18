const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// 语言配置文件路径
const LANG_DIR = path.join(__dirname, '..', 'locales');

// 默认语言
const DEFAULT_LANG = 'en';

// 支持的语言
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'zh': '中文',
  'ja': '日本語'
};

// 当前语言
let currentLanguage = DEFAULT_LANG;
let translations = {};

// 检测系统语言
function detectSystemLanguage() {
  try {
    // 检查是否在测试环境中
    if (process.env.QUICK_SH_TEST_LANG) {
      return process.env.QUICK_SH_TEST_LANG;
    }
    
    // 获取系统语言环境
    const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE || 'en_US';
    
    // 提取语言代码
    const langCode = locale.split(/[_.-]/)[0].toLowerCase();
    
    // 语言映射
    const langMap = {
      'en': 'en',
      'zh': 'zh',
      'ja': 'ja',
      'chinese': 'zh',
      'japanese': 'ja',
      'english': 'en'
    };
    
    return langMap[langCode] || DEFAULT_LANG;
  } catch (error) {
    return DEFAULT_LANG;
  }
}

// 加载语言文件
async function loadLanguage(lang = null) {
  try {
    let targetLang = lang;
    
    // 在测试环境中，优先使用测试语言设置
    if (!targetLang && process.env.QUICK_SH_TEST_LANG) {
      targetLang = process.env.QUICK_SH_TEST_LANG;
    }
    
    // 如果没有指定语言，先尝试获取用户设置的语言
    if (!targetLang) {
      try {
        const { getUserLanguage } = require('./config');
        const userLang = await getUserLanguage();
        targetLang = userLang || detectSystemLanguage();
      } catch (error) {
        // 如果获取用户语言失败，回退到系统检测
        targetLang = detectSystemLanguage();
      }
    }
    
    // 确保语言被支持
    if (!SUPPORTED_LANGUAGES[targetLang]) {
      currentLanguage = DEFAULT_LANG;
    } else {
      currentLanguage = targetLang;
    }
    
    // 加载翻译文件
    const langFile = path.join(LANG_DIR, `${currentLanguage}.json`);
    
    if (await fs.pathExists(langFile)) {
      translations = await fs.readJson(langFile);
    } else {
      // 如果文件不存在，回退到英文
      currentLanguage = DEFAULT_LANG;
      const fallbackFile = path.join(LANG_DIR, `${DEFAULT_LANG}.json`);
      if (await fs.pathExists(fallbackFile)) {
        translations = await fs.readJson(fallbackFile);
      } else {
        translations = {};
      }
    }
  } catch (error) {
    // 发生错误时使用默认语言
    currentLanguage = DEFAULT_LANG;
    translations = {};
  }
}

// 获取翻译文本
function t(key, params = {}) {
  try {
    // 支持嵌套键值，如 'errors.notFound'
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，返回键值本身
        return key;
      }
    }
    
    // 如果找到的不是字符串，返回键值
    if (typeof value !== 'string') {
      return key;
    }
    
    // 替换参数
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
    }
    
    return result;
  } catch (error) {
    return key;
  }
}

// 获取当前语言
function getCurrentLanguage() {
  return currentLanguage;
}

// 获取支持的语言列表
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

// 设置语言
async function setLanguage(lang) {
  await loadLanguage(lang);
}

// 初始化国际化系统
async function initI18n() {
  await loadLanguage();
}

// 强制重新初始化（用于测试）
async function forceReinitI18n() {
  currentLanguage = DEFAULT_LANG;
  translations = {};
  await loadLanguage();
}

module.exports = {
  t,
  getCurrentLanguage,
  getSupportedLanguages,
  setLanguage,
  initI18n,
  detectSystemLanguage,
  forceReinitI18n
}; 
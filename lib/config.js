const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { t } = require('./i18n');

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.quick-sh');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 确保配置目录存在
async function ensureConfigDir() {
  await fs.ensureDir(CONFIG_DIR);
}

// 读取全局配置
async function readConfig() {
  try {
    await ensureConfigDir();
    if (await fs.pathExists(CONFIG_FILE)) {
      return await fs.readJson(CONFIG_FILE);
    }
    return {};
  } catch (error) {
    return {};
  }
}

// 写入全局配置
async function writeConfig(config) {
  try {
    await ensureConfigDir();
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
  } catch (error) {
    console.error(t('errors.configWriteError', { error: error.message }));
  }
}

// 读取脚本目录中的alias配置
async function readAliasConfig(scriptPath) {
  try {
    const aliasConfigPath = path.join(scriptPath, 'config.json');
    if (await fs.pathExists(aliasConfigPath)) {
      return await fs.readJson(aliasConfigPath);
    }
    return {};
  } catch (error) {
    return {};
  }
}

// 设置脚本路径
async function setPath(scriptPath) {
  const absolutePath = path.resolve(scriptPath);
  
  if (!await fs.pathExists(absolutePath)) {
    console.error(t('commands.pathNotFound', { path: absolutePath }));
    process.exit(1);
  }
  
  const config = await readConfig();
  config.scriptPath = absolutePath;
  await writeConfig(config);
  
  console.log(t('commands.pathSet', { path: absolutePath }));
}

// 设置语言
async function setLanguage(language) {
  const { getSupportedLanguages } = require('./i18n');
  const supportedLanguages = getSupportedLanguages();
  
  if (!supportedLanguages[language]) {
    console.error(t('commands.unsupportedLanguage', { 
      language, 
      supported: Object.keys(supportedLanguages).join(', ') 
    }));
    process.exit(1);
  }
  
  const config = await readConfig();
  config.language = language;
  await writeConfig(config);
  
  console.log(t('commands.languageSet', { 
    language: `${supportedLanguages[language]} (${language})` 
  }));
}

// 获取用户设置的语言
async function getUserLanguage() {
  const config = await readConfig();
  return config.language || null;
}

// 显示当前语言设置
async function showLanguage() {
  const { getCurrentLanguage, getSupportedLanguages } = require('./i18n');
  const supportedLanguages = getSupportedLanguages();
  const currentLang = getCurrentLanguage();
  const userLang = await getUserLanguage();
  
  console.log(t('commands.currentLanguage'));
  console.log(`  ${t('commands.activeLanguage')}: ${supportedLanguages[currentLang]} (${currentLang})`);
  
  if (userLang) {
    console.log(`  ${t('commands.userSetLanguage')}: ${supportedLanguages[userLang]} (${userLang})`);
  } else {
    console.log(`  ${t('commands.autoDetected')}: ${t('commands.yes')}`);
  }
  
  console.log(`\n${t('commands.supportedLanguages')}:`);
  Object.entries(supportedLanguages).forEach(([code, name]) => {
    const isCurrent = code === currentLang;
    const isUserSet = code === userLang;
    const status = isCurrent ? ' ← ' + t('commands.current') : '';
    console.log(`  • ${code.padEnd(4)} ${name}${status}`);
  });
}

module.exports = {
  readConfig,
  writeConfig,
  readAliasConfig,
  setPath,
  setLanguage,
  getUserLanguage,
  showLanguage
}; 
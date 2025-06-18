#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.quick-sh');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 读取配置文件
async function readConfig() {
  try {
    await fs.ensureDir(CONFIG_DIR);
    if (await fs.pathExists(CONFIG_FILE)) {
      return await fs.readJson(CONFIG_FILE);
    }
    return {};
  } catch (error) {
    return {};
  }
}

// 写入配置文件
async function writeConfig(config) {
  try {
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(colorize(`配置保存失败: ${error.message}`, 'red'));
    return false;
  }
}

// 获取当前git配置
function getCurrentGitConfig() {
  try {
    const name = execSync('git config --global user.name', { encoding: 'utf8' }).trim();
    const email = execSync('git config --global user.email', { encoding: 'utf8' }).trim();
    return { name, email };
  } catch (error) {
    return { name: '', email: '' };
  }
}

// 设置git配置
function setGitConfig(name, email) {
  try {
    execSync(`git config --global user.name "${name}"`);
    execSync(`git config --global user.email "${email}"`);
    return true;
  } catch (error) {
    console.error(colorize(`Git配置设置失败: ${error.message}`, 'red'));
    return false;
  }
}

// 创建readline接口
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// 提示用户输入
function prompt(question) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// 显示当前Git配置
function showCurrentConfig() {
  const current = getCurrentGitConfig();
  console.log(colorize('\n📋 当前Git配置:', 'cyan'));
  console.log(`   👤 用户名: ${colorize(current.name || '未设置', current.name ? 'green' : 'yellow')}`);
  console.log(`   📧 邮箱:   ${colorize(current.email || '未设置', current.email ? 'green' : 'yellow')}`);
}

// 显示已保存的账号列表
function showSavedAccounts(accounts) {
  console.log(colorize('\n💾 已保存的Git账号:', 'cyan'));
  if (!accounts || Object.keys(accounts).length === 0) {
    console.log(colorize('   暂无已保存的账号', 'dim'));
    return;
  }
  
  Object.entries(accounts).forEach(([key, account], index) => {
    const current = getCurrentGitConfig();
    const isCurrent = current.name === account.name && current.email === account.email;
    const status = isCurrent ? colorize(' ✓ 当前使用', 'green') : '';
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${colorize(key, 'bright')}${status}`);
    console.log(`       👤 ${account.name}`);
    console.log(`       📧 ${account.email}`);
  });
}

// 添加新账号
async function addNewAccount(config) {
  console.log(colorize('\n➕ 添加新的Git账号', 'cyan'));
  
  const key = await prompt('请输入账号标识 (如: work, personal): ');
  if (!key) {
    console.log(colorize('账号标识不能为空', 'red'));
    return config;
  }
  
  const name = await prompt('请输入用户名: ');
  if (!name) {
    console.log(colorize('用户名不能为空', 'red'));
    return config;
  }
  
  const email = await prompt('请输入邮箱: ');
  if (!email) {
    console.log(colorize('邮箱不能为空', 'red'));
    return config;
  }
  
  // 确认信息
  console.log(colorize('\n确认账号信息:', 'yellow'));
  console.log(`标识: ${colorize(key, 'bright')}`);
  console.log(`用户名: ${colorize(name, 'bright')}`);
  console.log(`邮箱: ${colorize(email, 'bright')}`);
  
  const confirm = await prompt('\n确认添加此账号? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log(colorize('已取消添加', 'yellow'));
    return config;
  }
  
  // 保存到配置
  if (!config.gitAccounts) {
    config.gitAccounts = {};
  }
  
  config.gitAccounts[key] = { name, email };
  
  console.log(colorize(`✅ 账号 "${key}" 添加成功!`, 'green'));
  
  // 询问是否立即切换
  const switchNow = await prompt('是否立即切换到此账号? (y/N): ');
  if (switchNow.toLowerCase() === 'y') {
    if (setGitConfig(name, email)) {
      console.log(colorize(`🔄 已切换到账号 "${key}"`, 'green'));
    }
  }
  
  return config;
}

// 切换到指定账号
async function switchToAccount(accounts) {
  const accountKeys = Object.keys(accounts);
  if (accountKeys.length === 0) {
    console.log(colorize('暂无已保存的账号', 'yellow'));
    return;
  }
  
  console.log(colorize('\n🔄 选择要切换的账号:', 'cyan'));
  accountKeys.forEach((key, index) => {
    const account = accounts[key];
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${colorize(key, 'bright')}`);
    console.log(`       👤 ${account.name}`);
    console.log(`       📧 ${account.email}`);
  });
  
  const choice = await prompt(`\n请选择账号 (1-${accountKeys.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accountKeys.length) {
    console.log(colorize('无效的选择', 'red'));
    return;
  }
  
  const selectedKey = accountKeys[index];
  const selectedAccount = accounts[selectedKey];
  
  if (setGitConfig(selectedAccount.name, selectedAccount.email)) {
    console.log(colorize(`✅ 已切换到账号 "${selectedKey}"`, 'green'));
    console.log(`   👤 ${selectedAccount.name}`);
    console.log(`   📧 ${selectedAccount.email}`);
  }
}

// 删除账号
async function deleteAccount(config) {
  const accounts = config.gitAccounts || {};
  const accountKeys = Object.keys(accounts);
  
  if (accountKeys.length === 0) {
    console.log(colorize('暂无已保存的账号', 'yellow'));
    return config;
  }
  
  console.log(colorize('\n🗑️  选择要删除的账号:', 'cyan'));
  accountKeys.forEach((key, index) => {
    const account = accounts[key];
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${colorize(key, 'bright')}`);
    console.log(`       👤 ${account.name}`);
    console.log(`       📧 ${account.email}`);
  });
  
  const choice = await prompt(`\n请选择要删除的账号 (1-${accountKeys.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accountKeys.length) {
    console.log(colorize('无效的选择', 'red'));
    return config;
  }
  
  const selectedKey = accountKeys[index];
  const selectedAccount = accounts[selectedKey];
  
  console.log(colorize('\n确认删除账号:', 'yellow'));
  console.log(`标识: ${colorize(selectedKey, 'bright')}`);
  console.log(`用户名: ${colorize(selectedAccount.name, 'bright')}`);
  console.log(`邮箱: ${colorize(selectedAccount.email, 'bright')}`);
  
  const confirm = await prompt('\n确认删除此账号? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log(colorize('已取消删除', 'yellow'));
    return config;
  }
  
  delete config.gitAccounts[selectedKey];
  console.log(colorize(`✅ 账号 "${selectedKey}" 删除成功!`, 'green'));
  
  return config;
}

// 显示主菜单
async function showMainMenu() {
  console.log(colorize('\n🔧 Git账号管理工具', 'bright'));
  console.log(colorize('==================', 'dim'));
  
  const config = await readConfig();
  const accounts = config.gitAccounts || {};
  
  // 显示当前配置
  showCurrentConfig();
  
  // 显示已保存的账号
  showSavedAccounts(accounts);
  
  console.log(colorize('\n📋 可用操作:', 'cyan'));
  console.log(`   ${colorize('[1]', 'yellow')} 切换到已保存的账号`);
  console.log(`   ${colorize('[2]', 'yellow')} 添加新账号`);
  console.log(`   ${colorize('[3]', 'yellow')} 删除已保存的账号`);
  console.log(`   ${colorize('[4]', 'yellow')} 刷新显示`);
  console.log(`   ${colorize('[0]', 'yellow')} 退出`);
  
  const choice = await prompt('\n请选择操作 (0-4): ');
  
  switch (choice) {
    case '1':
      await switchToAccount(accounts);
      break;
    case '2':
      const newConfig = await addNewAccount(config);
      await writeConfig(newConfig);
      break;
    case '3':
      const updatedConfig = await deleteAccount(config);
      await writeConfig(updatedConfig);
      break;
    case '4':
      // 刷新 - 重新显示菜单
      return showMainMenu();
    case '0':
      console.log(colorize('\n👋 再见!', 'green'));
      return;
    default:
      console.log(colorize('无效的选择，请重新选择', 'red'));
  }
  
  // 询问是否继续
  const continueChoice = await prompt('\n按回车键继续，或输入 q 退出: ');
  if (continueChoice.toLowerCase() !== 'q') {
    return showMainMenu();
  }
}

// 主函数
async function main() {
  try {
    // 检查是否安装了git
    try {
      execSync('git --version', { stdio: 'ignore' });
    } catch (error) {
      console.error(colorize('❌ 未检测到Git，请先安装Git', 'red'));
      process.exit(1);
    }
    
    await showMainMenu();
  } catch (error) {
    console.error(colorize(`程序运行出错: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
} 
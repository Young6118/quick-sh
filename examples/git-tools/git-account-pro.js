#!/usr/bin/env node

const readline = require('readline');
const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.quick-sh');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SSH_DIR = path.join(os.homedir(), '.ssh');

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
      const config = await fs.readJson(CONFIG_FILE);
      
      // 确保Git账号管理相关的字段存在
      if (!config.gitAccounts) {
        config.gitAccounts = {};
      }
      if (!config.gitAccountRules) {
        config.gitAccountRules = {
          directories: {},
          repositories: {},
          domains: {}
        };
      }
      if (!config.gitAccountSettings) {
        config.gitAccountSettings = {
          autoSwitch: true,
          sshKeyManagement: true,
          defaultAccount: null
        };
      }
      
      return config;
    }
    return {
      gitAccounts: {},
      gitAccountRules: {
        directories: {},
        repositories: {},
        domains: {}
      },
      gitAccountSettings: {
        autoSwitch: true,
        sshKeyManagement: true,
        defaultAccount: null
      }
    };
  } catch (error) {
    console.error(colorize(`配置读取失败: ${error.message}`, 'red'));
    return {
      gitAccounts: {},
      gitAccountRules: { directories: {}, repositories: {}, domains: {} },
      gitAccountSettings: { autoSwitch: true, sshKeyManagement: true, defaultAccount: null }
    };
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
function getCurrentGitConfig(local = false) {
  try {
    const scope = local ? '--local' : '--global';
    const name = execSync(`git config ${scope} user.name`, { encoding: 'utf8' }).trim();
    const email = execSync(`git config ${scope} user.email`, { encoding: 'utf8' }).trim();
    return { name, email };
  } catch (error) {
    return { name: '', email: '' };
  }
}

// 设置git配置
function setGitConfig(name, email, local = false) {
  try {
    const scope = local ? '--local' : '--global';
    execSync(`git config ${scope} user.name "${name}"`);
    execSync(`git config ${scope} user.email "${email}"`);
    return true;
  } catch (error) {
    console.error(colorize(`Git配置设置失败: ${error.message}`, 'red'));
    return false;
  }
}

// 检测当前目录信息
function detectCurrentContext() {
  const cwd = process.cwd();
  
  // 检查是否在Git仓库中
  let isGitRepo = false;
  let remoteUrl = '';
  let repoName = '';
  
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    isGitRepo = true;
    
    try {
      remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
      repoName = path.basename(remoteUrl.replace(/\.git$/, ''));
    } catch (error) {
      // 可能没有远程仓库
    }
  } catch (error) {
    // 不在git仓库中
  }
  
  return {
    cwd,
    isGitRepo,
    remoteUrl,
    repoName,
    directory: path.basename(cwd)
  };
}

// 智能匹配账号
function smartMatchAccount(config, context) {
  const { gitAccounts, gitAccountRules } = config;
  const { cwd, remoteUrl } = context;
  
  // 1. 检查目录规则
  for (const [pattern, accountKey] of Object.entries(gitAccountRules.directories)) {
    if (cwd.includes(pattern.replace('*', ''))) {
      if (gitAccounts[accountKey]) {
        return { account: gitAccounts[accountKey], key: accountKey, reason: `目录规则: ${pattern}` };
      }
    }
  }
  
  // 2. 检查仓库规则
  if (remoteUrl) {
    for (const [pattern, accountKey] of Object.entries(gitAccountRules.repositories)) {
      if (remoteUrl.includes(pattern)) {
        if (gitAccounts[accountKey]) {
          return { account: gitAccounts[accountKey], key: accountKey, reason: `仓库规则: ${pattern}` };
        }
      }
    }
    
    // 3. 检查域名规则
    for (const [domain, accountKey] of Object.entries(gitAccountRules.domains)) {
      if (remoteUrl.includes(domain)) {
        if (gitAccounts[accountKey]) {
          return { account: gitAccounts[accountKey], key: accountKey, reason: `域名规则: ${domain}` };
        }
      }
    }
  }
  
  // 4. 使用默认账号
  if (config.gitAccountSettings.defaultAccount && gitAccounts[config.gitAccountSettings.defaultAccount]) {
    return { 
      account: gitAccounts[config.gitAccountSettings.defaultAccount], 
      key: config.gitAccountSettings.defaultAccount, 
      reason: '默认账号' 
    };
  }
  
  return null;
}

// SSH密钥管理
class SSHKeyManager {
  constructor() {
    this.sshDir = SSH_DIR;
  }
  
  // 检查SSH密钥是否存在
  async checkSSHKey(accountKey) {
    const keyPath = path.join(this.sshDir, `id_rsa_${accountKey}`);
    const pubKeyPath = `${keyPath}.pub`;
    
    return {
      exists: await fs.pathExists(keyPath) && await fs.pathExists(pubKeyPath),
      keyPath,
      pubKeyPath
    };
  }
  
  // 生成SSH密钥
  async generateSSHKey(accountKey, email) {
    const keyPath = path.join(this.sshDir, `id_rsa_${accountKey}`);
    
    try {
      await fs.ensureDir(this.sshDir);
      
      return new Promise((resolve, reject) => {
        const sshKeygen = spawn('ssh-keygen', [
          '-t', 'rsa',
          '-b', '4096',
          '-C', email,
          '-f', keyPath,
          '-N', '' // 无密码
        ], { stdio: 'inherit' });
        
        sshKeygen.on('close', (code) => {
          if (code === 0) {
            console.log(colorize(`✅ SSH密钥生成成功: ${keyPath}`, 'green'));
            resolve(true);
          } else {
            reject(new Error(`SSH密钥生成失败，退出码: ${code}`));
          }
        });
      });
    } catch (error) {
      console.error(colorize(`SSH密钥生成失败: ${error.message}`, 'red'));
      return false;
    }
  }
  
  // 配置SSH config
  async updateSSHConfig(accounts) {
    const sshConfigPath = path.join(this.sshDir, 'config');
    let configContent = '';
    
    // 读取现有配置（保留非Git账号相关的配置）
    if (await fs.pathExists(sshConfigPath)) {
      const existingConfig = await fs.readFile(sshConfigPath, 'utf8');
      const lines = existingConfig.split('\n');
      let inGitAccountSection = false;
      
      for (const line of lines) {
        if (line.includes('# Git Account Pro - Start')) {
          inGitAccountSection = true;
          continue;
        }
        if (line.includes('# Git Account Pro - End')) {
          inGitAccountSection = false;
          continue;
        }
        if (!inGitAccountSection) {
          configContent += line + '\n';
        }
      }
    }
    
    // 添加Git账号配置
    configContent += '\n# Git Account Pro - Start\n';
    
    for (const [accountKey, account] of Object.entries(accounts)) {
      const keyInfo = await this.checkSSHKey(accountKey);
      if (keyInfo.exists) {
        // 为每个Git托管平台配置
        const domains = ['github.com', 'gitlab.com', 'bitbucket.org'];
        
        for (const domain of domains) {
          configContent += `Host ${domain}-${accountKey}\n`;
          configContent += `  HostName ${domain}\n`;
          configContent += `  User git\n`;
          configContent += `  IdentityFile ${keyInfo.keyPath}\n`;
          configContent += `  IdentitiesOnly yes\n\n`;
        }
      }
    }
    
    configContent += '# Git Account Pro - End\n';
    
    try {
      await fs.writeFile(sshConfigPath, configContent);
      console.log(colorize('✅ SSH配置更新成功', 'green'));
      return true;
    } catch (error) {
      console.error(colorize(`SSH配置更新失败: ${error.message}`, 'red'));
      return false;
    }
  }
}

const sshManager = new SSHKeyManager();

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

// 显示当前状态
async function showCurrentStatus() {
  const context = detectCurrentContext();
  const globalConfig = getCurrentGitConfig(false);
  const localConfig = context.isGitRepo ? getCurrentGitConfig(true) : null;
  const config = await readConfig();
  
  console.log(colorize('\n📊 当前Git状态', 'cyan'));
  console.log('='.repeat(50));
  
  // 显示当前目录信息
  console.log(colorize('📁 目录信息:', 'bright'));
  console.log(`   当前路径: ${colorize(context.cwd, 'yellow')}`);
  console.log(`   Git仓库: ${colorize(context.isGitRepo ? '是' : '否', context.isGitRepo ? 'green' : 'red')}`);
  
  if (context.isGitRepo) {
    console.log(`   远程地址: ${colorize(context.remoteUrl || '未设置', context.remoteUrl ? 'green' : 'yellow')}`);
  }
  
  // 显示Git配置
  console.log(colorize('\n⚙️  Git配置:', 'bright'));
  console.log(`   全局用户: ${colorize(globalConfig.name || '未设置', globalConfig.name ? 'green' : 'yellow')}`);
  console.log(`   全局邮箱: ${colorize(globalConfig.email || '未设置', globalConfig.email ? 'green' : 'yellow')}`);
  
  if (localConfig && (localConfig.name || localConfig.email)) {
    console.log(`   本地用户: ${colorize(localConfig.name || '继承全局', 'green')}`);
    console.log(`   本地邮箱: ${colorize(localConfig.email || '继承全局', 'green')}`);
  }
  
  // 智能推荐
  const match = smartMatchAccount(config, context);
  if (match) {
    const currentMatches = (globalConfig.name === match.account.name && globalConfig.email === match.account.email) ||
                          (localConfig && localConfig.name === match.account.name && localConfig.email === match.account.email);
    
    console.log(colorize('\n🤖 智能推荐:', 'bright'));
    console.log(`   推荐账号: ${colorize(match.key, 'yellow')} (${match.reason})`);
    console.log(`   用户名: ${match.account.name}`);
    console.log(`   邮箱: ${match.account.email}`);
    console.log(`   当前状态: ${colorize(currentMatches ? '✅ 已匹配' : '⚠️  不匹配', currentMatches ? 'green' : 'yellow')}`);
    
    if (!currentMatches && config.gitAccountSettings.autoSwitch) {
      console.log(colorize('   💡 提示: 启用了自动切换，运行 "auto" 命令可自动应用', 'dim'));
    }
  }
}

// 自动切换功能
async function autoSwitch(local = false) {
  const context = detectCurrentContext();
  const config = await readConfig();
  
  if (!config.gitAccountSettings.autoSwitch) {
    console.log(colorize('❌ 自动切换功能已禁用', 'red'));
    return false;
  }
  
  const match = smartMatchAccount(config, context);
  if (!match) {
    console.log(colorize('❌ 没有找到匹配的账号规则', 'yellow'));
    return false;
  }
  
  const scope = local ? '本地' : '全局';
  console.log(colorize(`🔄 自动切换${scope}Git配置...`, 'cyan'));
  console.log(`   匹配规则: ${match.reason}`);
  console.log(`   目标账号: ${colorize(match.key, 'yellow')}`);
  console.log(`   用户名: ${match.account.name}`);
  console.log(`   邮箱: ${match.account.email}`);
  
  if (setGitConfig(match.account.name, match.account.email, local)) {
    console.log(colorize(`✅ ${scope}Git配置切换成功!`, 'green'));
    return true;
  } else {
    console.log(colorize(`❌ ${scope}Git配置切换失败!`, 'red'));
    return false;
  }
}

// 账号管理
async function manageAccounts() {
  const config = await readConfig();
  
  while (true) {
    console.log(colorize('\n👥 账号管理', 'cyan'));
    console.log('='.repeat(30));
    
    // 显示已保存的账号
    const accounts = config.gitAccounts;
    if (Object.keys(accounts).length > 0) {
      console.log(colorize('📋 已保存的账号:', 'bright'));
      Object.entries(accounts).forEach(([key, account], index) => {
        const sshStatus = sshManager.checkSSHKey(key);
        console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${colorize(key, 'bright')}`);
        console.log(`       👤 ${account.name}`);
        console.log(`       📧 ${account.email}`);
      });
    } else {
      console.log(colorize('📭 暂无已保存的账号', 'dim'));
    }
    
    console.log(colorize('\n操作选项:', 'bright'));
    console.log(`   ${colorize('[1]', 'yellow')} 添加新账号`);
    console.log(`   ${colorize('[2]', 'yellow')} 删除账号`);
    console.log(`   ${colorize('[3]', 'yellow')} 编辑账号`);
    console.log(`   ${colorize('[4]', 'yellow')} SSH密钥管理`);
    console.log(`   ${colorize('[0]', 'yellow')} 返回主菜单`);
    
    const choice = await prompt('\n请选择操作: ');
    
    switch (choice) {
      case '1':
        await addAccount(config);
        break;
      case '2':
        await deleteAccount(config);
        break;
      case '3':
        await editAccount(config);
        break;
      case '4':
        await manageSSHKeys(config);
        break;
      case '0':
        return;
      default:
        console.log(colorize('❌ 无效选择', 'red'));
    }
    
    await writeConfig(config);
  }
}

// 添加账号
async function addAccount(config) {
  console.log(colorize('\n➕ 添加新账号', 'cyan'));
  
  const key = await prompt('账号标识 (如: work, personal): ');
      if (!key || config.gitAccounts[key]) {
    console.log(colorize(key ? '账号已存在' : '标识不能为空', 'red'));
    return;
  }
  
  const name = await prompt('用户名: ');
  const email = await prompt('邮箱: ');
  
  if (!name || !email) {
    console.log(colorize('用户名和邮箱不能为空', 'red'));
    return;
  }
  
      config.gitAccounts[key] = { name, email };
  
  // 询问是否生成SSH密钥
  if (config.gitAccountSettings.sshKeyManagement) {
    const generateSSH = await prompt('是否生成SSH密钥? (y/N): ');
    if (generateSSH.toLowerCase() === 'y') {
      await sshManager.generateSSHKey(key, email);
      await sshManager.updateSSHConfig(config.gitAccounts);
    }
  }
  
  console.log(colorize(`✅ 账号 "${key}" 添加成功!`, 'green'));
}

// 删除账号
async function deleteAccount(config) {
  const accounts = Object.keys(config.gitAccounts);
  if (accounts.length === 0) {
    console.log(colorize('暂无账号可删除', 'yellow'));
    return;
  }
  
  console.log(colorize('\n🗑️  选择要删除的账号:', 'cyan'));
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择账号 (1-${accounts.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accounts.length) {
    console.log(colorize('无效选择', 'red'));
    return;
  }
  
  const accountKey = accounts[index];
  const confirm = await prompt(`确认删除账号 "${accountKey}"? (y/N): `);
  
  if (confirm.toLowerCase() === 'y') {
    delete config.gitAccounts[accountKey];
    
    // 清理相关规则
    Object.keys(config.gitAccountRules).forEach(ruleType => {
      Object.keys(config.gitAccountRules[ruleType]).forEach(pattern => {
        if (config.gitAccountRules[ruleType][pattern] === accountKey) {
          delete config.gitAccountRules[ruleType][pattern];
        }
      });
    });
    
    // 如果是默认账号，清除默认设置
    if (config.gitAccountSettings.defaultAccount === accountKey) {
      config.gitAccountSettings.defaultAccount = null;
    }
    
    console.log(colorize(`✅ 账号 "${accountKey}" 删除成功!`, 'green'));
  }
}

// 编辑账号
async function editAccount(config) {
  const accounts = Object.keys(config.gitAccounts);
  if (accounts.length === 0) {
    console.log(colorize('暂无账号可编辑', 'yellow'));
    return;
  }
  
  console.log(colorize('\n✏️  选择要编辑的账号:', 'cyan'));
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择账号 (1-${accounts.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accounts.length) {
    console.log(colorize('无效选择', 'red'));
    return;
  }
  
  const accountKey = accounts[index];
  const account = config.gitAccounts[accountKey];
  
  console.log(colorize(`\n编辑账号: ${accountKey}`, 'cyan'));
  
  const newName = await prompt(`用户名 [${account.name}]: `);
  const newEmail = await prompt(`邮箱 [${account.email}]: `);
  
  if (newName) account.name = newName;
  if (newEmail) account.email = newEmail;
  
  console.log(colorize('✅ 账号信息更新成功!', 'green'));
}

// SSH密钥管理
async function manageSSHKeys(config) {
  console.log(colorize('\n🔑 SSH密钥管理', 'cyan'));
  console.log('='.repeat(40));
  
  const accounts = Object.keys(config.gitAccounts);
  if (accounts.length === 0) {
    console.log(colorize('暂无账号', 'yellow'));
    return;
  }
  
  // 显示所有账号的SSH密钥状态
  console.log(colorize('SSH密钥状态:', 'bright'));
  for (const accountKey of accounts) {
    const keyInfo = await sshManager.checkSSHKey(accountKey);
    const status = keyInfo.exists ? colorize('✅ 已生成', 'green') : colorize('❌ 未生成', 'red');
    console.log(`   ${colorize(accountKey, 'yellow')}: ${status}`);
    if (keyInfo.exists) {
      console.log(`     私钥: ${keyInfo.keyPath}`);
      console.log(`     公钥: ${keyInfo.pubKeyPath}`);
    }
  }
  
  console.log(colorize('\n操作选项:', 'bright'));
  console.log(`   ${colorize('[1]', 'yellow')} 为指定账号生成SSH密钥`);
  console.log(`   ${colorize('[2]', 'yellow')} 更新SSH配置文件`);
  console.log(`   ${colorize('[3]', 'yellow')} 显示公钥内容`);
  console.log(`   ${colorize('[0]', 'yellow')} 返回`);
  
  const choice = await prompt('\n请选择操作: ');
  
  switch (choice) {
    case '1':
      await generateSSHKeyForAccount(config, accounts);
      break;
    case '2':
      await sshManager.updateSSHConfig(config.gitAccounts);
      break;
    case '3':
      await showPublicKey(accounts);
      break;
    case '0':
      return;
    default:
      console.log(colorize('❌ 无效选择', 'red'));
  }
}

async function generateSSHKeyForAccount(config, accounts) {
  console.log(colorize('\n选择账号:', 'cyan'));
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择账号 (1-${accounts.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accounts.length) {
    console.log(colorize('无效选择', 'red'));
    return;
  }
  
  const accountKey = accounts[index];
  const account = config.gitAccounts[accountKey];
  
  const keyInfo = await sshManager.checkSSHKey(accountKey);
  if (keyInfo.exists) {
    const overwrite = await prompt('SSH密钥已存在，是否覆盖? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      return;
    }
  }
  
  await sshManager.generateSSHKey(accountKey, account.email);
  await sshManager.updateSSHConfig(config.gitAccounts);
}

async function showPublicKey(accounts) {
  console.log(colorize('\n选择账号:', 'cyan'));
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择账号 (1-${accounts.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accounts.length) {
    console.log(colorize('无效选择', 'red'));
    return;
  }
  
  const accountKey = accounts[index];
  const keyInfo = await sshManager.checkSSHKey(accountKey);
  
  if (!keyInfo.exists) {
    console.log(colorize('该账号没有SSH密钥', 'red'));
    return;
  }
  
  try {
    const publicKey = await fs.readFile(keyInfo.pubKeyPath, 'utf8');
    console.log(colorize(`\n📋 ${accountKey} 的公钥:`, 'cyan'));
    console.log('='.repeat(60));
    console.log(publicKey.trim());
    console.log('='.repeat(60));
    console.log(colorize('💡 复制上面的公钥内容到Git托管平台的SSH设置中', 'dim'));
  } catch (error) {
    console.log(colorize(`读取公钥失败: ${error.message}`, 'red'));
  }
}

// 规则管理
async function manageRules() {
  const config = await readConfig();
  
  while (true) {
    console.log(colorize('\n📋 自动切换规则', 'cyan'));
    console.log('='.repeat(40));
    
    // 显示现有规则
    console.log(colorize('📁 目录规则:', 'bright'));
    const dirRules = Object.entries(config.gitAccountRules.directories);
    if (dirRules.length > 0) {
      dirRules.forEach(([pattern, account], index) => {
        console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${pattern} → ${colorize(account, 'green')}`);
      });
    } else {
      console.log(colorize('   暂无目录规则', 'dim'));
    }
    
    console.log(colorize('\n🌐 域名规则:', 'bright'));
    const domainRules = Object.entries(config.gitAccountRules.domains);
    if (domainRules.length > 0) {
      domainRules.forEach(([domain, account], index) => {
        console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${domain} → ${colorize(account, 'green')}`);
      });
    } else {
      console.log(colorize('   暂无域名规则', 'dim'));
    }
    
    console.log(colorize('\n操作选项:', 'bright'));
    console.log(`   ${colorize('[1]', 'yellow')} 添加目录规则`);
    console.log(`   ${colorize('[2]', 'yellow')} 添加域名规则`);
    console.log(`   ${colorize('[3]', 'yellow')} 删除规则`);
    console.log(`   ${colorize('[4]', 'yellow')} 测试规则`);
    console.log(`   ${colorize('[0]', 'yellow')} 返回主菜单`);
    
    const choice = await prompt('\n请选择操作: ');
    
    switch (choice) {
      case '1':
        await addDirectoryRule(config);
        break;
      case '2':
        await addDomainRule(config);
        break;
      case '3':
        await deleteRule(config);
        break;
      case '4':
        await testRules(config);
        break;
      case '0':
        return;
      default:
        console.log(colorize('❌ 无效选择', 'red'));
    }
    
    await writeConfig(config);
  }
}

async function addDirectoryRule(config) {
  const accounts = Object.keys(config.gitAccounts);
  if (accounts.length === 0) {
    console.log(colorize('❌ 请先添加账号', 'red'));
    return;
  }
  
  console.log(colorize('\n➕ 添加目录规则', 'cyan'));
  
  const pattern = await prompt('目录模式 (如: /Users/username/work, ~/company/*): ');
  if (!pattern) {
    console.log(colorize('❌ 目录模式不能为空', 'red'));
    return;
  }
  
  console.log(colorize('\n选择关联账号:', 'bright'));
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择账号 (1-${accounts.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accounts.length) {
    console.log(colorize('❌ 无效选择', 'red'));
    return;
  }
  
  const accountKey = accounts[index];
  config.gitAccountRules.directories[pattern] = accountKey;
  
  console.log(colorize(`✅ 规则添加成功: ${pattern} → ${accountKey}`, 'green'));
}

async function addDomainRule(config) {
  const accounts = Object.keys(config.gitAccounts);
  if (accounts.length === 0) {
    console.log(colorize('❌ 请先添加账号', 'red'));
    return;
  }
  
  console.log(colorize('\n➕ 添加域名规则', 'cyan'));
  
  const domain = await prompt('域名 (如: github.com, gitlab.company.com): ');
  if (!domain) {
    console.log(colorize('❌ 域名不能为空', 'red'));
    return;
  }
  
  console.log(colorize('\n选择关联账号:', 'bright'));
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择账号 (1-${accounts.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= accounts.length) {
    console.log(colorize('❌ 无效选择', 'red'));
    return;
  }
  
  const accountKey = accounts[index];
  config.gitAccountRules.domains[domain] = accountKey;
  
  console.log(colorize(`✅ 规则添加成功: ${domain} → ${accountKey}`, 'green'));
}

async function deleteRule(config) {
  const allRules = [];
  
  // 收集所有规则
  Object.entries(config.gitAccountRules.directories).forEach(([pattern, account]) => {
    allRules.push({ type: 'directory', pattern, account });
  });
  
  Object.entries(config.gitAccountRules.domains).forEach(([domain, account]) => {
    allRules.push({ type: 'domain', pattern: domain, account });
  });
  
  if (allRules.length === 0) {
    console.log(colorize('❌ 暂无规则可删除', 'yellow'));
    return;
  }
  
  console.log(colorize('\n🗑️  选择要删除的规则:', 'cyan'));
  allRules.forEach((rule, index) => {
    const icon = rule.type === 'directory' ? '📁' : '🌐';
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${icon} ${rule.pattern} → ${colorize(rule.account, 'green')}`);
  });
  
  const choice = await prompt(`\n选择规则 (1-${allRules.length}): `);
  const index = parseInt(choice) - 1;
  
  if (isNaN(index) || index < 0 || index >= allRules.length) {
    console.log(colorize('❌ 无效选择', 'red'));
    return;
  }
  
  const rule = allRules[index];
  const confirm = await prompt(`确认删除规则 "${rule.pattern}"? (y/N): `);
  
  if (confirm.toLowerCase() === 'y') {
    if (rule.type === 'directory') {
      delete config.gitAccountRules.directories[rule.pattern];
    } else {
      delete config.gitAccountRules.domains[rule.pattern];
    }
    console.log(colorize(`✅ 规则删除成功!`, 'green'));
  }
}

async function testRules(config) {
  console.log(colorize('\n🧪 规则测试', 'cyan'));
  
  const testPath = await prompt('输入要测试的路径或Git URL: ');
  if (!testPath) return;
  
  // 模拟上下文
  const mockContext = {
    cwd: testPath.startsWith('http') ? process.cwd() : testPath,
    isGitRepo: testPath.startsWith('http'),
    remoteUrl: testPath.startsWith('http') ? testPath : '',
    repoName: testPath.startsWith('http') ? path.basename(testPath.replace(/\.git$/, '')) : '',
    directory: path.basename(testPath)
  };
  
  const match = smartMatchAccount(config, mockContext);
  
  if (match) {
    console.log(colorize('✅ 匹配成功!', 'green'));
    console.log(`   匹配账号: ${colorize(match.key, 'yellow')}`);
    console.log(`   匹配规则: ${match.reason}`);
    console.log(`   用户名: ${match.account.name}`);
    console.log(`   邮箱: ${match.account.email}`);
  } else {
    console.log(colorize('❌ 没有匹配的规则', 'red'));
  }
}

// 设置管理
async function manageSettings() {
  const config = await readConfig();
  
  while (true) {
    console.log(colorize('\n⚙️  设置管理', 'cyan'));
    console.log('='.repeat(30));
    
    console.log(colorize('当前设置:', 'bright'));
    console.log(`   自动切换: ${colorize(config.gitAccountSettings.autoSwitch ? '启用' : '禁用', config.gitAccountSettings.autoSwitch ? 'green' : 'red')}`);
    console.log(`   SSH密钥管理: ${colorize(config.gitAccountSettings.sshKeyManagement ? '启用' : '禁用', config.gitAccountSettings.sshKeyManagement ? 'green' : 'red')}`);
    console.log(`   默认账号: ${colorize(config.gitAccountSettings.defaultAccount || '未设置', config.gitAccountSettings.defaultAccount ? 'green' : 'yellow')}`);
    
    console.log(colorize('\n操作选项:', 'bright'));
    console.log(`   ${colorize('[1]', 'yellow')} 切换自动切换功能`);
    console.log(`   ${colorize('[2]', 'yellow')} 切换SSH密钥管理`);
    console.log(`   ${colorize('[3]', 'yellow')} 设置默认账号`);
    console.log(`   ${colorize('[0]', 'yellow')} 返回主菜单`);
    
    const choice = await prompt('\n请选择操作: ');
    
    switch (choice) {
      case '1':
        config.gitAccountSettings.autoSwitch = !config.gitAccountSettings.autoSwitch;
        console.log(colorize(`自动切换功能已${config.gitAccountSettings.autoSwitch ? '启用' : '禁用'}`, 'green'));
        break;
      case '2':
        config.gitAccountSettings.sshKeyManagement = !config.gitAccountSettings.sshKeyManagement;
        console.log(colorize(`SSH密钥管理已${config.gitAccountSettings.sshKeyManagement ? '启用' : '禁用'}`, 'green'));
        break;
      case '3':
        await setDefaultAccount(config);
        break;
      case '0':
        await writeConfig(config);
        return;
      default:
        console.log(colorize('❌ 无效选择', 'red'));
    }
    
    await writeConfig(config);
  }
}

async function setDefaultAccount(config) {
  const accounts = Object.keys(config.gitAccounts);
  if (accounts.length === 0) {
    console.log(colorize('❌ 请先添加账号', 'red'));
    return;
  }
  
  console.log(colorize('\n选择默认账号:', 'cyan'));
  console.log(`   ${colorize('[0]', 'yellow')} 清除默认账号`);
  accounts.forEach((key, index) => {
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${key}`);
  });
  
  const choice = await prompt(`\n选择 (0-${accounts.length}): `);
  const index = parseInt(choice);
  
  if (index === 0) {
    config.gitAccountSettings.defaultAccount = null;
    console.log(colorize('✅ 已清除默认账号', 'green'));
  } else if (index >= 1 && index <= accounts.length) {
    const accountKey = accounts[index - 1];
    config.gitAccountSettings.defaultAccount = accountKey;
    console.log(colorize(`✅ 默认账号设置为: ${accountKey}`, 'green'));
  } else {
    console.log(colorize('❌ 无效选择', 'red'));
  }
}

// 主菜单
async function showMainMenu() {
  while (true) {
    await showCurrentStatus();
    
    console.log(colorize('\n🚀 Git账号管理专业版', 'bright'));
    console.log('='.repeat(50));
    
    console.log(colorize('操作选项:', 'bright'));
    console.log(`   ${colorize('[1]', 'yellow')} 自动切换 (当前目录)`);
    console.log(`   ${colorize('[2]', 'yellow')} 自动切换 (本地仓库)`);
    console.log(`   ${colorize('[3]', 'yellow')} 账号管理`);
    console.log(`   ${colorize('[4]', 'yellow')} 规则管理`);
    console.log(`   ${colorize('[5]', 'yellow')} 设置管理`);
    console.log(`   ${colorize('[6]', 'yellow')} 刷新状态`);
    console.log(`   ${colorize('[0]', 'yellow')} 退出`);
    
    const choice = await prompt('\n请选择操作: ');
    
    switch (choice) {
      case '1':
        await autoSwitch(false);
        break;
      case '2':
        await autoSwitch(true);
        break;
      case '3':
        await manageAccounts();
        break;
      case '4':
        await manageRules();
        break;
      case '5':
        await manageSettings();
        break;
      case '6':
        // 刷新状态 - 继续循环
        break;
      case '0':
        console.log(colorize('\n👋 再见!', 'green'));
        return;
      default:
        console.log(colorize('❌ 无效选择', 'red'));
    }
    
    if (choice !== '6' && choice !== '0') {
      await prompt('\n按回车键继续...');
    }
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
    
    // 命令行参数处理
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      const command = args[0];
      
      switch (command) {
        case 'auto':
          await autoSwitch(false);
          break;
        case 'auto-local':
          await autoSwitch(true);
          break;
        case 'status':
          await showCurrentStatus();
          break;
        case 'accounts':
          await manageAccounts();
          break;
        case 'rules':
          await manageRules();
          break;
        case 'settings':
          await manageSettings();
          break;
        case 'init':
          console.log(colorize('🚀 初始化Git账号管理专业版...', 'cyan'));
          await showMainMenu();
          break;
        default:
          console.log(colorize(`❌ 未知命令: ${command}`, 'red'));
          console.log(colorize('可用命令: auto, auto-local, status, accounts, rules, settings, init', 'dim'));
      }
    } else {
      await showMainMenu();
    }
  } catch (error) {
    console.error(colorize(`程序运行出错: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  main,
  autoSwitch,
  showCurrentStatus,
  detectCurrentContext,
  smartMatchAccount
}; 
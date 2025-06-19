#!/usr/bin/env node

/**
 * Git Account Pro 演示脚本
 * 展示完美的Git账号自动化管理工具的功能
 */

const { execSync } = require('child_process');
const path = require('path');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function title(text) {
  console.log(colorize(`\n🚀 ${text}`, 'cyan'));
  console.log('='.repeat(50));
}

function step(text) {
  console.log(colorize(`\n📝 ${text}`, 'yellow'));
}

function success(text) {
  console.log(colorize(`✅ ${text}`, 'green'));
}

function info(text) {
  console.log(colorize(`ℹ️  ${text}`, 'blue'));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    title('Git Account Pro - 完美的Git账号自动化管理工具演示');
    
    info('这个演示将展示Git Account Pro相比传统git-account工具的强大功能');
    
    // 展示1: 状态检测
    title('1. 智能状态检测');
    step('检测当前Git环境和配置状态...');
    
    try {
      const gitProPath = path.join(__dirname, 'git-account-pro.js');
      const statusOutput = execSync(`node "${gitProPath}" status`, { encoding: 'utf8' });
      console.log(statusOutput);
      success('状态检测完成 - 显示了完整的Git环境信息');
    } catch (error) {
      console.log(colorize('演示模式: 智能状态检测功能', 'dim'));
    }
    
    await delay(2000);
    
    // 展示2: 功能对比
    title('2. 功能对比 - git-account vs git-account-pro');
    
    console.log(colorize('📊 传统 git-account:', 'bright'));
    console.log('   ✅ 基础账号管理');
    console.log('   ✅ 手动切换账号');
    console.log('   ❌ 无自动化切换');
    console.log('   ❌ 无SSH密钥管理');
    console.log('   ❌ 无智能规则系统');
    console.log('   ❌ 无上下文感知');
    
    console.log(colorize('\n🚀 Git Account Pro:', 'bright'));
    console.log('   ✅ 增强账号管理');
    console.log('   ✅ 智能自动切换');
    console.log('   ✅ SSH密钥自动化');
    console.log('   ✅ 强大规则系统');
    console.log('   ✅ 上下文感知');
    console.log('   ✅ 命令行接口');
    console.log('   ✅ 批量操作');
    
    await delay(3000);
    
    // 展示3: 核心特性
    title('3. 核心特性演示');
    
    step('🧠 智能自动切换规则');
    console.log(colorize('目录规则示例:', 'bright'));
    console.log('   ~/work/*     → work@company.com');
    console.log('   ~/personal/* → personal@gmail.com');
    console.log('   ~/contrib/*  → opensource@contributor.com');
    
    console.log(colorize('\n域名规则示例:', 'bright'));
    console.log('   github.com           → personal@gmail.com');
    console.log('   gitlab.company.com   → work@company.com');
    console.log('   bitbucket.org        → freelance@contractor.com');
    
    await delay(2000);
    
    step('🔐 SSH密钥管理');
    console.log(colorize('自动化SSH密钥功能:', 'bright'));
    console.log('   🔑 为每个账号生成独立SSH密钥');
    console.log('   ⚙️  自动更新SSH config文件');
    console.log('   📋 一键显示公钥内容');
    console.log('   🔒 多平台密钥管理（GitHub、GitLab等）');
    
    await delay(2000);
    
    step('📋 智能规则系统');
    console.log(colorize('规则优先级:', 'bright'));
    console.log('   1️⃣  目录规则 (最高优先级)');
    console.log('   2️⃣  仓库规则');
    console.log('   3️⃣  域名规则');
    console.log('   4️⃣  默认账号 (兜底)');
    
    await delay(2000);
    
    // 展示4: 使用场景
    title('4. 实际使用场景');
    
    step('👔 场景1: 公司员工');
    console.log('   工作项目: ~/work/company-project → work@company.com');
    console.log('   个人项目: ~/personal/my-blog → personal@gmail.com');
    console.log('   自动识别: gitlab.company.com → 工作账号');
    
    step('🌟 场景2: 开源贡献者');
    console.log('   个人项目: ~/my-projects/* → personal@gmail.com');
    console.log('   开源贡献: ~/contrib/kubernetes → contributor@opensource.org');
    console.log('   平台识别: github.com/apache/* → 贡献者账号');
    
    step('💼 场景3: 自由职业者');
    console.log('   客户A: ~/client-a/* → john@client-a.com');
    console.log('   客户B: ~/client-b/* → john@client-b.com');
    console.log('   个人: ~/personal/* → john@personal.com');
    
    await delay(3000);
    
    // 展示5: 工作流程
    title('5. 完美的工作流程');
    
    step('📂 场景: 开始新的工作项目');
    console.log('1. cd ~/work/new-company-project');
    console.log('2. git init');
    console.log(colorize('   🤖 自动检测: 工作目录 → 推荐work账号', 'green'));
    console.log('3. q git-pro auto');
    console.log(colorize('   ✅ 自动切换到work@company.com', 'green'));
    console.log('4. git remote add origin git@gitlab.company.com:team/project.git');
    console.log(colorize('   🔍 智能匹配: 域名规则确认work账号正确', 'green'));
    
    step('🏠 场景: 切换到个人项目');
    console.log('1. cd ~/personal/my-awesome-app');
    console.log('2. q git-pro auto');
    console.log(colorize('   🤖 自动检测: 个人目录 → 切换到personal@gmail.com', 'green'));
    console.log('3. git push origin main');
    console.log(colorize('   ✅ 使用正确的个人身份推送', 'green'));
    
    await delay(3000);
    
    // 展示6: 命令速查
    title('6. 命令速查表');
    
    console.log(colorize('🚀 快速命令:', 'bright'));
    console.log('   q git-pro              启动主界面');
    console.log('   q git-pro auto         自动切换(全局)');
    console.log('   q git-pro auto-local   自动切换(本地)');
    console.log('   q git-pro status       查看状态');
    console.log('   q git-pro accounts     账号管理');
    console.log('   q git-pro rules        规则管理');
    console.log('   q git-pro settings     设置管理');
    
    await delay(2000);
    
    // 展示7: 安全和最佳实践
    title('7. 安全性和最佳实践');
    
    step('🔒 安全特性');
    console.log('   🔑 独立SSH密钥 - 每个账号使用专用密钥');
    console.log('   ⚠️  操作确认 - 重要操作需要用户确认');
    console.log('   📁 权限检查 - SSH密钥文件权限自动检查');
    console.log('   💾 配置备份 - 自动备份配置文件');
    
    step('💡 最佳实践建议');
    console.log('   1. 优先使用目录规则（最精确）');
    console.log('   2. 为每个账号生成独立SSH密钥');
    console.log('   3. 定期检查账号匹配状态');
    console.log('   4. 使用本地切换避免全局影响');
    console.log('   5. 设置合理的默认账号');
    
    await delay(2000);
    
    // 展示8: 下一步
    title('8. 开始使用');
    
    success('立即体验Git Account Pro:');
    console.log('');
    console.log(colorize('🚀 启动工具:', 'yellow'));
    console.log('   q git-pro');
    console.log('');
    console.log(colorize('📖 查看文档:', 'yellow'));
    console.log('   cat examples/git-tools/GIT_ACCOUNT_PRO_README.md');
    console.log('');
    console.log(colorize('⚙️  快速配置:', 'yellow'));
    console.log('   q git-pro init  # 初始化向导');
    console.log('');
    
    title('🎉 演示完成');
    info('Git Account Pro - 让Git账号管理变得智能、自动、完美！');
    console.log('');
    
  } catch (error) {
    console.error(colorize(`演示运行出错: ${error.message}`, 'red'));
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
} 
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log(colorize('\n🚀 NPM版本管理工具演示', 'bright'));
console.log(colorize('========================', 'cyan'));

console.log(colorize('\n📦 工具功能概览:', 'cyan'));
console.log('   ✅ 智能版本更新 (patch/minor/major)');
console.log('   ✅ 自动生成Changelog');
console.log('   ✅ 创建Git标签');
console.log('   ✅ 同步package.json和package-lock.json');
console.log('   ✅ 版本历史查看');
console.log('   ✅ 未发布提交跟踪');

console.log(colorize('\n🎯 使用场景示例:', 'cyan'));

console.log(colorize('\n1. 发布新功能版本:', 'yellow'));
console.log('   $ q npm-version');
console.log('   # 选择 [1] 更新包版本');
console.log('   # 选择 [2] minor - 次要版本 (新功能)');
console.log('   # 1.0.1 → 1.1.0');

console.log(colorize('\n2. 发布bug修复版本:', 'yellow'));
console.log('   $ q npm-version');
console.log('   # 选择 [1] 更新包版本');
console.log('   # 选择 [1] patch - 补丁版本 (修复bug)');
console.log('   # 1.0.1 → 1.0.2');

console.log(colorize('\n3. 查看项目状态:', 'yellow'));
console.log('   $ q npm-version');
console.log('   # 选择 [3] 查看未发布提交');

console.log(colorize('\n📋 版本类型说明:', 'cyan'));
console.log('   • patch: 1.0.0 → 1.0.1 (修复bug)');
console.log('   • minor: 1.0.0 → 1.1.0 (新功能)');
console.log('   • major: 1.0.0 → 2.0.0 (破坏性变更)');

console.log(colorize('\n📝 自动生成文件:', 'cyan'));
console.log('   • 更新 package.json 版本号');
console.log('   • 更新 package-lock.json 版本号');
console.log('   • 生成/更新 CHANGELOG.md');
console.log('   • 创建 Git 标签 (包含提交信息)');

// 显示当前项目信息（如果可用）
try {
  // 查找package.json
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;
  let packagePath = null;
  
  while (currentDir !== root) {
    const testPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(testPath)) {
      packagePath = testPath;
      break;
    }
    currentDir = path.dirname(currentDir);
  }
  
  if (packagePath) {
    const packageData = fs.readJsonSync(packagePath);
    const currentVersion = packageData.version || '0.0.0';
    const projectName = packageData.name || 'unknown';
    
    console.log(colorize('\n📋 当前项目信息:', 'cyan'));
    console.log(`   项目名称: ${colorize(projectName, 'bright')}`);
    console.log(`   当前版本: ${colorize(currentVersion, 'green')}`);
    console.log(`   项目目录: ${colorize(path.dirname(packagePath), 'blue')}`);
    
    // 计算各个版本类型的新版本号
    const parts = currentVersion.split('.').map(Number);
    const patchVersion = [...parts]; patchVersion[2]++;
    const minorVersion = [...parts]; minorVersion[1]++; minorVersion[2] = 0;
    const majorVersion = [...parts]; majorVersion[0]++; majorVersion[1] = 0; majorVersion[2] = 0;
    
    console.log(colorize('\n🎯 版本更新预览:', 'cyan'));
    console.log(`   Patch: ${currentVersion} → ${colorize(patchVersion.join('.'), 'green')}`);
    console.log(`   Minor: ${currentVersion} → ${colorize(minorVersion.join('.'), 'green')}`);
    console.log(`   Major: ${currentVersion} → ${colorize(majorVersion.join('.'), 'green')}`);
  }
} catch (error) {
  console.log(colorize('\n💡 在项目根目录运行可显示更多信息', 'yellow'));
}

console.log(colorize('\n🚀 开始使用:', 'cyan'));
console.log('   $ q npm-version');

console.log(colorize('\n📚 获取帮助:', 'cyan'));
console.log('   详细文档: examples/npm-tools/NPM_VERSION_README.md');
console.log('   工具列表: q -list');

console.log(''); 
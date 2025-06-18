#!/usr/bin/env node
// Description: 演示多源配置管理功能

const fs = require('fs-extra');
const path = require('path');

function colorize(text, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
    reset: '\x1b[0m'
  };
  
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function showDemo() {
  console.log(colorize('\n🚀 Quick-sh 多源配置管理功能演示', 'cyan'));
  console.log('=' .repeat(60));
  
  console.log(colorize('\n📡 1. 源管理', 'yellow'));
  console.log('添加GitHub源:');
  console.log('  q --add-source awesome-scripts github https://github.com/user/awesome-scripts');
  console.log('  q --add-source utils-repo github https://github.com/org/utils --branch develop');
  
  console.log('\n添加原始URL源:');
  console.log('  q --add-source cdn-scripts raw_url https://cdn.example.com/scripts');
  
  console.log('\n查看配置的源:');
  console.log('  q --sources');
  
  console.log(colorize('\n📥 2. 脚本下载', 'yellow'));
  console.log('从GitHub下载脚本:');
  console.log('  q --download awesome-scripts utils/backup.js');
  console.log('  q --download awesome-scripts tools/deploy.sh deploy');
  
  console.log('\n从URL下载脚本:');
  console.log('  q --download cdn-scripts helpers/format.js');
  
  console.log(colorize('\n📋 3. 脚本管理', 'yellow'));
  console.log('查看已下载的远程脚本:');
  console.log('  q --remote-list');
  
  console.log('\n删除远程脚本:');
  console.log('  q --remove-remote awesome-scripts backup.js');
  
  console.log('\n删除整个源:');
  console.log('  q --remove-source awesome-scripts');
  
  console.log(colorize('\n▶️  4. 脚本执行', 'yellow'));
  console.log('执行下载的脚本（就像本地脚本一样）:');
  console.log('  q backup /src /dest');
  console.log('  q deploy production');
  console.log('  q format input.txt');
  
  console.log(colorize('\n🔍 5. 脚本发现', 'yellow'));
  console.log('查看所有脚本（包括远程脚本）:');
  console.log('  q -l');
  console.log('  q --list');
  
  console.log(colorize('\n🎯 执行优先级', 'blue'));
  console.log('1. 别名配置 (config.json)');
  console.log('2. 本地脚本目录');
  console.log('3. 远程下载脚本');
  console.log('4. 系统命令');
  
  console.log(colorize('\n📂 存储位置', 'blue'));
  console.log('配置: ~/.quick-sh/config.json');
  console.log('远程脚本: ~/.quick-sh/remote-scripts/<源名>/');
  
  console.log(colorize('\n✨ 功能特性', 'green'));
  console.log('✅ 支持多个脚本源');
  console.log('✅ GitHub仓库支持');
  console.log('✅ 原始URL支持');
  console.log('✅ 自动文件权限设置');
  console.log('✅ 与现有脚本系统无缝集成');
  console.log('✅ 独立的远程脚本存储');
  
  console.log(colorize('\n🔧 使用技巧', 'cyan'));
  console.log('• 远程脚本会自动设置执行权限');
  console.log('• 可以通过本地名称重命名下载的脚本');
  console.log('• 远程脚本与本地脚本使用相同的调用方式');
  console.log('• 支持GitHub的不同分支（默认main分支）');
  
  console.log(colorize('\n📖 更多帮助', 'blue'));
  console.log('查看完整帮助: q --help');
  console.log('查看源列表: q --sources');
  console.log('查看远程脚本: q --remote-list');
}

// 如果直接运行此脚本
if (require.main === module) {
  showDemo();
}

module.exports = { showDemo }; 
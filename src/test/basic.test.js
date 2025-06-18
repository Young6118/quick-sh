#!/usr/bin/env node

const { 
  TEST_CONFIG, 
  execCommand, 
  runTestSuite, 
  checkLink, 
  warning 
} = require('./test-utils');

// 基础功能测试
const basicTests = [
  {
    name: '检查q命令是否可用',
    async run() {
      const result = await execCommand('q', ['--version']);
      if (result.code === 0 && result.stdout.trim().match(/^\d+\.\d+\.\d+$/)) {
        return { success: true, message: 'q命令版本检查通过' };
      }
      return { success: false, message: `版本检查失败: ${result.stderr}` };
    }
  },

  {
    name: '设置脚本路径',
    async run() {
      const result = await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      if (result.code === 0 && 
          (result.stdout.includes('Script path set to:') || 
           result.stdout.includes('Script path set to') ||
           result.code === 0)) { // 路径设置可能没有输出
        return { success: true, message: '脚本路径设置成功' };
      }
      return { success: false, message: `路径设置失败: ${result.stderr || result.stdout}` };
    }
  },

  {
    name: '查看状态列表',
    async run() {
      const result = await execCommand('q', ['-list']);
      if (result.code === 0 && 
          (result.stdout.includes('Available scripts') || 
           result.stdout.includes('Current script path:') ||
           result.stdout.includes('📁 Current script path:'))) {
        return { success: true, message: '状态查看成功，发现可用脚本' };
      }
      return { success: false, message: `状态查看失败: Expected status display but got: ${result.stdout.slice(0, 200)}...` };
    }
  },

  {
    name: '使用-l别名查看状态',
    async run() {
      const result = await execCommand('q', ['-l']);
      if (result.code === 0 && 
          (result.stdout.includes('Current script path:') || 
           result.stdout.includes('📁 Current script path:'))) {
        return { success: true, message: '-l别名工作正常' };
      }
      return { success: false, message: `-l别名失败: Expected status display but got: ${result.stdout.slice(0, 200)}...` };
    }
  },

  {
    name: '测试help命令',
    async run() {
      const result = await execCommand('q', ['-help']);
      if (result.code === 0 && 
          result.stdout.includes('quick sh (q) - Script Management Tool') &&
          result.stdout.includes('USAGE:') &&
          result.stdout.includes('EXAMPLES:')) {
        return { success: true, message: 'help命令显示正确' };
      }
      return { success: false, message: `help命令显示失败: Expected English output but got: ${result.stdout.slice(0, 200)}...` };
    }
  },

  {
    name: '测试help命令别名',
    async run() {
      const result = await execCommand('q', ['-h']);
      if (result.code === 0 && 
          result.stdout.includes('quick sh (q) - Script Management Tool')) {
        return { success: true, message: 'help命令别名(-h)工作正常' };
      }
      return { success: false, message: `help命令别名失败: Expected English output but got: ${result.stdout.slice(0, 200)}...` };
    }
  },

  {
    name: '测试无参数时显示简洁介绍',
    async run() {
      const result = await execCommand('q', []);
      if (result.code === 0 && 
          result.stdout.includes('quick sh (q) - Script Management Tool') &&
          result.stdout.includes('USAGE:')) {
        return { success: true, message: '无参数时正确显示简洁介绍' };
      }
      return { success: false, message: `无参数时简洁介绍显示失败: Expected English output but got: ${result.stdout.slice(0, 200)}...` };
    }
  }
];

// 主函数
async function main() {
  try {
    // 检查q命令是否可用
    const isLinked = await checkLink();
    if (!isLinked) {
      warning('q命令不可用，请先运行 "npm link" 来创建全局链接');
      process.exit(1);
    }

    const result = await runTestSuite('基础功能', basicTests);
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`测试运行失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { basicTests }; 
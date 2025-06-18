#!/usr/bin/env node

const { 
  TEST_CONFIG, 
  execCommand, 
  runTestSuite, 
  checkLink, 
  warning 
} = require('./test-utils');

// 脚本执行测试
const scriptExecutionTests = [
  {
    name: '测试JavaScript脚本执行（无参数）',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-args']);
      if (result.code === 0 && result.stdout.includes('No arguments provided')) {
        return { success: true, message: 'JavaScript脚本执行成功（无参数）' };
      }
      return { success: false, message: `JavaScript脚本执行失败: ${result.stderr}` };
    }
  },

  {
    name: '测试JavaScript脚本执行（带参数）',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-args', 'hello', 'world', 'test param']);
      if (result.code === 0 && 
          result.stdout.includes('Number of arguments: 3') &&
          result.stdout.includes('hello') &&
          result.stdout.includes('world') &&
          result.stdout.includes('test param')) {
        return { success: true, message: 'JavaScript脚本参数传递成功' };
      }
      return { success: false, message: `JavaScript参数传递失败: ${result.stdout}` };
    }
  },

  {
    name: '测试JavaScript脚本执行（特殊字符参数）',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-args', '--flag', 'value=123', 'path/to/file']);
      if (result.code === 0 && 
          result.stdout.includes('Number of arguments: 3') &&
          result.stdout.includes('--flag') &&
          result.stdout.includes('value=123') &&
          result.stdout.includes('path/to/file')) {
        return { success: true, message: 'JavaScript脚本特殊字符参数传递成功' };
      }
      return { success: false, message: `JavaScript特殊字符参数传递失败: ${result.stdout}` };
    }
  },

  {
    name: '测试Shell脚本执行（无参数）',
    async run() {
      const result = await execCommand('q', ['test-args-sh']);
      if (result.code === 0 && result.stdout.includes('No arguments provided')) {
        return { success: true, message: 'Shell脚本执行成功（无参数）' };
      }
      return { success: false, message: `Shell脚本执行失败: ${result.stderr}` };
    }
  },

  {
    name: '测试Shell脚本执行（带参数）',
    async run() {
      const result = await execCommand('q', ['test-args-sh', 'param1', 'param2']);
      if (result.code === 0 && 
          result.stdout.includes('Number of arguments: 2') &&
          result.stdout.includes('param1') &&
          result.stdout.includes('param2')) {
        return { success: true, message: 'Shell脚本参数传递成功' };
      }
      return { success: false, message: `Shell脚本参数传递失败: ${result.stdout}` };
    }
  },

  {
    name: '测试Shell脚本执行（带空格的参数）',
    async run() {
      const result = await execCommand('q', ['test-args-sh', 'param with spaces', 'another param']);
      if (result.code === 0 && 
          result.stdout.includes('Number of arguments: 2') &&
          result.stdout.includes('param with spaces') &&
          result.stdout.includes('another param')) {
        return { success: true, message: 'Shell脚本空格参数传递成功' };
      }
      return { success: false, message: `Shell脚本空格参数传递失败: ${result.stdout}` };
    }
  },

  {
    name: '测试目录脚本执行（无参数）',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-dir']);
      if (result.code === 0 && result.stdout.includes('arguments: 0')) {
        return { success: true, message: '目录脚本执行成功（无参数）' };
      }
      return { success: false, message: `目录脚本执行失败: ${result.stderr}` };
    }
  },

  {
    name: '测试目录脚本执行（带参数）',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-dir', 'dir-arg1', 'dir-arg2']);
      if (result.code === 0 && 
          result.stdout.includes('Number of arguments: 2') &&
          result.stdout.includes('dir-arg1') &&
          result.stdout.includes('dir-arg2')) {
        return { success: true, message: '目录脚本参数传递成功' };
      }
      return { success: false, message: `目录脚本参数传递失败: ${result.stdout}` };
    }
  },

  {
    name: '测试脚本文件扩展名自动识别(.js)',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-args.js', 'ext-test']);
      if (result.code === 0 && result.stdout.includes('ext-test')) {
        return { success: true, message: '.js扩展名自动识别成功' };
      }
      return { success: false, message: `.js扩展名识别失败: ${result.stderr}` };
    }
  },

  {
    name: '测试脚本文件扩展名自动识别(.sh)',
    async run() {
      const result = await execCommand('q', ['test-scripts/test-args.sh', 'shell-ext-test']);
      if (result.code === 0 && result.stdout.includes('shell-ext-test')) {
        return { success: true, message: '.sh扩展名自动识别成功' };
      }
      return { success: false, message: `.sh扩展名识别失败: ${result.stderr}` };
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

    // 先设置脚本路径
    await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
    
    const result = await runTestSuite('脚本执行', scriptExecutionTests);
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

module.exports = { scriptExecutionTests }; 
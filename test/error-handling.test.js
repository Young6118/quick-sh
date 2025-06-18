#!/usr/bin/env node

const { 
  TEST_CONFIG, 
  execCommand, 
  runTestSuite, 
  checkLink, 
  warning 
} = require('./test-utils');

// 错误处理测试
const errorHandlingTests = [
  {
    name: '测试不存在的脚本',
    async run() {
      const result = await execCommand('q', ['non-existent-script-12345']);
      if (result.code !== 0 && result.stderr.includes('Command not found')) {
        return { success: true, message: '不存在脚本的错误处理正确' };
      }
      return { success: false, message: '不存在脚本的错误处理失败' };
    }
  },

  {
    name: '测试不存在的alias',
    async run() {
      const result = await execCommand('q', ['non-existent-alias-xyz']);
      if (result.code !== 0 && result.stderr.includes('Command not found')) {
        return { success: true, message: '不存在alias的错误处理正确' };
      }
      return { success: false, message: '不存在alias的错误处理失败' };
    }
  },

  {
    name: '测试错误的脚本路径设置',
    async run() {
      const result = await execCommand('q', ['-path', '/non/existent/path/12345']);
      if (result.code !== 0) {
        return { success: true, message: '错误脚本路径的错误处理正确' };
      }
      return { success: false, message: '错误脚本路径的错误处理失败' };
    }
  },

  {
    name: '测试第三级优先级：系统命令',
    async run() {
      const result = await execCommand('q', ['ls']);
      if (result.code === 0 && 
          result.stdout.includes('Executing system command: ls')) {
        return { success: true, message: '系统命令回退机制工作正常' };
      }
      return { success: false, message: `系统命令回退失败: ${result.stdout}` };
    }
  },

  {
    name: '测试系统命令不存在',
    async run() {
      const result = await execCommand('q', ['totally-non-existent-command-xyz123']);
      if (result.code !== 0 && result.stderr.includes('Command not found')) {
        return { success: true, message: '不存在系统命令的错误处理正确' };
      }
      return { success: false, message: '不存在系统命令的错误处理失败' };
    }
  },

  {
    name: '测试空脚本名',
    async run() {
      const result = await execCommand('q', ['']);
      if (result.code === 0) {
        // 空脚本名应该显示状态，而不是错误
        return { success: true, message: '空脚本名处理正确（显示状态）' };
      }
      return { success: false, message: '空脚本名处理失败' };
    }
  },

  {
    name: '测试包含特殊字符的脚本名',
    async run() {
      const result = await execCommand('q', ['script@#$%']);
      if (result.code !== 0 && result.stderr.includes('Command not found')) {
        return { success: true, message: '特殊字符脚本名的错误处理正确' };
      }
      return { success: false, message: '特殊字符脚本名的错误处理失败' };
    }
  },

  {
    name: '测试很长的脚本名',
    async run() {
      const longName = 'a'.repeat(256);
      const result = await execCommand('q', [longName]);
      if (result.code !== 0 && result.stderr.includes('Command not found')) {
        return { success: true, message: '长脚本名的错误处理正确' };
      }
      return { success: false, message: '长脚本名的错误处理失败' };
    }
  },

  {
    name: '测试路径遍历攻击防护',
    async run() {
      const result = await execCommand('q', ['../../../etc/passwd']);
      if (result.code !== 0 && result.stderr.includes('Command not found')) {
        return { success: true, message: '路径遍历攻击防护正常' };
      }
      return { success: false, message: '路径遍历攻击防护失败' };
    }
  },

  {
    name: '测试alias配置中的错误路径',
    async run() {
      // 这个测试需要临时修改配置，暂时跳过
      // 可以在future实现临时配置测试
      return { success: true, message: 'alias错误路径测试暂时跳过' };
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
    
    const result = await runTestSuite('错误处理', errorHandlingTests);
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

module.exports = { errorHandlingTests }; 
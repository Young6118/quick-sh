#!/usr/bin/env node

const { 
  TEST_CONFIG, 
  execCommand, 
  runTestSuite, 
  checkLink, 
  warning 
} = require('./test-utils');

// 别名配置测试
const aliasTests = [
  {
    name: '测试相对路径alias配置',
    async run() {
      const result = await execCommand('q', ['chat', 'test-param']);
      if (result.code === 0 && 
          result.stdout.includes('Executing alias (relative path)') &&
          result.stdout.includes('🚀 Deploy Script')) {
        return { success: true, message: '相对路径alias配置执行成功' };
      }
      return { success: false, message: `相对路径alias配置失败: ${result.stdout}` };
    }
  },

  {
    name: '测试内置AI功能',
    async run() {
      const result = await execCommand('q', ['-ai', '-show']);
      if (result.code === 0 && 
          (result.stdout.includes('Current AI Configuration') || 
           result.stdout.includes('当前 AI 配置') ||
           result.stdout.includes('No models configured') ||
           result.stdout.includes('未配置任何模型'))) {
        return { success: true, message: '内置AI功能工作正常' };
      }
      return { success: false, message: `内置AI功能失败: ${result.stdout}` };
    }
  },

  {
    name: '测试系统命令alias配置（which）',
    async run() {
      const result = await execCommand('q', ['w', 'node']);
      if (result.code === 0 && 
          result.stdout.includes('Executing system command: which') &&
          result.stdout.includes('/node')) {
        return { success: true, message: '系统命令alias配置执行成功' };
      }
      return { success: false, message: `系统命令alias配置失败: ${result.stdout}` };
    }
  },

  {
    name: '测试绝对路径alias配置（python）',
    async run() {
      const result = await execCommand('q', ['py', '--version']);
      if (result.code === 0 && 
          result.stdout.includes('Executing alias (absolute path)') &&
          result.stdout.includes('Python')) {
        return { success: true, message: '绝对路径alias配置执行成功' };
      }
      return { success: false, message: `绝对路径alias配置失败: ${result.stdout}` };
    }
  },

  {
    name: '测试绝对路径alias配置（which）',
    async run() {
      const result = await execCommand('q', ['ww', 'npm']);
      if (result.code === 0 && 
          result.stdout.includes('Executing alias (absolute path)') &&
          result.stdout.includes('/npm')) {
        return { success: true, message: '绝对路径which别名配置执行成功' };
      }
      return { success: false, message: `绝对路径which别名配置失败: ${result.stdout}` };
    }
  },

  {
    name: '测试简单字符串alias配置（echo）',
    async run() {
      const result = await execCommand('q', ['echo', 'Hello World']);
      if (result.code === 0 && 
          result.stdout.includes('Executing system command: echo') &&
          result.stdout.includes('Hello World')) {
        return { success: true, message: '简单字符串alias配置执行成功' };
      }
      return { success: false, message: `简单字符串alias配置失败: ${result.stdout}` };
    }
  },

  {
    name: '测试复杂参数的alias执行（python）',
    async run() {
      const result = await execCommand('q', ['py', '-c', 'print("Hello from Python!")']);
      if (result.code === 0 && 
          result.stdout.includes('Hello from Python!')) {
        return { success: true, message: '复杂参数的alias执行成功' };
      }
      return { success: false, message: `复杂参数的alias执行失败: ${result.stdout}` };
    }
  },

  {
    name: '测试用户脚本与内置命令的区分',
    async run() {
      const result = await execCommand('q', ['help']);
      if (result.code === 0 && 
          result.stdout.includes('This is a user script named "help"') &&
          result.stdout.includes('It does NOT conflict with the built-in "-help" command')) {
        return { success: true, message: '用户脚本"help"与内置命令"-help"成功区分' };
      }
      return { success: false, message: `用户脚本与内置命令区分失败: ${result.stdout}` };
    }
  },

  {
    name: '测试优先级：alias优先于脚本文件',
    async run() {
      const result = await execCommand('q', ['hello', 'priority-test']);
      if (result.code === 0 && 
          (result.stdout.includes('Executing system command: echo') ||
           result.stdout.includes('Executing alias (relative path)')) &&
          result.stdout.includes('priority-test')) {
        return { success: true, message: 'alias配置正确优先于脚本文件' };
      }
      return { success: false, message: `优先级测试失败: ${result.stdout}` };
    }
  },

  {
    name: '测试git相关alias配置',
    async run() {
      const result = await execCommand('q', ['commit', '--help']);
      if (result.code === 0 && 
          (result.stdout.includes('Git Commit') || result.stdout.includes('📖 Git Commit'))) {
        return { success: true, message: 'git commit别名配置执行成功' };
      }
      return { success: false, message: `git commit别名配置失败: ${result.stdout}` };
    }
  },

  {
    name: '测试backup脚本alias配置',
    async run() {
      // backup脚本有交互式输入，我们只验证别名是否正确解析
      // 通过检查list输出中是否包含backup别名来验证
      const result = await execCommand('q', ['-list']);
      if (result.code === 0 && 
          (result.stdout.includes('backup') || result.stdout.includes('Backup'))) {
        return { success: true, message: 'backup别名配置执行成功（通过列表验证）' };
      }
      return { success: false, message: `backup别名配置失败: 在列表中未找到backup配置` };
    }
  },

  {
    name: '测试git-account工具alias配置',
    async run() {
      // git-account工具有交互式输入，我们验证别名是否正确解析
      // 通过检查list输出中是否包含git-account别名来验证
      const result = await execCommand('q', ['-list']);
      if (result.code === 0 && 
          (result.stdout.includes('git-account') || result.stdout.includes('Manage git accounts'))) {
        return { success: true, message: 'git-account别名配置执行成功（通过列表验证）' };
      }
      return { success: false, message: `git-account别名配置失败: 在列表中未找到git-account配置` };
    }
  },

  {
    name: '测试npm-version工具alias配置',
    async run() {
      // npm-version工具有交互式输入，我们验证别名是否正确解析
      // 通过检查list输出中是否包含npm-version别名来验证
      const result = await execCommand('q', ['-list']);
      if (result.code === 0 && 
          (result.stdout.includes('npm-version') || result.stdout.includes('NPM version management'))) {
        return { success: true, message: 'npm-version别名配置执行成功（通过列表验证）' };
      }
      return { success: false, message: `npm-version别名配置失败: 在列表中未找到npm-version配置` };
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
    
    const result = await runTestSuite('别名配置', aliasTests);
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

module.exports = { aliasTests }; 
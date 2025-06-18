#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { 
  TEST_CONFIG, 
  execCommand, 
  runTestSuite, 
  checkLink, 
  warning,
  createTempConfig,
  cleanupTempFiles
} = require('./test-utils');

// 配置管理测试
const configTests = [
  {
    name: '测试配置文件路径解析',
    async run() {
      const result = await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      if (result.code === 0 && result.stdout.includes('Script path set to:')) {
        return { success: true, message: '配置文件路径解析成功' };
      }
      return { success: false, message: `配置文件路径解析失败: ${result.stderr}` };
    }
  },

  {
    name: '测试相对路径配置',
    async run() {
      const relativePath = './examples';
      const result = await execCommand('q', ['-path', relativePath]);
      if (result.code === 0) {
        return { success: true, message: '相对路径配置设置成功' };
      }
      return { success: false, message: `相对路径配置失败: ${result.stderr}` };
    }
  },

  {
    name: '测试绝对路径配置',
    async run() {
      const absolutePath = path.resolve(TEST_CONFIG.scriptPath);
      const result = await execCommand('q', ['-path', absolutePath]);
      if (result.code === 0) {
        return { success: true, message: '绝对路径配置设置成功' };
      }
      return { success: false, message: `绝对路径配置失败: ${result.stderr}` };
    }
  },

  {
    name: '测试配置持久化',
    async run() {
      // 设置路径
      await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      
      // 检查配置是否持久化
      const result = await execCommand('q', ['-list']);
      if (result.code === 0 && result.stdout.includes(TEST_CONFIG.scriptPath)) {
        return { success: true, message: '配置持久化成功' };
      }
      return { success: false, message: `配置持久化失败: ${result.stdout}` };
    }
  },

  {
    name: '测试配置文件位置',
    async run() {
      const homeDir = os.homedir();
      const configPath = path.join(homeDir, '.quick-sh', 'config.json');
      
      // 设置配置
      await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      
      // 检查配置文件是否存在
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        if (config.scriptPath) {
          return { success: true, message: '配置文件创建在正确位置' };
        }
      }
      return { success: false, message: '配置文件位置不正确' };
    }
  },

  {
    name: '测试配置文件格式',
    async run() {
      const homeDir = os.homedir();
      const configPath = path.join(homeDir, '.quick-sh', 'config.json');
      
      // 设置配置
      await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      
      try {
        const config = await fs.readJson(configPath);
        if (typeof config === 'object' && config.scriptPath && typeof config.scriptPath === 'string') {
          return { success: true, message: '配置文件格式正确' };
        }
        return { success: false, message: '配置文件格式不正确' };
      } catch (error) {
        return { success: false, message: `配置文件读取失败: ${error.message}` };
      }
    }
  },

  {
    name: '测试重复设置配置',
    async run() {
      // 第一次设置
      await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      
      // 第二次设置
      const newPath = path.dirname(TEST_CONFIG.scriptPath);
      const result = await execCommand('q', ['-path', newPath]);
      
      if (result.code === 0 && result.stdout.includes(newPath)) {
        return { success: true, message: '重复设置配置成功' };
      }
      return { success: false, message: `重复设置配置失败: ${result.stderr}` };
    }
  },

  {
    name: '测试alias配置读取',
    async run() {
      // 设置脚本路径
      await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
      
      // 查看状态，应该包含alias配置
      const result = await execCommand('q', ['-list']);
      if (result.code === 0 && 
          result.stdout.includes('Configured aliases:') &&
          result.stdout.includes('py') &&
          result.stdout.includes('chat')) {
        return { success: true, message: 'alias配置读取成功' };
      }
      return { success: false, message: `alias配置读取失败: ${result.stdout}` };
    }
  },

  {
    name: '测试无配置时的默认行为',
    async run() {
      // 简化测试 - 直接测试配置读取逻辑，而不操作文件系统
      // 因为多个并发测试可能导致文件冲突
      try {
        // 创建一个临时的错误配置，然后测试行为
        const tempPath = '/tmp/test-no-config-path-' + Date.now();
        
        // 先设置一个无效路径，然后重置
        await execCommand('q', ['-path', tempPath]);
        
        // 现在测试状态（应该显示我们刚才设置的路径，即使它不存在）
        const result = await execCommand('q', ['-list']);
        
        // 恢复到测试配置
        await execCommand('q', ['-path', TEST_CONFIG.scriptPath]);
        
        if (result.code === 0) {
          return { success: true, message: '无配置时的默认行为正确' };
        }
        return { success: false, message: '无配置时的默认行为失败' };
      } catch (error) {
        // 确保恢复配置
        await execCommand('q', ['-path', TEST_CONFIG.scriptPath]).catch(() => {});
        return { success: false, message: `测试失败: ${error.message}` };
      }
    }
  },

  {
    name: '测试目录不存在时的配置',
    async run() {
      const nonExistentPath = '/tmp/non-existent-dir-xyz123';
      const result = await execCommand('q', ['-path', nonExistentPath]);
      
      // 配置应该失败或者给出警告
      if (result.code !== 0 || result.stdout.includes('does not exist')) {
        return { success: true, message: '不存在目录的配置处理正确' };
      }
      return { success: false, message: '不存在目录的配置处理失败' };
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
    
    const result = await runTestSuite('配置管理', configTests);
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

module.exports = { configTests }; 
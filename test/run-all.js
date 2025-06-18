#!/usr/bin/env node

const { 
  colors,
  log,
  success,
  error,
  warning,
  runTestSuite,
  checkLink
} = require('./test-utils');

const { basicTests } = require('./basic.test');
const { scriptExecutionTests } = require('./script-execution.test');
const { aliasTests } = require('./alias.test');
const { errorHandlingTests } = require('./error-handling.test');
const { configTests } = require('./config.test');

// 所有测试套件
const testSuites = [
  { name: '基础功能', tests: basicTests },
  { name: '脚本执行', tests: scriptExecutionTests },
  { name: '别名配置', tests: aliasTests },
  { name: '错误处理', tests: errorHandlingTests },
  { name: '配置管理', tests: configTests }
];

// 运行所有测试
async function runAllTests() {
  log(colors.bold + colors.blue, '🧪 quick sh 完整测试套件');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];
  
  for (const suite of testSuites) {
    try {
      const result = await runTestSuite(suite.name, suite.tests);
      totalPassed += result.passed;
      totalFailed += result.failed;
      results.push({
        name: suite.name,
        passed: result.passed,
        failed: result.failed,
        success: result.failed === 0
      });
      console.log(); // 空行分隔
    } catch (err) {
      error(`测试套件 "${suite.name}" 执行失败: ${err.message}`);
      totalFailed += suite.tests.length;
      results.push({
        name: suite.name,
        passed: 0,
        failed: suite.tests.length,
        success: false,
        error: err.message
      });
    }
  }
  
  // 总结报告
  console.log('='.repeat(60));
  log(colors.bold + colors.blue, '📊 总测试报告');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? colors.green : colors.red;
    log(color, `${status} ${result.name}: ${result.passed} 通过, ${result.failed} 失败`);
    if (result.error) {
      log(colors.red, `   错误: ${result.error}`);
    }
  });
  
  console.log('='.repeat(60));
  log(colors.bold, `🎯 总计: ${totalPassed} 通过, ${totalFailed} 失败`);
  
  if (totalFailed === 0) {
    success('🎉 所有测试通过！');
    return 0;
  } else {
    error(`💥 ${totalFailed} 个测试失败`);
    return 1;
  }
}

// 显示可用的测试选项
function showTestOptions() {
  console.log('🧪 quick sh 测试选项:');
  console.log('');
  console.log('运行所有测试:');
  console.log('  npm test');
  console.log('  node test/run-all.js');
  console.log('');
  console.log('运行特定测试:');
  console.log('  node test/basic.test.js         # 基础功能测试');
  console.log('  node test/script-execution.test.js  # 脚本执行测试');
  console.log('  node test/alias.test.js         # 别名配置测试');
  console.log('  node test/error-handling.test.js    # 错误处理测试');
  console.log('  node test/config.test.js        # 配置管理测试');
  console.log('');
  console.log('手动测试:');
  console.log('  q -path examples                # 设置测试脚本路径');
  console.log('  q -list                         # 查看可用脚本');
  console.log('  q test-args hello world         # 测试参数传递');
  console.log('  q py --version                  # 测试别名配置');
}

// 主函数
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      showTestOptions();
      return;
    }
    
    if (args.includes('--options')) {
      showTestOptions();
      return;
    }
    
    // 检查q命令是否可用
    const isLinked = await checkLink();
    if (!isLinked) {
      warning('q命令不可用，请先运行 "npm link" 来创建全局链接');
      console.log('');
      console.log('设置步骤:');
      console.log('1. npm link');
      console.log('2. npm test');
      process.exit(1);
    }
    
    const exitCode = await runAllTests();
    process.exit(exitCode);
  } catch (error) {
    error(`测试运行失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  testSuites
}; 
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// 测试配置
const TEST_CONFIG = {
  scriptPath: path.join(__dirname, '..', 'examples'),
  timeout: 10000 // 10秒超时
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function error(message) {
  log(colors.red, `❌ ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

// 执行命令并返回Promise
function execCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    // 强制使用英文环境进行测试
    const testEnv = {
      ...process.env,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      ...options.env
    };
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      env: testEnv,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Command timeout'));
    }, TEST_CONFIG.timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout,
        stderr
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// 运行测试套件
async function runTestSuite(suiteName, tests) {
  log(colors.bold + colors.blue, `🧪 ${suiteName} 测试开始`);
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    info(`[${i + 1}/${tests.length}] 运行测试: ${test.name}`);
    
    try {
      const result = await test.run();
      if (result.success) {
        success(result.message);
        passed++;
      } else {
        error(result.message);
        failed++;
      }
    } catch (err) {
      error(`测试执行异常: ${err.message}`);
      failed++;
    }
    
    console.log(); // 空行分隔
  }
  
  console.log('='.repeat(50));
  log(colors.bold, `📊 ${suiteName} 测试结果: ${passed} 通过, ${failed} 失败`);
  
  return { passed, failed };
}

// 检查是否已经npm link
async function checkLink() {
  try {
    await execCommand('which', ['q']);
    return true;
  } catch {
    return false;
  }
}

// 创建临时配置文件
async function createTempConfig(config) {
  const tempConfigPath = path.join(__dirname, 'temp-config.json');
  await fs.writeJson(tempConfigPath, config, { spaces: 2 });
  return tempConfigPath;
}

// 清理临时文件
async function cleanupTempFiles(files) {
  for (const file of files) {
    try {
      await fs.remove(file);
    } catch (err) {
      // 忽略清理错误
    }
  }
}

module.exports = {
  TEST_CONFIG,
  colors,
  log,
  success,
  error,
  info,
  warning,
  execCommand,
  runTestSuite,
  checkLink,
  createTempConfig,
  cleanupTempFiles
}; 
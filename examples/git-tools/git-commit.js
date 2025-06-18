#!/usr/bin/env node
// Description: Interactive git commit helper with Conventional Commits support

const readline = require('readline');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Conventional Commits 规范配置
const COMMIT_TYPES = {
  feat: {
    description: '新功能 (feature)',
    emoji: '✨'
  },
  fix: {
    description: '修复问题 (bug fix)',
    emoji: '🐛'
  },
  docs: {
    description: '文档更新 (documentation)',
    emoji: '📚'
  },
  style: {
    description: '代码格式调整 (formatting, missing semi colons, etc)',
    emoji: '💄'
  },
  refactor: {
    description: '代码重构 (refactoring production code)',
    emoji: '♻️'
  },
  perf: {
    description: '性能优化 (performance)',
    emoji: '⚡'
  },
  test: {
    description: '测试相关 (adding tests, refactoring tests)',
    emoji: '✅'
  },
  build: {
    description: '构建系统 (build system or external dependencies)',
    emoji: '🔧'
  },
  ci: {
    description: 'CI配置 (continuous integration)',
    emoji: '👷'
  },
  chore: {
    description: '其他杂项 (updating grunt tasks etc)',
    emoji: '🔨'
  },
  revert: {
    description: '回滚提交 (revert previous commit)',
    emoji: '⏪'
  }
};

const SCOPES_SUGGESTIONS = [
  'api', 'ui', 'database', 'config', 'auth', 'utils', 'components', 
  'services', 'middleware', 'router', 'models', 'views', 'tests',
  'docs', 'scripts', 'deps', 'security', 'performance'
];

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 检查是否在git仓库中
function isGitRepository() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 获取git状态
function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const staged = [];
    const unstaged = [];
    
    status.split('\n').forEach(line => {
      if (line.trim()) {
        const statusCode = line.substring(0, 2);
        const fileName = line.substring(3);
        
        if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
          staged.push(fileName);
        }
        if (statusCode[1] !== ' ' && statusCode[1] !== '?') {
          unstaged.push(fileName);
        }
      }
    });
    
    return { staged, unstaged };
  } catch (error) {
    return { staged: [], unstaged: [] };
  }
}

// 验证commit message格式
function validateCommitMessage(message) {
  const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?(!)?: .{1,50}/;
  
  const errors = [];
  const warnings = [];
  
  if (!conventionalCommitRegex.test(message)) {
    errors.push('Commit message不符合Conventional Commits规范');
  }
  
  const lines = message.split('\n');
  const subject = lines[0];
  
  if (subject.length > 72) {
    warnings.push('主题行超过72个字符，建议控制在50个字符以内');
  }
  
  if (subject.endsWith('.')) {
    warnings.push('主题行不应以句号结尾');
  }
  
  if (lines.length > 1 && lines[1].trim() !== '') {
    warnings.push('主题行和正文之间应该有空行');
  }
  
  return { errors, warnings, valid: errors.length === 0 };
}

// 显示commit类型选择
function showCommitTypes() {
  console.log(colorize('\n📝 选择Commit类型:', 'cyan'));
  console.log('================================');
  
  Object.entries(COMMIT_TYPES).forEach(([type, config], index) => {
    console.log(`${colorize(`${index + 1}.`, 'yellow')} ${config.emoji} ${colorize(type, 'green')} - ${config.description}`);
  });
  console.log('');
}

// 显示作用域建议
function showScopeSuggestions() {
  console.log(colorize('\n💡 作用域建议 (可选):', 'cyan'));
  console.log('=====================');
  
  const chunks = [];
  for (let i = 0; i < SCOPES_SUGGESTIONS.length; i += 4) {
    chunks.push(SCOPES_SUGGESTIONS.slice(i, i + 4));
  }
  
  chunks.forEach(chunk => {
    console.log(chunk.map(scope => colorize(scope, 'magenta')).join(', '));
  });
  console.log('');
}

// 交互式创建commit message
async function interactiveCommit() {
  console.log(colorize('🚀 Git Commit 助手', 'cyan'));
  console.log('==================');
  
  const gitStatus = getGitStatus();
  
  if (gitStatus.staged.length === 0) {
    console.log(colorize('⚠️  没有暂存的文件，请先使用 git add 添加要提交的文件', 'yellow'));
    return;
  }
  
  console.log(colorize('📁 暂存的文件:', 'green'));
  gitStatus.staged.forEach(file => {
    console.log(`  ${colorize('•', 'green')} ${file}`);
  });
  
  if (gitStatus.unstaged.length > 0) {
    console.log(colorize('\n📝 未暂存的更改:', 'yellow'));
    gitStatus.unstaged.forEach(file => {
      console.log(`  ${colorize('•', 'yellow')} ${file}`);
    });
  }
  
  // 选择类型
  showCommitTypes();
  const typeAnswer = await askQuestion('请选择commit类型 (1-11): ');
  const typeIndex = parseInt(typeAnswer) - 1;
  
  if (typeIndex < 0 || typeIndex >= Object.keys(COMMIT_TYPES).length) {
    console.log(colorize('❌ 无效的选择', 'red'));
    return;
  }
  
  const selectedType = Object.keys(COMMIT_TYPES)[typeIndex];
  const typeConfig = COMMIT_TYPES[selectedType];
  
  // 作用域
  showScopeSuggestions();
  const scope = await askQuestion('请输入作用域 (可选，直接回车跳过): ');
  
  // 描述
  const description = await askQuestion('请输入简短描述 (必填): ');
  
  if (!description.trim()) {
    console.log(colorize('❌ 描述不能为空', 'red'));
    return;
  }
  
  // 是否为破坏性变更
  const isBreaking = await askQuestion('是否为破坏性变更? (y/N): ');
  
  // 详细描述
  const body = await askQuestion('请输入详细描述 (可选): ');
  
  // 关联的issue
  const issues = await askQuestion('请输入关联的issue (可选，如: #123, #456): ');
  
  // 构建commit message
  let commitMessage = selectedType;
  if (scope.trim()) {
    commitMessage += `(${scope.trim()})`;
  }
  if (isBreaking.toLowerCase() === 'y') {
    commitMessage += '!';
  }
  commitMessage += `: ${description.trim()}`;
  
  if (body.trim()) {
    commitMessage += `\n\n${body.trim()}`;
  }
  
  if (isBreaking.toLowerCase() === 'y') {
    commitMessage += '\n\nBREAKING CHANGE: ' + (body.trim() || description.trim());
  }
  
  if (issues.trim()) {
    commitMessage += `\n\nCloses: ${issues.trim()}`;
  }
  
  // 验证commit message
  const validation = validateCommitMessage(commitMessage);
  
  console.log(colorize('\n📋 生成的Commit Message:', 'cyan'));
  console.log('=============================');
  console.log(commitMessage);
  console.log('');
  
  if (validation.warnings.length > 0) {
    console.log(colorize('⚠️  警告:', 'yellow'));
    validation.warnings.forEach(warning => {
      console.log(`  • ${warning}`);
    });
    console.log('');
  }
  
  if (!validation.valid) {
    console.log(colorize('❌ 错误:', 'red'));
    validation.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
    console.log('');
  }
  
  const confirm = await askQuestion('确认提交? (Y/n): ');
  
  if (confirm.toLowerCase() !== 'n') {
    try {
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log(colorize('✅ 提交成功!', 'green'));
    } catch (error) {
      console.log(colorize('❌ 提交失败', 'red'));
    }
  } else {
    console.log(colorize('❌ 提交已取消', 'yellow'));
  }
}

// 验证现有commit message
function validateExistingCommit(commitMessage) {
  console.log(colorize('🔍 验证Commit Message', 'cyan'));
  console.log('======================');
  console.log(`Message: ${commitMessage}`);
  console.log('');
  
  const validation = validateCommitMessage(commitMessage);
  
  if (validation.valid) {
    console.log(colorize('✅ Commit message符合规范!', 'green'));
  } else {
    console.log(colorize('❌ Commit message不符合规范:', 'red'));
    validation.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  }
  
  if (validation.warnings.length > 0) {
    console.log(colorize('\n⚠️  建议改进:', 'yellow'));
    validation.warnings.forEach(warning => {
      console.log(`  • ${warning}`);
    });
  }
  
  console.log('');
}

// 显示帮助信息
function showHelp() {
  console.log(colorize('\n📖 Git Commit 规范助手 - 帮助', 'cyan'));
  console.log('===============================');
  console.log('');
  console.log('用法:');
  console.log('  q commit                    # 交互式创建commit');
  console.log('  q commit --validate "msg"   # 验证commit message');
  console.log('  q commit --help             # 显示帮助信息');
  console.log('  q commit --types            # 显示所有commit类型');
  console.log('');
  console.log('Conventional Commits 规范:');
  console.log('  <type>[optional scope]: <description>');
  console.log('  [optional body]');
  console.log('  [optional footer(s)]');
  console.log('');
  console.log('示例:');
  console.log('  feat(auth): add OAuth2 login support');
  console.log('  fix(api): resolve user data validation issue');
  console.log('  docs: update installation guide');
  console.log('  feat!: remove deprecated API endpoints');
  console.log('');
  console.log('更多信息: https://www.conventionalcommits.org/');
  console.log('');
}

// 显示所有commit类型
function showAllTypes() {
  console.log(colorize('\n📝 所有Commit类型', 'cyan'));
  console.log('==================');
  
  Object.entries(COMMIT_TYPES).forEach(([type, config]) => {
    console.log(`${config.emoji} ${colorize(type.padEnd(10), 'green')} - ${config.description}`);
  });
  console.log('');
}

// 辅助函数：询问问题
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(colorize(question, 'cyan'), resolve);
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (!isGitRepository()) {
    console.log(colorize('❌ 当前目录不是Git仓库', 'red'));
    process.exit(1);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--types')) {
    showAllTypes();
    process.exit(0);
  }
  
  const validateIndex = args.indexOf('--validate');
  if (validateIndex !== -1 && args[validateIndex + 1]) {
    validateExistingCommit(args[validateIndex + 1]);
    process.exit(0);
  }
  
  // 默认启动交互式模式
  try {
    await interactiveCommit();
  } catch (error) {
    console.log(colorize('❌ 发生错误:', 'red'), error.message);
  } finally {
    rl.close();
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 操作已取消', 'yellow'));
  rl.close();
  process.exit(0);
});

// 启动程序
if (require.main === module) {
  main();
} 
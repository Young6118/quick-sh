#!/usr/bin/env node
// Description: Git hooks setup tool for enforcing commit message standards

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 检查是否在git仓库中
function isGitRepository() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 获取git hooks目录
function getGitHooksDir() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
    return path.join(gitDir, 'hooks');
  } catch (error) {
    return null;
  }
}

// commit-msg hook 脚本内容
const commitMsgHook = `#!/bin/sh
# Git commit message validation hook
# This hook validates commit messages against Conventional Commits specification

commit_msg_file="$1"
commit_msg=$(cat "$commit_msg_file")

# Skip validation for merge commits
if echo "$commit_msg" | grep -q "^Merge"; then
  exit 0
fi

# Skip validation for revert commits  
if echo "$commit_msg" | grep -q "^Revert"; then
  exit 0
fi

# Conventional Commits regex pattern
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?(!)?: .{1,50}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "\\033[31m❌ Commit message does not follow Conventional Commits specification!\\033[0m"
  echo ""
  echo "Format: <type>[optional scope]: <description>"
  echo ""
  echo "Examples:"
  echo "  feat(auth): add OAuth2 login support"
  echo "  fix(api): resolve user data validation issue"
  echo "  docs: update installation guide"
  echo ""
  echo "Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo ""
  echo "Your commit message:"
  echo "  $commit_msg"
  echo ""
  echo "Use 'q commit' for interactive commit message creation."
  exit 1
fi

# Check if subject line is too long
subject_line=$(echo "$commit_msg" | head -n 1)
if [ \${#subject_line} -gt 72 ]; then
  echo "\\033[33m⚠️  Warning: Subject line is longer than 72 characters\\033[0m"
fi

echo "\\033[32m✅ Commit message follows Conventional Commits specification\\033[0m"
exit 0
`;

// prepare-commit-msg hook 脚本内容
const prepareCommitMsgHook = `#!/bin/sh
# Git prepare-commit-msg hook
# This hook provides a template for commit messages

commit_msg_file="$1"
commit_source="$2"

# Only add template for regular commits (not merge, squash, etc.)
if [ -z "$commit_source" ]; then
  cat > "$commit_msg_file" << 'EOF'
# <type>[optional scope]: <description>
#
# [optional body]
#
# [optional footer(s)]
#
# Types:
#   feat:     ✨ A new feature
#   fix:      🐛 A bug fix  
#   docs:     📚 Documentation only changes
#   style:    💄 Changes that do not affect the meaning of the code
#   refactor: ♻️  A code change that neither fixes a bug nor adds a feature
#   perf:     ⚡ A code change that improves performance
#   test:     ✅ Adding missing tests or correcting existing tests
#   build:    🔧 Changes that affect the build system or external dependencies
#   ci:       👷 Changes to CI configuration files and scripts
#   chore:    🔨 Other changes that don't modify src or test files
#   revert:   ⏪ Reverts a previous commit
#
# Examples:
#   feat(auth): add OAuth2 login support
#   fix(api): resolve user data validation issue
#   docs: update installation guide
#   feat!: remove deprecated API endpoints
#
# Use 'q commit' for interactive commit message creation.
EOF
fi
`;

// 设置commit-msg hook
function setupCommitMsgHook(hooksDir) {
  const hookPath = path.join(hooksDir, 'commit-msg');
  
  try {
    fs.writeFileSync(hookPath, commitMsgHook);
    fs.chmodSync(hookPath, '755');
    console.log(colorize('✅ commit-msg hook 安装成功', 'green'));
    return true;
  } catch (error) {
    console.log(colorize(`❌ 安装 commit-msg hook 失败: ${error.message}`, 'red'));
    return false;
  }
}

// 设置prepare-commit-msg hook
function setupPrepareCommitMsgHook(hooksDir) {
  const hookPath = path.join(hooksDir, 'prepare-commit-msg');
  
  try {
    fs.writeFileSync(hookPath, prepareCommitMsgHook);
    fs.chmodSync(hookPath, '755');
    console.log(colorize('✅ prepare-commit-msg hook 安装成功', 'green'));
    return true;
  } catch (error) {
    console.log(colorize(`❌ 安装 prepare-commit-msg hook 失败: ${error.message}`, 'red'));
    return false;
  }
}

// 移除hooks
function removeHooks(hooksDir) {
  const hooks = ['commit-msg', 'prepare-commit-msg'];
  let removedCount = 0;
  
  hooks.forEach(hook => {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      try {
        fs.unlinkSync(hookPath);
        console.log(colorize(`✅ 已移除 ${hook} hook`, 'green'));
        removedCount++;
      } catch (error) {
        console.log(colorize(`❌ 移除 ${hook} hook 失败: ${error.message}`, 'red'));
      }
    }
  });
  
  if (removedCount === 0) {
    console.log(colorize('ℹ️  没有找到要移除的hooks', 'blue'));
  }
}

// 检查现有hooks
function checkExistingHooks(hooksDir) {
  const hooks = ['commit-msg', 'prepare-commit-msg'];
  const existing = [];
  
  hooks.forEach(hook => {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      existing.push(hook);
    }
  });
  
  return existing;
}

// 显示帮助信息
function showHelp() {
  console.log(colorize('\n🔧 Git Hooks 设置助手', 'cyan'));
  console.log('====================');
  console.log('');
  console.log('用法:');
  console.log('  q setup-hooks              # 安装所有git hooks');
  console.log('  q setup-hooks --remove     # 移除所有git hooks');
  console.log('  q setup-hooks --check      # 检查现有hooks状态');
  console.log('  q setup-hooks --help       # 显示帮助信息');
  console.log('');
  console.log('安装的Hooks:');
  console.log('  commit-msg           - 验证commit message格式');
  console.log('  prepare-commit-msg   - 提供commit message模板');
  console.log('');
  console.log('这些hooks将帮助团队保持一致的commit message规范。');
  console.log('');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (!isGitRepository()) {
    console.log(colorize('❌ 当前目录不是Git仓库', 'red'));
    process.exit(1);
  }
  
  const hooksDir = getGitHooksDir();
  if (!hooksDir) {
    console.log(colorize('❌ 无法找到Git hooks目录', 'red'));
    process.exit(1);
  }
  
  // 确保hooks目录存在
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  if (args.includes('--check')) {
    const existing = checkExistingHooks(hooksDir);
    console.log(colorize('📋 Git Hooks 状态检查', 'cyan'));
    console.log('====================');
    
    if (existing.length > 0) {
      console.log(colorize('已安装的hooks:', 'green'));
      existing.forEach(hook => {
        console.log(`  ✅ ${hook}`);
      });
    } else {
      console.log(colorize('没有安装任何相关的git hooks', 'yellow'));
    }
    console.log('');
    return;
  }
  
  if (args.includes('--remove')) {
    console.log(colorize('🗑️  移除Git Hooks', 'yellow'));
    console.log('=================');
    removeHooks(hooksDir);
    console.log('');
    return;
  }
  
  // 默认：安装hooks
  console.log(colorize('🔧 安装Git Hooks', 'cyan'));
  console.log('================');
  
  const existing = checkExistingHooks(hooksDir);
  if (existing.length > 0) {
    console.log(colorize('检测到现有hooks:', 'yellow'));
    existing.forEach(hook => {
      console.log(`  • ${hook}`);
    });
    console.log('');
    console.log(colorize('这些hooks将被覆盖。', 'yellow'));
    console.log('');
  }
  
  let successCount = 0;
  
  if (setupCommitMsgHook(hooksDir)) {
    successCount++;
  }
  
  if (setupPrepareCommitMsgHook(hooksDir)) {
    successCount++;
  }
  
  console.log('');
  if (successCount === 2) {
    console.log(colorize('🎉 所有Git hooks安装成功！', 'green'));
    console.log('');
    console.log('现在你的提交将自动验证commit message格式。');
    console.log('使用 "q commit" 来交互式创建规范的commit message。');
  } else {
    console.log(colorize('⚠️  部分hooks安装失败', 'yellow'));
  }
  console.log('');
}

// 启动程序
if (require.main === module) {
  main();
} 
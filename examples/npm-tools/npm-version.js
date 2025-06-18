#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
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

// 版本类型配置
const VERSION_TYPES = {
  patch: {
    name: 'patch',
    description: '补丁版本 (修复bug)',
    example: '1.0.0 → 1.0.1'
  },
  minor: {
    name: 'minor', 
    description: '次要版本 (新功能)',
    example: '1.0.0 → 1.1.0'
  },
  major: {
    name: 'major',
    description: '主要版本 (破坏性变更)',
    example: '1.0.0 → 2.0.0'
  }
};

// 创建readline接口
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// 提示用户输入
function prompt(question) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// 检查是否在git仓库中
function checkGitRepository() {
  const packagePath = findPackageJson();
  if (!packagePath) return false;
  
  const projectRoot = path.dirname(packagePath);
  const originalCwd = process.cwd();
  
  try {
    process.chdir(projectRoot);
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  } finally {
    process.chdir(originalCwd);
  }
}

// 检查是否有未提交的更改
function checkUncommittedChanges() {
  const packagePath = findPackageJson();
  if (!packagePath) return false;
  
  const projectRoot = path.dirname(packagePath);
  const originalCwd = process.cwd();
  
  try {
    process.chdir(projectRoot);
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch (error) {
    return false;
  } finally {
    process.chdir(originalCwd);
  }
}

// 查找package.json文件
function findPackageJson() {
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    const packagePath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      return packagePath;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

// 获取当前版本
function getCurrentVersion() {
  try {
    const packagePath = findPackageJson();
    if (!packagePath) {
      throw new Error('package.json not found');
    }
    const packageData = fs.readJsonSync(packagePath);
    return packageData.version || '0.0.0';
  } catch (error) {
    throw new Error(`无法读取当前版本: ${error.message}`);
  }
}

// 计算新版本
function calculateNewVersion(currentVersion, versionType) {
  const parts = currentVersion.split('.').map(Number);
  
  switch (versionType) {
    case 'patch':
      parts[2]++;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    default:
      throw new Error('Invalid version type');
  }
  
  return parts.join('.');
}

// 获取上一个版本的tag
function getLastTag() {
  const packagePath = findPackageJson();
  if (!packagePath) return null;
  
  const projectRoot = path.dirname(packagePath);
  const originalCwd = process.cwd();
  
  try {
    process.chdir(projectRoot);
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    return lastTag;
  } catch (error) {
    // 如果没有找到tag，返回第一个commit
    try {
      const firstCommit = execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf8' }).trim();
      return firstCommit;
    } catch (err) {
      return null;
    }
  } finally {
    process.chdir(originalCwd);
  }
}

// 获取版本间的提交信息
function getCommitsBetweenVersions(fromRef, toRef = 'HEAD') {
  const packagePath = findPackageJson();
  if (!packagePath) return [];
  
  const projectRoot = path.dirname(packagePath);
  const originalCwd = process.cwd();
  
  try {
    process.chdir(projectRoot);
    const commits = execSync(
      `git log ${fromRef}..${toRef} --pretty=format:"%h|%s|%an|%ad" --date=short`,
      { encoding: 'utf8' }
    ).trim();
    
    if (!commits) return [];
    
    return commits.split('\n').map(line => {
      const [hash, subject, author, date] = line.split('|');
      return { hash, subject, author, date };
    });
  } catch (error) {
    console.warn(colorize(`获取提交信息失败: ${error.message}`, 'yellow'));
    return [];
  } finally {
    process.chdir(originalCwd);
  }
}

// 生成changelog条目
function generateChangelogEntry(version, commits, author, date) {
  let entry = `## [${version}] - ${date}\n\n`;
  entry += `### 更新内容\n\n`;
  
  if (commits.length === 0) {
    entry += `- 版本发布\n\n`;
  } else {
    commits.forEach(commit => {
      entry += `- ${commit.subject} (${commit.hash})\n`;
    });
    entry += '\n';
  }
  
  entry += `### 详细信息\n`;
  entry += `- **更新人**: ${author}\n`;
  entry += `- **更新时间**: ${date}\n`;
  entry += `- **提交数量**: ${commits.length}\n`;
  
  if (commits.length > 0) {
    entry += `- **提交范围**: ${commits[commits.length - 1].hash}..${commits[0].hash}\n`;
  }
  
  entry += '\n---\n\n';
  
  return entry;
}

// 更新changelog文件
async function updateChangelog(version, commits) {
  const packagePath = findPackageJson();
  if (!packagePath) {
    throw new Error('package.json not found');
  }
  
  const changelogPath = path.join(path.dirname(packagePath), 'CHANGELOG.md');
  const author = execSync('git config user.name', { encoding: 'utf8' }).trim();
  const date = new Date().toISOString().split('T')[0];
  
  const newEntry = generateChangelogEntry(version, commits, author, date);
  
  let existingContent = '';
  if (await fs.pathExists(changelogPath)) {
    existingContent = await fs.readFile(changelogPath, 'utf8');
  } else {
    // 创建新的changelog文件
    existingContent = `# Changelog\n\n所有重要的更改都会记录在此文件中。\n\n`;
  }
  
  // 在现有内容前插入新条目
  const lines = existingContent.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## [')) || 
                     lines.findIndex(line => line.trim() === '') + 1 ||
                     lines.length;
  
  lines.splice(insertIndex, 0, newEntry);
  
  await fs.writeFile(changelogPath, lines.join('\n'));
  console.log(colorize(`✅ 已更新 ${changelogPath}`, 'green'));
}

// 更新package.json版本
async function updatePackageVersion(newVersion) {
  const packagePath = findPackageJson();
  if (!packagePath) {
    throw new Error('package.json not found');
  }
  const packageData = await fs.readJson(packagePath);
  packageData.version = newVersion;
  await fs.writeJson(packagePath, packageData, { spaces: 2 });
  console.log(colorize(`✅ 已更新 package.json 版本为 ${newVersion}`, 'green'));
}

// 更新package-lock.json版本
async function updatePackageLockVersion(newVersion) {
  const packagePath = findPackageJson();
  if (!packagePath) return;
  
  const lockPath = path.join(path.dirname(packagePath), 'package-lock.json');
  if (await fs.pathExists(lockPath)) {
    const lockData = await fs.readJson(lockPath);
    lockData.version = newVersion;
    if (lockData.packages && lockData.packages[""]) {
      lockData.packages[""].version = newVersion;
    }
    await fs.writeJson(lockPath, lockData, { spaces: 2 });
    console.log(colorize(`✅ 已更新 package-lock.json 版本为 ${newVersion}`, 'green'));
  }
}

// 创建git tag
function createGitTag(version, commits) {
  const tagName = `v${version}`;
  let tagMessage = `Release ${tagName}`;
  
  if (commits.length > 0) {
    tagMessage += '\n\n更新内容:\n';
    commits.forEach(commit => {
      tagMessage += `- ${commit.subject} (${commit.hash})\n`;
    });
  }
  
  try {
    execSync(`git tag -a "${tagName}" -m "${tagMessage}"`);
    console.log(colorize(`✅ 已创建 Git tag: ${tagName}`, 'green'));
    return tagName;
  } catch (error) {
    throw new Error(`创建Git tag失败: ${error.message}`);
  }
}

// 显示版本选择菜单
async function showVersionSelectionMenu(currentVersion) {
  console.log(colorize('\n📦 选择版本更新类型:', 'cyan'));
  console.log(colorize(`当前版本: ${currentVersion}`, 'dim'));
  console.log('');
  
  Object.entries(VERSION_TYPES).forEach(([key, config], index) => {
    const newVersion = calculateNewVersion(currentVersion, key);
    console.log(`   ${colorize(`[${index + 1}]`, 'yellow')} ${colorize(config.name, 'bright')} - ${config.description}`);
    console.log(`       ${colorize(config.example, 'dim')} (新版本: ${colorize(newVersion, 'green')})`);
  });
  
  const choice = await prompt('\n请选择版本类型 (1-3): ');
  const index = parseInt(choice) - 1;
  const versionTypes = Object.keys(VERSION_TYPES);
  
  if (isNaN(index) || index < 0 || index >= versionTypes.length) {
    throw new Error('无效的选择');
  }
  
  return versionTypes[index];
}

// 确认版本更新
async function confirmVersionUpdate(currentVersion, newVersion, versionType, commits) {
  console.log(colorize('\n📋 版本更新确认:', 'cyan'));
  console.log(`   当前版本: ${colorize(currentVersion, 'yellow')}`);
  console.log(`   新版本:   ${colorize(newVersion, 'green')}`);
  console.log(`   更新类型: ${colorize(versionType, 'bright')}`);
  console.log(`   变更数量: ${colorize(commits.length, 'blue')} 个提交`);
  
  if (commits.length > 0) {
    console.log(colorize('\n最近的提交:', 'dim'));
    commits.slice(0, 5).forEach(commit => {
      console.log(`   • ${commit.subject} (${commit.hash})`);
    });
    if (commits.length > 5) {
      console.log(colorize(`   ... 还有 ${commits.length - 5} 个提交`, 'dim'));
    }
  }
  
  const confirm = await prompt('\n确认进行版本更新? (y/N): ');
  return confirm.toLowerCase() === 'y';
}

// 执行版本更新
async function performVersionUpdate(versionType) {
  const currentVersion = getCurrentVersion();
  const newVersion = calculateNewVersion(currentVersion, versionType);
  const lastTag = getLastTag();
  const commits = getCommitsBetweenVersions(lastTag);
  
  // 确认更新
  const confirmed = await confirmVersionUpdate(currentVersion, newVersion, versionType, commits);
  if (!confirmed) {
    console.log(colorize('已取消版本更新', 'yellow'));
    return;
  }
  
  console.log(colorize('\n🚀 开始版本更新...', 'cyan'));
  
  try {
    // 获取项目根目录路径
    const packagePath = findPackageJson();
    if (!packagePath) {
      throw new Error('找不到package.json文件');
    }
    const projectRoot = path.dirname(packagePath);
    const originalCwd = process.cwd();
    
    // 切换到项目根目录
    process.chdir(projectRoot);
    console.log(colorize(`✅ 切换到项目目录: ${projectRoot}`, 'green'));
    
    try {
      // 1. 更新package.json
      await updatePackageVersion(newVersion);
      
      // 2. 更新package-lock.json
      await updatePackageLockVersion(newVersion);
      
      // 3. 更新changelog
      await updateChangelog(newVersion, commits);
      
      // 4. 提交更改
      execSync('git add package.json package-lock.json CHANGELOG.md');
      execSync(`git commit -m "chore: bump version to ${newVersion}"`);
      console.log(colorize('✅ 已提交版本更改', 'green'));
      
      // 5. 创建git tag
      const tagName = createGitTag(newVersion, commits);
      
      console.log(colorize('\n🎉 版本更新完成!', 'green'));
      console.log(`   新版本: ${colorize(newVersion, 'bright')}`);
      console.log(`   Git tag: ${colorize(tagName, 'bright')}`);
      console.log(`   变更文件: package.json, package-lock.json, CHANGELOG.md`);
      
      // 询问是否推送到远程
      const pushToRemote = await prompt('\n是否推送到远程仓库? (y/N): ');
      if (pushToRemote.toLowerCase() === 'y') {
        try {
          execSync('git push');
          execSync(`git push origin ${tagName}`);
          console.log(colorize('✅ 已推送到远程仓库', 'green'));
        } catch (error) {
          console.warn(colorize(`推送失败: ${error.message}`, 'yellow'));
        }
      }
      
    } finally {
      // 恢复原始工作目录
      process.chdir(originalCwd);
    }
    
  } catch (error) {
    console.error(colorize(`版本更新失败: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// 显示当前项目信息
function showProjectInfo() {
  try {
    const packagePath = findPackageJson();
    if (!packagePath) {
      console.error(colorize('未找到package.json文件', 'red'));
      return;
    }
    
    const packageData = fs.readJsonSync(packagePath);
    const currentVersion = packageData.version || '0.0.0';
    const projectName = packageData.name || path.basename(path.dirname(packagePath));
    
    console.log(colorize('\n📋 项目信息:', 'cyan'));
    console.log(`   项目名称: ${colorize(projectName, 'bright')}`);
    console.log(`   当前版本: ${colorize(currentVersion, 'green')}`);
    console.log(`   项目目录: ${colorize(path.dirname(packagePath), 'dim')}`);
    
    // 显示最近的tag信息
    const lastTag = getLastTag();
    if (lastTag) {
      console.log(`   最新标签: ${colorize(lastTag, 'yellow')}`);
    }
    
    // 显示未发布的提交数量
    const commits = getCommitsBetweenVersions(lastTag);
    if (commits.length > 0) {
      console.log(`   未发布提交: ${colorize(commits.length, 'blue')} 个`);
    }
    
  } catch (error) {
    console.error(colorize(`获取项目信息失败: ${error.message}`, 'red'));
  }
}

// 显示主菜单
async function showMainMenu() {
  console.log(colorize('\n📦 NPM 版本管理工具', 'bright'));
  console.log(colorize('====================', 'dim'));
  
  // 显示项目信息
  showProjectInfo();
  
  console.log(colorize('\n📋 可用操作:', 'cyan'));
  console.log(`   ${colorize('[1]', 'yellow')} 更新包版本`);
  console.log(`   ${colorize('[2]', 'yellow')} 查看版本历史`);
  console.log(`   ${colorize('[3]', 'yellow')} 查看未发布提交`);
  console.log(`   ${colorize('[4]', 'yellow')} 刷新显示`);
  console.log(`   ${colorize('[0]', 'yellow')} 退出`);
  
  const choice = await prompt('\n请选择操作 (0-4): ');
  
  switch (choice) {
    case '1':
      const versionType = await showVersionSelectionMenu(getCurrentVersion());
      await performVersionUpdate(versionType);
      break;
    case '2':
      showVersionHistory();
      break;
    case '3':
      showUnreleasedCommits();
      break;
    case '4':
      return showMainMenu();
    case '0':
      console.log(colorize('\n👋 再见!', 'green'));
      return;
    default:
      console.log(colorize('无效的选择，请重新选择', 'red'));
  }
  
  // 询问是否继续
  const continueChoice = await prompt('\n按回车键继续，或输入 q 退出: ');
  if (continueChoice.toLowerCase() !== 'q') {
    return showMainMenu();
  }
}

// 显示版本历史
function showVersionHistory() {
  try {
    console.log(colorize('\n📅 版本历史:', 'cyan'));
    const tags = execSync('git tag -l --sort=-version:refname', { encoding: 'utf8' }).trim();
    
    if (!tags) {
      console.log(colorize('   暂无版本标签', 'dim'));
      return;
    }
    
    const tagList = tags.split('\n').slice(0, 10); // 显示最近10个版本
    tagList.forEach((tag, index) => {
      try {
        const tagInfo = execSync(`git log -1 --pretty=format:"%an|%ad" --date=short ${tag}`, { encoding: 'utf8' });
        const [author, date] = tagInfo.split('|');
        console.log(`   ${colorize(tag, 'green')} - ${date} by ${author}`);
      } catch (error) {
        console.log(`   ${colorize(tag, 'green')}`);
      }
    });
    
  } catch (error) {
    console.error(colorize(`获取版本历史失败: ${error.message}`, 'red'));
  }
}

// 显示未发布的提交
function showUnreleasedCommits() {
  try {
    console.log(colorize('\n🔄 未发布的提交:', 'cyan'));
    const lastTag = getLastTag();
    const commits = getCommitsBetweenVersions(lastTag);
    
    if (commits.length === 0) {
      console.log(colorize('   没有未发布的提交', 'dim'));
      return;
    }
    
    commits.forEach(commit => {
      console.log(`   ${colorize(commit.hash, 'yellow')} ${commit.subject}`);
      console.log(`       ${colorize(`by ${commit.author} on ${commit.date}`, 'dim')}`);
    });
    
    console.log(colorize(`\n   总计: ${commits.length} 个提交`, 'blue'));
    
  } catch (error) {
    console.error(colorize(`获取未发布提交失败: ${error.message}`, 'red'));
  }
}

// 主函数
async function main() {
  try {
    // 检查环境
    if (!checkGitRepository()) {
      console.error(colorize('❌ 当前目录不是Git仓库', 'red'));
      process.exit(1);
    }
    
    if (!findPackageJson()) {
      console.error(colorize('❌ 未找到package.json文件', 'red'));
      process.exit(1);
    }
    
    if (checkUncommittedChanges()) {
      console.warn(colorize('⚠️  工作区有未提交的更改，建议先提交', 'yellow'));
      const proceed = await prompt('是否继续? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        process.exit(0);
      }
    }
    
    await showMainMenu();
    
  } catch (error) {
    console.error(colorize(`程序运行出错: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
} 
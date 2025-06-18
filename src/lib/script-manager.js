const fs = require('fs-extra');
const path = require('path');
const { readConfig, readAliasConfig } = require('./config');
const { executeFile, executeFromDirectory, executeSystemCommand } = require('./executor');
const { checkSystemCommand } = require('./utils');
const { findRemoteScript, getRemoteScriptsDir, getSources } = require('./remote-manager');
const { t } = require('./i18n');

// 执行脚本（核心逻辑，包含alias处理和优先级）
async function executeScript(scriptName, args = []) {
  const config = await readConfig();
  
  if (!config.scriptPath) {
    console.error(t('commands.noPathConfigured'));
    process.exit(1);
  }
  
  // 优先级1: 检查alias配置
  const aliasConfig = await readAliasConfig(config.scriptPath);
  
  // 支持两种格式：直接在根级别定义aliases，或在aliases字段下定义
  const aliases = aliasConfig.aliases || aliasConfig;
  
  if (aliases[scriptName]) {
    const aliasValue = aliases[scriptName];
    
    if (typeof aliasValue === 'string') {
      // 字符串值：可能是绝对路径或系统命令
      if (path.isAbsolute(aliasValue)) {
        // 绝对路径
        if (await fs.pathExists(aliasValue)) {
          console.log(t('commands.executingAlias', { type: 'absolute', path: aliasValue }));
          await executeFile(aliasValue, args);
          return;
        } else {
          console.error(t('commands.aliasNotFound', { path: aliasValue }));
          process.exit(1);
        }
      } else {
        // 系统命令
        if (await checkSystemCommand(aliasValue)) {
          await executeSystemCommand(aliasValue, args);
          return;
        } else {
          console.error(t('commands.systemCommandNotFound', { command: aliasValue }));
          process.exit(1);
        }
      }
    } else if (aliasValue && typeof aliasValue === 'object' && aliasValue.bin) {
      // 对象值：可能是绝对路径或相对路径配置
      const binPath = aliasValue.bin;
      let fullPath;
      
      if (path.isAbsolute(binPath)) {
        // 绝对路径
        fullPath = binPath;
      } else {
        // 相对路径
        fullPath = path.resolve(config.scriptPath, binPath);
      }
      
      if (await fs.pathExists(fullPath)) {
        console.log(t('commands.executingAlias', { 
          type: path.isAbsolute(binPath) ? 'absolute' : 'relative', 
          path: binPath 
        }));
        
        // 检查是否是脚本文件（有扩展名）还是系统可执行文件
        const ext = path.extname(fullPath);
        if (ext === '.js' || ext === '.mjs' || ext === '.sh') {
          await executeFile(fullPath, args);
        } else {
          // 对于没有扩展名的可执行文件，使用系统命令执行
          await executeSystemCommand(fullPath, args);
        }
        return;
      } else {
        console.error(t('commands.aliasNotFound', { path: fullPath }));
        process.exit(1);
      }
    } else {
      console.error(t('commands.invalidAlias', { name: scriptName }));
      process.exit(1);
    }
  }
  
  // 优先级2: 检查path中的文件（原有逻辑）
  const scriptPath = path.join(config.scriptPath, scriptName);
  
  // 检查是否是文件夹
  if (await fs.pathExists(scriptPath) && (await fs.stat(scriptPath)).isDirectory()) {
    await executeFromDirectory(scriptPath, args);
    return;
  }
  
  // 检查不同的文件扩展名
  const possibleFiles = [
    scriptPath,
    `${scriptPath}.js`,
    `${scriptPath}.sh`,
    `${scriptPath}.mjs`
  ];
  
  let targetFile = null;
  for (const file of possibleFiles) {
    if (await fs.pathExists(file)) {
      targetFile = file;
      break;
    }
  }
  
  if (targetFile) {
    await executeFile(targetFile, args);
    return;
  }
  
  // 优先级3: 检查远程下载的脚本
  const remoteScript = await findRemoteScript(scriptName);
  if (remoteScript) {
    console.log(t('commands.executingRemote', { 
      script: `${remoteScript.sourceName}/${path.basename(remoteScript.scriptPath)}` 
    }));
    await executeFile(remoteScript.scriptPath, args);
    return;
  }
  
  // 优先级4: 检查系统可执行命令
  if (await checkSystemCommand(scriptName)) {
    await executeSystemCommand(scriptName, args);
    return;
  }
  
  console.error(t('commands.commandNotFound', { command: scriptName }));
  console.error(t('commands.lookedIn'));
  console.error(t('commands.aliasConfig', { path: path.join(config.scriptPath, 'config.json') }));
  console.error(t('commands.scriptDirectory', { path: config.scriptPath }));
  console.error(t('commands.remoteScripts', { path: getRemoteScriptsDir() }));
  console.error(t('commands.systemPath'));
  process.exit(1);
}

// 从package.json读取描述信息
async function getPackageDescription(dirPath) {
  try {
    const packagePath = path.join(dirPath, 'package.json');
    if (await fs.pathExists(packagePath)) {
      const packageJson = await fs.readJson(packagePath);
      return packageJson.description || '';
    }
  } catch (error) {
    // 忽略读取错误
  }
  return '';
}

// 从脚本文件头部注释读取描述信息
async function getScriptDescription(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 10); // 只读取前10行
    
    // 查找描述注释
    for (const line of lines) {
      const trimmed = line.trim();
      
      // JavaScript风格注释
      if (trimmed.startsWith('// Description:') || trimmed.startsWith('// @description')) {
        return trimmed.replace(/^\/\/ (?:Description:|@description)\s*/, '');
      }
      
      // Shell风格注释
      if (trimmed.startsWith('# Description:') || trimmed.startsWith('# @description')) {
        return trimmed.replace(/^# (?:Description:|@description)\s*/, '');
      }
      
      // 通用描述格式
      if (trimmed.includes('Description:')) {
        const match = trimmed.match(/Description:\s*(.+)$/);
        if (match) return match[1];
      }
    }
  } catch (error) {
    // 忽略读取错误
  }
  return '';
}

// 递归扫描目录中的脚本文件
async function scanScripts(dir, basePath = '', maxDepth = 3, currentDepth = 0) {
  const scripts = [];
  
  if (currentDepth >= maxDepth) {
    return scripts;
  }
  
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      // 跳过config.json和README文件
      if (file === 'config.json' || file.startsWith('README') || file.startsWith('.')) {
        continue;
      }
      
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      const relativePath = basePath ? `${basePath}/${file}` : file;
      
      if (stat.isDirectory()) {
        // 检查目录是否包含index文件
        const indexFiles = ['index.js', 'index.sh', 'index.mjs'];
        let hasIndex = false;
        
        for (const indexFile of indexFiles) {
          if (await fs.pathExists(path.join(filePath, indexFile))) {
            // 尝试从package.json获取描述
            const packageDesc = await getPackageDescription(filePath);
            // 如果没有package.json描述，尝试从index文件获取
            const scriptDesc = packageDesc || await getScriptDescription(path.join(filePath, indexFile));
            
            scripts.push({
              name: relativePath,
              type: 'directory',
              entry: indexFile,
              path: relativePath,
              description: scriptDesc
            });
            hasIndex = true;
            break;
          }
        }
        
        // 递归扫描子目录
        const subScripts = await scanScripts(filePath, relativePath, maxDepth, currentDepth + 1);
        scripts.push(...subScripts);
        
      } else if (file.endsWith('.js') || file.endsWith('.sh') || file.endsWith('.mjs')) {
        // 从脚本文件获取描述
        const scriptDesc = await getScriptDescription(filePath);
        
        scripts.push({
          name: file,
          type: 'file',
          path: relativePath,
          description: scriptDesc
        });
      }
    }
  } catch (error) {
    // 忽略无法读取的目录
  }
  
  return scripts;
}

// 显示当前配置和可用脚本
async function showStatus() {
  const config = await readConfig();
  
  if (!config.scriptPath) {
    console.log(t('commands.noPathConfigured'));
    return;
  }
  
  console.log(t('status.currentPath', { path: config.scriptPath }));
  
  // 读取别名配置
  const aliasConfig = await readAliasConfig(config.scriptPath);
  const aliases = aliasConfig.aliases || aliasConfig;
  
  // 显示配置的别名
  if (Object.keys(aliases).length > 0) {
    console.log('\n' + t('status.configuredAliases'));
    
    // 按类型分组别名
    const aliasGroups = {
      relative: [],    // 相对路径
      absolute: [],    // 绝对路径  
      system: []       // 系统命令
    };
    
    for (const [name, config] of Object.entries(aliases)) {
      let description = '';
      let binPath = '';
      let type = 'system';
      
      if (typeof config === 'string') {
        binPath = config;
        if (path.isAbsolute(config)) {
          type = 'absolute';
        } else {
          type = 'system';
        }
      } else if (config && typeof config === 'object') {
        binPath = config.bin || '';
        description = config.description || '';
        if (binPath.startsWith('./')) {
          type = 'relative';
        } else if (path.isAbsolute(binPath)) {
          type = 'absolute';
        } else {
          type = 'system';
        }
      }
      
      aliasGroups[type].push({
        name,
        bin: binPath,
        description
      });
    }
    
    // 显示相对路径别名（项目脚本）
    if (aliasGroups.relative.length > 0) {
      console.log('  ' + t('status.projectScripts'));
      aliasGroups.relative.forEach(alias => {
        const desc = alias.description ? ` - ${alias.description}` : '';
        console.log(`    • ${alias.name.padEnd(15)} ${alias.bin}${desc}`);
      });
    }
    
    // 显示绝对路径别名
    if (aliasGroups.absolute.length > 0) {
      console.log('  ' + t('status.absolutePathScripts'));
      aliasGroups.absolute.forEach(alias => {
        const desc = alias.description ? ` - ${alias.description}` : '';
        console.log(`    • ${alias.name.padEnd(15)} ${alias.bin}${desc}`);
      });
    }
    
    // 显示系统命令别名
    if (aliasGroups.system.length > 0) {
      console.log('  ' + t('status.systemCommandAliases'));
      aliasGroups.system.forEach(alias => {
        const desc = alias.description ? ` - ${alias.description}` : '';
        console.log(`    • ${alias.name.padEnd(15)} ${alias.bin}${desc}`);
      });
    }
  }
  
  // 扫描并显示所有脚本文件
  try {
    const scripts = await scanScripts(config.scriptPath);
    
    if (scripts.length > 0) {
      console.log('\n' + t('status.availableScripts'));
      
      // 按目录分组
      const scriptsByDir = {};
      scripts.forEach(script => {
        const dir = path.dirname(script.path);
        const dirName = dir === '.' ? 'root' : dir;
        
        if (!scriptsByDir[dirName]) {
          scriptsByDir[dirName] = [];
        }
        scriptsByDir[dirName].push(script);
      });
      
      // 显示每个目录的脚本
      for (const [dirName, dirScripts] of Object.entries(scriptsByDir)) {
        if (dirName === 'root') {
          console.log('  ' + t('status.rootDirectory'));
        } else {
          console.log(`  📁 ${dirName}/:`);
        }
        
                 dirScripts.forEach(script => {
           const description = script.description ? ` - ${script.description}` : '';
           
           if (script.type === 'directory') {
             console.log(`    📁 ${script.name}/ (${script.entry})${description}`);
           } else {
             const ext = path.extname(script.name);
             const icon = ext === '.js' || ext === '.mjs' ? '📄' : ext === '.sh' ? '📜' : '📄';
             console.log(`    ${icon} ${script.name.padEnd(20)}${description}`);
           }
         });
      }
    } else {
      console.log('\n' + t('status.noScriptsFound'));
    }
    
  } catch (error) {
    console.error(t('status.errorScanning', { error: error.message }));
  }
  
  // 显示远程脚本
  try {
    const sources = await getSources();
    if (Object.keys(sources).length > 0) {
      console.log('\n' + t('status.remoteScriptsTitle'));
      
      let hasRemoteScripts = false;
      for (const [sourceName, source] of Object.entries(sources)) {
        const sourceDir = path.join(getRemoteScriptsDir(), sourceName);
        if (await fs.pathExists(sourceDir)) {
          const files = await fs.readdir(sourceDir);
          const scripts = files.filter(f => !f.startsWith('.'));
          
          if (scripts.length > 0) {
            console.log(`  📡 ${sourceName} (${source.type}):`);
            scripts.sort().forEach(script => {
              const ext = path.extname(script);
              const icon = ext === '.js' || ext === '.mjs' ? '📄' : ext === '.sh' ? '📜' : '📄';
              console.log(`    ${icon} ${script}`);
            });
            hasRemoteScripts = true;
          }
        }
      }
      
      if (!hasRemoteScripts) {
        console.log('  ' + t('status.noRemoteScripts'));
        console.log('  ' + t('status.downloadTip'));
      }
    }
  } catch (error) {
    // 忽略远程脚本显示错误
  }
  
  // 显示使用提示
  console.log('\n' + t('status.usageTips'));
  console.log('  ' + t('status.useAliases'));
  console.log('  ' + t('status.useFileNames'));
  console.log('  ' + t('status.useDirectories'));
  console.log('  ' + t('status.useRemote'));
  console.log('  ' + t('status.getHelp'));
  console.log('  ' + t('status.manageSources'));
}

// 显示简洁的软件介绍
function showBrief() {
  console.log(`\n🚀 ${t('app.name')}`);
  console.log(`${t('app.description')}\n`);
  
  console.log(t('help.usage'));
  console.log(`  q <script>              ${t('help.executeScript')}`);
  console.log(`  q -l                    ${t('help.listScripts')}`);
  console.log(`  q -h, --help            ${t('help.showHelp')}`);
  console.log(`  q -path <dir>           ${t('help.setDirectory')}\n`);
  
  console.log(t('help.examples'));
  console.log(`  q hello                 ${t('help.runScript', { script: 'hello' })}`);
  console.log(`  q -l                    ${t('help.listScripts')}`);
  console.log(`  q --help                ${t('help.showHelp')}\n`);
}

module.exports = {
  executeScript,
  showStatus,
  showBrief
}; 
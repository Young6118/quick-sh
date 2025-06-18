#!/usr/bin/env node

const { program } = require('commander');
const { setPath, setLanguage, showLanguage } = require('../lib/config');
const { configureAI, selectModel, showAIConfig } = require('../lib/ai');
const { executeScript, showStatus, showBrief } = require('../lib/script-manager');
const { showHelp } = require('../lib/help');
const { 
  addSource, 
  removeSource, 
  listSources, 
  downloadScript, 
  listRemoteScripts, 
  removeRemoteScript,
  SOURCE_TYPES 
} = require('../lib/remote-manager');
const { initI18n } = require('../lib/i18n');

// 初始化国际化系统
(async () => {
  await initI18n();
  
  // 自定义命令处理 - 在 commander.js 解析之前拦截
  const args = process.argv.slice(2);

if (args.length > 0) {
  const firstArg = args[0];
  
  // 处理内置命令
  if (firstArg === '-path' && args.length >= 2) {
    setPath(args[1]);
    return;
  }
  
  // 处理语言设置命令
  if (firstArg === '-lang' || firstArg === '--lang') {
    if (args.length >= 2) {
      setLanguage(args[1]).catch(error => {
        console.error(`❌ ${error.message}`);
        process.exit(1);
      });
    } else {
      showLanguage().catch(error => {
        console.error(`❌ ${error.message}`);
        process.exit(1);
      });
    }
    return;
  }
  
  // 处理AI聊天命令
  if (firstArg === '-ai' || firstArg === '--ai') {
    if (args.length >= 2) {
      const subCommand = args[1];
      
      if (subCommand === '-config' || subCommand === '--config') {
        configureAI().catch(error => {
          console.error(`❌ ${error.message}`);
          process.exit(1);
        });
        return;
      }
      
      if (subCommand === '-use' || subCommand === '--use') {
        if (args.length >= 3) {
          // 直接使用指定模型
          selectModel(args[2]).catch(error => {
            console.error(`❌ ${error.message}`);
            process.exit(1);
          });
        } else {
          // 显示模型选择菜单
          selectModel().catch(error => {
            console.error(`❌ ${error.message}`);
            process.exit(1);
          });
        }
        return;
      }
      
      if (subCommand === '-show' || subCommand === '--show') {
        showAIConfig().catch(error => {
          console.error(`❌ ${error.message}`);
          process.exit(1);
        });
        return;
      }
    } else {
      // 没有子命令，尝试启动AI聊天
      selectModel().catch(error => {
        console.error(`❌ ${error.message}`);
        process.exit(1);
      });
    }
    return;
  }
  
  if (firstArg === '-list' || firstArg === '-l') {
    showStatus();
    return;
  }
  
  if (firstArg === '-help' || firstArg === '-h' || firstArg === '--help') {
    showHelp();
    return;
  }
  
  // 处理远程脚本管理命令
  if (firstArg === '--sources' || firstArg === '-s') {
    listSources();
    return;
  }
  
  if (firstArg === '--add-source' && args.length >= 4) {
    const [, name, type, url, ...options] = args;
    const sourceOptions = {};
    
    // 解析选项参数
    for (let i = 0; i < options.length; i += 2) {
      if (options[i] && options[i + 1]) {
        const key = options[i].replace(/^--/, '');
        sourceOptions[key] = options[i + 1];
      }
    }
    
    addSource(name, type, url, sourceOptions).catch(error => {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    });
    return;
  }
  
  if (firstArg === '--remove-source' && args.length >= 2) {
    removeSource(args[1]).catch(error => {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    });
    return;
  }
  
  if (firstArg === '--download' && args.length >= 3) {
    const [, sourceName, scriptPath, localName] = args;
    downloadScript(sourceName, scriptPath, localName).catch(error => {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    });
    return;
  }
  
  if (firstArg === '--remote-list' || firstArg === '-rl') {
    listRemoteScripts().catch(error => {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    });
    return;
  }
  
  if (firstArg === '--remove-remote' && args.length >= 3) {
    const [, sourceName, scriptName] = args;
    removeRemoteScript(sourceName, scriptName).catch(error => {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    });
    return;
  }
  
  // 对于其他命令，直接执行脚本，避免 commander.js 解析参数
  if (firstArg && !firstArg.startsWith('-')) {
    executeScript(firstArg, args.slice(1));
    return;
  }
}

// 设置命令行程序
program
  .name('q')
  .description('quick sh - Local script management tool')
  .version('1.0.0');

// 默认命令：执行脚本
program
  .argument('[script]', 'Script name to execute')
  .argument('[args...]', 'Arguments to pass to the script')
  .action(async (script, args) => {
    if (!script) {
      await showBrief();
      return;
    }
    await executeScript(script, args || []);
  });

program.parse();
})(); 
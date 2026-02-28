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
const {
  connectShell,
  listShells,
  showShellHelp,
  addShell,
  addShellWithPassword,
  editShell,
  editShellInteractive,
  renameShell,
  removeShell,
  addShellInteractive,
  renameShellInteractive,
  removeShellInteractive,
  setShellPassword,
  removeShellPassword,
  setPasswordInteractive,
  listPasswords
} = require('../lib/shell-manager');
const { initI18n, forceReinitI18n } = require('../lib/i18n');
const packageJson = require('../../package.json');

// 初始化国际化系统
(async () => {
  // 如果在测试环境中，强制重新初始化
  if (process.env.QUICK_SH_TEST_LANG) {
    await forceReinitI18n();
  } else {
    await initI18n();
  }
  
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
  
  // Shell 连接：q sh [name] / add / rename / remove，配置来自 ~/.quick-sh/config.json 的 shells
  if (firstArg === 'sh') {
    const sub = args[1];
    const rest = args.slice(2);
    const run = (p) => p.catch(error => {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    });
    if (sub === '-h' || sub === '--help' || sub === 'help') {
      showShellHelp();
      return;
    }
    if (sub === 'add') {
      const opts = {};
      for (let i = 0; i < rest.length; i += 2) {
        if (rest[i] && rest[i].startsWith('--') && rest[i + 1] != null) {
          opts[rest[i].slice(2)] = rest[i + 1];
        }
      }
      if (opts.name && opts.host) {
        run(addShellWithPassword({
          name: opts.name,
          host: opts.host,
          user: opts.user,
          port: opts.port,
          password: opts.password
        }));
      } else {
        run(addShellInteractive());
      }
      return;
    }
    if (sub === 'edit') {
      const editRest = rest.slice(0);
      const name = editRest[0] && !editRest[0].startsWith('--') ? editRest.shift() : null;
      const editOpts = {};
      for (let i = 0; i < editRest.length; i += 2) {
        if (editRest[i] && editRest[i].startsWith('--') && editRest[i + 1] != null) {
          editOpts[editRest[i].slice(2)] = editRest[i + 1];
        }
      }
      const hasOpts = Object.keys(editOpts).length > 0;
      if (hasOpts && name) {
        run(editShell(name, editOpts));
      } else {
        run(editShellInteractive(name || undefined));
      }
      return;
    }
    if (sub === 'rename') {
      if (rest.length >= 2) {
        run(renameShell(rest[0], rest[1]));
      } else {
        run(renameShellInteractive());
      }
      return;
    }
    if (sub === 'remove' || sub === 'rm') {
      if (rest.length >= 1) {
        run(removeShell(rest[0]));
      } else {
        run(removeShellInteractive());
      }
      return;
    }
    if (sub === 'password') {
      const pwdSub = rest[0];
      if (pwdSub === 'set') {
        const name = rest[1];
        if (name) {
          run(setPasswordInteractive(name));
        } else {
          console.error('❌ q sh password set <name>');
          process.exit(1);
        }
      } else if (pwdSub === 'remove' || pwdSub === 'rm') {
        const name = rest[1];
        if (name) {
          run(removeShellPassword(name).then(() => console.log(require('../lib/i18n').t('shell.passwordRemoved', { name }))));
        } else {
          console.error('❌ q sh password remove <name>');
          process.exit(1);
        }
      } else if (pwdSub === 'list' || pwdSub === 'ls') {
        run(listPasswords());
      } else {
        console.error('❌ q sh password set | remove | list');
        process.exit(1);
      }
      return;
    }
    if (sub) {
      run(connectShell(sub));
    } else {
      listShells();
    }
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
  .version(packageJson.version);

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
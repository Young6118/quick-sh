const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// 执行文件
async function executeFile(filePath, args = []) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  console.log(`Executing: ${fileName}${args.length > 0 ? ' with args: ' + args.join(' ') : ''}`);
  
  try {
    if (ext === '.js' || ext === '.mjs') {
      // 使用spawn来保持交互性
      const child = spawn('node', [filePath, ...args], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          QUICK_SH_ORIGINAL_CWD: process.cwd()
        }
      });
      
      child.on('close', (code) => {
        process.exit(code);
      });
      
    } else if (ext === '.sh') {
      // 确保shell脚本有执行权限
      try {
        await fs.chmod(filePath, 0o755);
      } catch (error) {
        // 忽略权限设置错误
      }
      
      const child = spawn('sh', [filePath, ...args], {
        stdio: 'inherit',
        cwd: path.dirname(filePath),
        env: {
          ...process.env,
          QUICK_SH_ORIGINAL_CWD: process.cwd()
        }
      });
      
      child.on('close', (code) => {
        process.exit(code);
      });
      
    } else {
      console.error(`Unsupported file type: ${ext}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error executing script: ${error.message}`);
    process.exit(1);
  }
}

// 从目录执行脚本
async function executeFromDirectory(dirPath, args = []) {
  const possibleFiles = [
    path.join(dirPath, 'index.js'),
    path.join(dirPath, 'index.sh'),
    path.join(dirPath, 'index.mjs')
  ];
  
  let targetFile = null;
  for (const file of possibleFiles) {
    if (await fs.pathExists(file)) {
      targetFile = file;
      break;
    }
  }
  
  if (!targetFile) {
    console.error(`No index.js, index.sh, or index.mjs found in directory: ${dirPath}`);
    process.exit(1);
  }
  
  await executeFile(targetFile, args);
}

// 执行系统命令
async function executeSystemCommand(command, args = []) {
  console.log(`Executing system command: ${command}${args.length > 0 ? ' with args: ' + args.join(' ') : ''}`);
  
  const child = spawn(command, args, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    process.exit(code);
  });
  
  child.on('error', (error) => {
    console.error(`Error executing system command: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  executeFile,
  executeFromDirectory,
  executeSystemCommand
}; 
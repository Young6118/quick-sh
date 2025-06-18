const { execSync } = require('child_process');

// 检查系统命令是否存在
async function checkSystemCommand(command) {
  try {
    const isWindows = process.platform === 'win32';
    const whichCommand = isWindows ? 'where' : 'which';
    
    execSync(`${whichCommand} ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  checkSystemCommand
}; 
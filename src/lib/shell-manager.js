const { spawn } = require('child_process');
const readline = require('readline');
const { readConfig, writeConfig } = require('./config');
const { t } = require('./i18n');

/** Shell 配置结构（存于 ~/.quick-sh/config.json 的 shells 字段）：
 *  "shells": {
 *    "server1": { "host": "192.168.1.1", "user": "root", "port": 22 },
 *    "dev": { "host": "dev.example.com", "user": "deploy" }
 *  }
 * port 可选，默认 22。
 */

async function getShellsConfig() {
  const config = await readConfig();
  return config.shells || {};
}

async function getFullConfig() {
  const config = await readConfig();
  if (!config.shells || typeof config.shells !== 'object') config.shells = {};
  return config;
}

async function connectShell(name) {
  const shells = await getShellsConfig();
  const one = shells[name];

  if (!one) {
    console.error(t('shell.notFound', { name }));
    if (Object.keys(shells).length > 0) {
      console.error(t('shell.available'));
      Object.keys(shells).forEach(k => console.error(`  • ${k}`));
    }
    process.exit(1);
  }

  const host = one.host;
  if (!host) {
    console.error(t('shell.noHost', { name }));
    process.exit(1);
  }

  const user = one.user || null;
  const port = one.port != null ? Number(one.port) : 22;
  const target = user ? `${user}@${host}` : host;
  const args = ['-p', String(port), target];

  // 透传后续参数给 ssh（如 -t "tmux attach"）
  const argv = process.argv.slice(2);
  const shIndex = argv.indexOf('sh');
  if (shIndex !== -1 && argv.length > shIndex + 2) {
    args.push(...argv.slice(shIndex + 2));
  }

  const child = spawn('ssh', args, {
    stdio: 'inherit',
    shell: false
  });

  child.on('error', err => {
    console.error(t('shell.sshError', { error: err.message }));
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code != null ? code : 1);
    }
  });
}

function showShellHelp() {
  console.log(t('shell.helpTitle'));
  console.log('');
  console.log(t('shell.helpUsage'));
  console.log(`  q sh              ${t('shell.helpList')}`);
  console.log(`  q sh <name>       ${t('shell.helpConnect')}`);
  console.log(`  q sh add          ${t('shell.helpAdd')}`);
  console.log(`  q sh rename       ${t('shell.helpRename')}`);
  console.log(`  q sh remove <name> ${t('shell.helpRemove')}`);
  console.log('');
  console.log(t('shell.helpConfig'));
  console.log(t('shell.helpExample'));
}

/** 新增连接。opts: { name, host, user?, port? } */
async function addShell(opts) {
  const { name, host, user, port } = opts;
  if (!name || !host) {
    throw new Error(t('shell.addNameHostRequired'));
  }
  const config = await getFullConfig();
  if (config.shells[name]) {
    throw new Error(t('shell.addNameExists', { name }));
  }
  config.shells[name] = {
    host,
    ...(user != null && user !== '' && { user }),
    ...(port != null && port !== '' && { port: Number(port) || 22 })
  };
  await writeConfig(config);
  console.log(t('shell.addSuccess', { name }));
}

/** 重命名连接 */
async function renameShell(oldName, newName) {
  if (!oldName || !newName) {
    throw new Error(t('shell.renameArgsRequired'));
  }
  const config = await getFullConfig();
  if (!config.shells[oldName]) {
    throw new Error(t('shell.notFound', { name: oldName }));
  }
  if (config.shells[newName]) {
    throw new Error(t('shell.addNameExists', { name: newName }));
  }
  config.shells[newName] = config.shells[oldName];
  delete config.shells[oldName];
  await writeConfig(config);
  console.log(t('shell.renameSuccess', { oldName, newName }));
}

/** 删除连接 */
async function removeShell(name) {
  if (!name) {
    throw new Error(t('shell.removeNameRequired'));
  }
  const config = await getFullConfig();
  if (!config.shells[name]) {
    throw new Error(t('shell.notFound', { name }));
  }
  delete config.shells[name];
  await writeConfig(config);
  console.log(t('shell.removeSuccess', { name }));
}

function ask(rl, question, defaultValue = '') {
  const def = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise(resolve => {
    rl.question(`${question}${def}: `, ans => resolve(ans.trim() || defaultValue));
  });
}

/** 交互式新增 */
async function addShellInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const name = await ask(rl, t('shell.promptName'));
  if (!name) {
    rl.close();
    throw new Error(t('shell.addNameHostRequired'));
  }
  const shells = await getShellsConfig();
  if (shells[name]) {
    rl.close();
    throw new Error(t('shell.addNameExists', { name }));
  }
  const host = await ask(rl, t('shell.promptHost'));
  if (!host) {
    rl.close();
    throw new Error(t('shell.addNameHostRequired'));
  }
  const user = await ask(rl, t('shell.promptUser'), 'root');
  const port = await ask(rl, t('shell.promptPort'), '22');
  rl.close();
  await addShell({ name, host, user: user || undefined, port: port || '22' });
}

/** 交互式重命名 */
async function renameShellInteractive() {
  const shells = await getShellsConfig();
  const names = Object.keys(shells);
  if (names.length === 0) {
    console.log(t('shell.noShells'));
    return;
  }
  console.log(t('shell.listTitle'));
  names.forEach((n, i) => {
    const c = shells[n];
    console.log(`  ${i + 1}. ${n.padEnd(12)} ${(c.user || '') + (c.user ? '@' : '')}${c.host || '?'}`);
  });
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const oldName = await ask(rl, t('shell.promptRenameOld'));
  if (!oldName) {
    rl.close();
    return;
  }
  const resolved = names.includes(oldName) ? oldName : names[Number(oldName) - 1];
  if (!resolved || !shells[resolved]) {
    rl.close();
    throw new Error(t('shell.notFound', { name: oldName }));
  }
  const newName = await ask(rl, t('shell.promptRenameNew'));
  rl.close();
  if (!newName) throw new Error(t('shell.renameArgsRequired'));
  await renameShell(resolved, newName);
}

/** 交互式删除 */
async function removeShellInteractive() {
  const shells = await getShellsConfig();
  const names = Object.keys(shells);
  if (names.length === 0) {
    console.log(t('shell.noShells'));
    return;
  }
  console.log(t('shell.listTitle'));
  names.forEach((n, i) => {
    const c = shells[n];
    console.log(`  ${i + 1}. ${n.padEnd(12)} ${(c.user || '') + (c.user ? '@' : '')}${c.host || '?'}`);
  });
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const name = await ask(rl, t('shell.promptRemove'));
  if (!name) {
    rl.close();
    return;
  }
  const resolved = names.includes(name) ? name : names[Number(name) - 1];
  if (!resolved || !shells[resolved]) {
    rl.close();
    throw new Error(t('shell.notFound', { name }));
  }
  const confirm = await ask(rl, t('shell.promptRemoveConfirm', { name: resolved }), 'n');
  rl.close();
  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    await removeShell(resolved);
  } else {
    console.log(t('shell.removeCancelled'));
  }
}

function listShells() {
  return getShellsConfig().then(shells => {
    const names = Object.keys(shells);
    if (names.length === 0) {
      console.log(t('shell.noShells'));
      console.log(t('shell.configHint'));
      console.log(t('shell.helpHint'));
      return;
    }
    console.log(t('shell.listTitle'));
    names.forEach(name => {
      const c = shells[name];
      const user = c.user ? `${c.user}@` : '';
      const port = c.port != null ? `:${c.port}` : '';
      console.log(`  • ${name.padEnd(12)} ${user}${c.host || '?'}${port}`);
    });
    console.log(t('shell.usageHint'));
  });
}

module.exports = {
  getShellsConfig,
  connectShell,
  listShells,
  showShellHelp,
  addShell,
  renameShell,
  removeShell,
  addShellInteractive,
  renameShellInteractive,
  removeShellInteractive
};

const { spawn, spawnSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const { readConfig, writeConfig } = require('./config');
const { t } = require('./i18n');

const PASSWORDS_FILE = path.join(os.homedir(), '.quick-sh', 'shell-passwords.json');
const CONFIG_DIR = path.join(os.homedir(), '.quick-sh');

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

/** 密码单独存于 ~/.quick-sh/shell-passwords.json，格式 { "name": "password" } */
async function readShellPasswords() {
  try {
    if (await fs.pathExists(PASSWORDS_FILE)) {
      const data = await fs.readJson(PASSWORDS_FILE);
      return typeof data === 'object' && data !== null ? data : {};
    }
  } catch (e) {
    // ignore
  }
  return {};
}

async function getShellPassword(name) {
  const passwords = await readShellPasswords();
  return passwords[name] != null ? String(passwords[name]) : null;
}

async function writeShellPasswords(passwords) {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(PASSWORDS_FILE, passwords, { spaces: 2 });
  try {
    await fs.chmod(PASSWORDS_FILE, 0o600);
  } catch (e) {
    // ignore on Windows
  }
}

async function setShellPassword(name, password) {
  const passwords = await readShellPasswords();
  passwords[name] = password;
  await writeShellPasswords(passwords);
}

async function removeShellPassword(name) {
  const passwords = await readShellPasswords();
  delete passwords[name];
  await writeShellPasswords(passwords);
}

function hasSshpass() {
  const r = spawnSync('which', ['sshpass'], { encoding: 'utf8' });
  return r.status === 0 && r.stdout && r.stdout.trim().length > 0;
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
  const sshArgs = ['-p', String(port), target];

  const argv = process.argv.slice(2);
  const shIndex = argv.indexOf('sh');
  if (shIndex !== -1 && argv.length > shIndex + 2) {
    sshArgs.push(...argv.slice(shIndex + 2));
  }

  const password = await getShellPassword(name);
  const useSshpass = password && hasSshpass();
  if (password && !useSshpass) {
    console.log('');
    console.log('💡 ' + t('shell.passwordSavedButNoSshpass'));
    console.log('');
  }
  const spawnArgs = useSshpass
    ? ['-p', password, 'ssh', ...sshArgs]
    : sshArgs;
  const spawnCmd = useSshpass ? 'sshpass' : 'ssh';

  const child = spawn(spawnCmd, spawnArgs, {
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

async function setPasswordInteractive(name) {
  const shells = await getShellsConfig();
  if (!shells[name]) {
    throw new Error(t('shell.notFound', { name }));
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (process.stdin.isTTY && process.platform !== 'win32') {
    try {
      spawnSync('stty', ['-echo'], { stdio: 'inherit' });
    } catch (e) {
      // ignore
    }
  }
  const password = await new Promise(resolve => {
    rl.question(t('shell.promptPassword'), ans => resolve(ans || ''));
  });
  if (process.stdin.isTTY && process.platform !== 'win32') {
    try {
      spawnSync('stty', ['echo'], { stdio: 'inherit' });
    } catch (e) {
      // ignore
    }
  }
  rl.close();
  if (!password) {
    throw new Error(t('shell.passwordEmpty'));
  }
  await setShellPassword(name, password);
  console.log(t('shell.passwordSet', { name }));
}

async function listPasswords() {
  const passwords = await readShellPasswords();
  const names = Object.keys(passwords);
  if (names.length === 0) {
    console.log(t('shell.passwordListEmpty'));
    return;
  }
  console.log(t('shell.passwordListTitle'));
  names.forEach(n => console.log(`  • ${n}`));
}

function showShellHelp() {
  console.log(t('shell.helpTitle'));
  console.log('');
  console.log(t('shell.helpUsage'));
  console.log(`  q sh              ${t('shell.helpList')}`);
  console.log(`  q sh <name>       ${t('shell.helpConnect')}`);
  console.log(`  q sh add          ${t('shell.helpAdd')}`);
  console.log(`  q sh edit [name]  ${t('shell.helpEdit')}`);
  console.log(`  q sh rename       ${t('shell.helpRename')}`);
  console.log(`  q sh remove <name> ${t('shell.helpRemove')}`);
  console.log(`  q sh password set <name>   ${t('shell.helpPasswordSet')}`);
  console.log(`  q sh password remove <name> ${t('shell.helpPasswordRemove')}`);
  console.log(`  q sh password list         ${t('shell.helpPasswordList')}`);
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

/** 新增连接并可选保存密码。opts 含 name, host, user?, port?, password? */
async function addShellWithPassword(opts) {
  const { password, ...addOpts } = opts;
  await addShell(addOpts);
  if (password != null && password !== '') {
    await setShellPassword(opts.name, password);
  }
}

/** 编辑连接，新值直接覆盖旧配置；可只传部分字段与当前合并。opts: { host?, user?, port?, password? } */
async function editShell(name, opts) {
  if (!name) {
    throw new Error(t('shell.addNameHostRequired'));
  }
  const config = await getFullConfig();
  const current = config.shells[name];
  if (!current) {
    throw new Error(t('shell.notFound', { name }));
  }
  const host = opts.host != null && opts.host !== '' ? opts.host : current.host;
  const user = opts.user !== undefined ? opts.user : current.user;
  const port = opts.port !== undefined && opts.port !== '' ? (Number(opts.port) || 22) : (current.port != null ? current.port : 22);
  if (!host) {
    throw new Error(t('shell.noHost', { name }));
  }
  config.shells[name] = {
    host,
    ...(user != null && user !== '' && { user }),
    ...(port != null && { port })
  };
  await writeConfig(config);
  if (opts.password !== undefined) {
    if (opts.password === '' || opts.password == null) {
      await removeShellPassword(name);
    } else {
      await setShellPassword(name, opts.password);
    }
  }
  console.log(t('shell.editSuccess', { name }));
}

/** 交互式编辑：可指定 name 或之后选择 */
async function editShellInteractive(name) {
  const shells = await getShellsConfig();
  const names = Object.keys(shells);
  if (names.length === 0) {
    console.log(t('shell.noShells'));
    return;
  }
  let target = name;
  if (!target) {
    console.log(t('shell.listTitle'));
    names.forEach((n, i) => {
      const c = shells[n];
      console.log(`  ${i + 1}. ${n.padEnd(12)} ${(c.user || '') + (c.user ? '@' : '')}${c.host || '?'}`);
    });
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    target = await ask(rl, t('shell.promptEditWhich'));
    rl.close();
    if (!target) return;
    target = names.includes(target) ? target : names[Number(target) - 1];
    if (!target || !shells[target]) {
      throw new Error(t('shell.notFound', { name: target }));
    }
  } else if (!shells[target]) {
    throw new Error(t('shell.notFound', { name: target }));
  }
  const current = shells[target];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const host = await ask(rl, t('shell.promptHost'), current.host || '');
  const user = await ask(rl, t('shell.promptUser'), current.user != null ? String(current.user) : 'root');
  const port = await ask(rl, t('shell.promptPort'), current.port != null ? String(current.port) : '22');
  const password = await askPasswordOptional(rl);
  rl.close();
  if (!host) throw new Error(t('shell.addNameHostRequired'));
  await editShell(target, {
    host,
    user: user || undefined,
    port: port || '22',
    ...(password !== '' && { password })
  });
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

/** 交互式询问可选密码（输入不显示，直接回车则跳过） */
function askPasswordOptional(rl) {
  if (process.stdin.isTTY && process.platform !== 'win32') {
    try {
      spawnSync('stty', ['-echo'], { stdio: 'inherit' });
    } catch (e) {
      // ignore
    }
  }
  return new Promise(resolve => {
    rl.question(t('shell.promptPasswordOptional'), ans => {
      if (process.stdin.isTTY && process.platform !== 'win32') {
        try {
          spawnSync('stty', ['echo'], { stdio: 'inherit' });
        } catch (e) {
          // ignore
        }
      }
      resolve((ans || '').trim());
    });
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
  const password = await askPasswordOptional(rl);
  rl.close();
  await addShell({ name, host, user: user || undefined, port: port || '22' });
  if (password !== '') {
    await setShellPassword(name, password);
    console.log(t('shell.passwordSet', { name }));
  }
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
  addShellWithPassword,
  editShell,
  renameShell,
  removeShell,
  addShellInteractive,
  editShellInteractive,
  renameShellInteractive,
  removeShellInteractive,
  setShellPassword,
  removeShellPassword,
  setPasswordInteractive,
  listPasswords,
  getShellPassword
};

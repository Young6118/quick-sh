const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const os = require('os');
const { readConfig, writeConfig } = require('./config');
const { t } = require('./i18n');

// 远程脚本存储目录
const REMOTE_SCRIPTS_DIR = path.join(os.homedir(), '.quick-sh', 'remote-scripts');

// 支持的源类型
const SOURCE_TYPES = {
  GITHUB: 'github',
  RAW_URL: 'raw_url',
  GIT: 'git'
};

// 确保远程脚本目录存在
async function ensureRemoteScriptsDir() {
  await fs.ensureDir(REMOTE_SCRIPTS_DIR);
}

// 获取所有配置的源
async function getSources() {
  const config = await readConfig();
  return config.sources || {};
}

// 添加新源
async function addSource(name, type, url, options = {}) {
  if (!name || !type || !url) {
    throw new Error(t('remote.sourceNameRequired'));
  }
  
  if (!Object.values(SOURCE_TYPES).includes(type)) {
    throw new Error(t('remote.invalidSourceType', { 
      type, 
      types: Object.values(SOURCE_TYPES).join(', ') 
    }));
  }
  
  const config = await readConfig();
  if (!config.sources) {
    config.sources = {};
  }
  
  config.sources[name] = {
    type,
    url,
    ...options,
    addedAt: new Date().toISOString()
  };
  
  await writeConfig(config);
  console.log(t('remote.sourceAdded', { name }));
}

// 删除源
async function removeSource(name) {
  const config = await readConfig();
  if (!config.sources || !config.sources[name]) {
    throw new Error(t('remote.sourceNotFound', { name }));
  }
  
  delete config.sources[name];
  await writeConfig(config);
  
  // 删除该源下载的脚本
  const sourceDir = path.join(REMOTE_SCRIPTS_DIR, name);
  if (await fs.pathExists(sourceDir)) {
    await fs.remove(sourceDir);
    console.log(t('remote.scriptsDeleted', { name }));
  }
  
  console.log(t('remote.sourceRemoved', { name }));
}

// 列出所有源
async function listSources() {
  const sources = await getSources();
  
  if (Object.keys(sources).length === 0) {
    console.log(t('remote.noSources'));
    return;
  }
  
  console.log('\n' + t('remote.sourcesTitle'));
  console.log('=' .repeat(50));
  
  for (const [name, source] of Object.entries(sources)) {
    console.log('\n' + t('remote.sourceInfo', { name }));
    console.log(t('remote.sourceType', { type: source.type }));
    console.log(t('remote.sourceUrl', { url: source.url }));
    console.log(t('remote.sourceAdded2', { date: new Date(source.addedAt).toLocaleString() }));
    
    // 显示该源下载的脚本数量
    const sourceDir = path.join(REMOTE_SCRIPTS_DIR, name);
    if (await fs.pathExists(sourceDir)) {
      const scripts = await fs.readdir(sourceDir);
      const scriptCount = scripts.filter(f => !f.startsWith('.')).length;
      console.log(t('remote.scriptCount', { count: scriptCount }));
    } else {
      console.log(t('remote.scriptCount', { count: 0 }));
    }
  }
}

// HTTP/HTTPS请求下载文件
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode === 200) {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        downloadFile(response.headers.location).then(resolve).catch(reject);
      } else {
        reject(new Error(t('errors.httpError', { 
          code: response.statusCode, 
          message: response.statusMessage 
        })));
      }
    });
    
    request.on('error', (error) => {
      reject(new Error(t('errors.networkError', { error: error.message })));
    });
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(t('errors.downloadTimeout')));
    });
  });
}

// 从GitHub下载脚本
async function downloadFromGithub(source, scriptPath) {
  const { url, branch = 'main' } = source;
  
  // 解析GitHub URL
  let repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!repoMatch) {
    throw new Error(t('remote.invalidGithubUrl'));
  }
  
  const [, owner, repo] = repoMatch;
  const cleanRepo = repo.replace(/\.git$/, '');
  
  // 构建raw.githubusercontent.com URL
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${branch}/${scriptPath}`;
  
  console.log(t('remote.downloadingFromGithub', { url: rawUrl }));
  return await downloadFile(rawUrl);
}

// 从原始URL下载脚本
async function downloadFromRawUrl(source, scriptPath) {
  const { url } = source;
  const fullUrl = `${url.replace(/\/$/, '')}/${scriptPath}`;
  
  console.log(t('remote.downloadingFromUrl', { url: fullUrl }));
  return await downloadFile(fullUrl);
}

// 下载指定脚本
async function downloadScript(sourceName, scriptPath, localName = null) {
  await ensureRemoteScriptsDir();
  
  const sources = await getSources();
  const source = sources[sourceName];
  
  if (!source) {
    throw new Error(t('remote.sourceNotFound', { name: sourceName }));
  }
  
  let scriptContent;
  
  try {
    switch (source.type) {
      case SOURCE_TYPES.GITHUB:
        scriptContent = await downloadFromGithub(source, scriptPath);
        break;
      case SOURCE_TYPES.RAW_URL:
        scriptContent = await downloadFromRawUrl(source, scriptPath);
        break;
      default:
        throw new Error(`暂不支持源类型: ${source.type}`);
    }
  } catch (error) {
    throw new Error(t('remote.downloadFailed', { error: error.message }));
  }
  
  // 确定本地文件名
  const fileName = localName || path.basename(scriptPath);
  const sourceDir = path.join(REMOTE_SCRIPTS_DIR, sourceName);
  await fs.ensureDir(sourceDir);
  
  const localPath = path.join(sourceDir, fileName);
  
  // 写入文件
  await fs.writeFile(localPath, scriptContent);
  
  // 如果是脚本文件，设置执行权限
  const ext = path.extname(fileName);
  if (['.js', '.sh', '.mjs'].includes(ext)) {
    await fs.chmod(localPath, 0o755);
  }
  
  console.log(t('remote.downloadSuccess', { path: localPath }));
  
  // 返回本地路径用于进一步处理
  return localPath;
}

// 列出已下载的远程脚本
async function listRemoteScripts() {
  await ensureRemoteScriptsDir();
  
  const sources = await getSources();
  let totalScripts = 0;
  
  console.log('\n' + t('remote.remoteScriptsTitle'));
  console.log('=' .repeat(50));
  
  for (const [sourceName, source] of Object.entries(sources)) {
    const sourceDir = path.join(REMOTE_SCRIPTS_DIR, sourceName);
    if (await fs.pathExists(sourceDir)) {
      const files = await fs.readdir(sourceDir);
      const scripts = files.filter(f => !f.startsWith('.'));
      
      if (scripts.length > 0) {
        console.log('\n' + t('remote.sourcePrefix', { name: sourceName, type: source.type }));
        scripts.sort().forEach(script => {
          console.log(t('remote.scriptFile', { script }));
          totalScripts++;
        });
      }
    }
  }
  
  if (totalScripts === 0) {
    console.log(t('remote.noRemoteDownloaded'));
  } else {
    console.log('\n' + t('remote.totalScripts', { count: totalScripts }));
  }
}

// 删除已下载的脚本
async function removeRemoteScript(sourceName, scriptName) {
  const sourceDir = path.join(REMOTE_SCRIPTS_DIR, sourceName);
  const scriptPath = path.join(sourceDir, scriptName);
  
  if (!await fs.pathExists(scriptPath)) {
    throw new Error(t('remote.scriptNotFound', { script: `${sourceName}/${scriptName}` }));
  }
  
  await fs.remove(scriptPath);
  console.log(t('remote.scriptRemoved', { script: `${sourceName}/${scriptName}` }));
  
  // 如果源目录为空，也删除目录
  const remainingFiles = await fs.readdir(sourceDir);
  if (remainingFiles.length === 0) {
    await fs.remove(sourceDir);
  }
}

// 获取远程脚本目录路径（供script-manager使用）
function getRemoteScriptsDir() {
  return REMOTE_SCRIPTS_DIR;
}

// 搜索远程脚本中是否包含指定名称的脚本
async function findRemoteScript(scriptName) {
  await ensureRemoteScriptsDir();
  
  const sources = await getSources();
  
  for (const [sourceName, source] of Object.entries(sources)) {
    const sourceDir = path.join(REMOTE_SCRIPTS_DIR, sourceName);
    if (await fs.pathExists(sourceDir)) {
      const scriptPath = path.join(sourceDir, scriptName);
      
      // 检查完全匹配
      if (await fs.pathExists(scriptPath)) {
        return { sourceName, scriptPath };
      }
      
      // 检查带扩展名的匹配
      const extensions = ['.js', '.sh', '.mjs'];
      for (const ext of extensions) {
        const scriptPathWithExt = `${scriptPath}${ext}`;
        if (await fs.pathExists(scriptPathWithExt)) {
          return { sourceName, scriptPath: scriptPathWithExt };
        }
      }
    }
  }
  
  return null;
}

module.exports = {
  SOURCE_TYPES,
  addSource,
  removeSource,
  listSources,
  downloadScript,
  listRemoteScripts,
  removeRemoteScript,
  getRemoteScriptsDir,
  findRemoteScript,
  getSources
}; 
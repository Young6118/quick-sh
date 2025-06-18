const { t } = require('./i18n');

// 显示帮助信息
function showHelp() {
  console.log(`
🚀 ${t('app.name')}

${t('help.usage')}
  q <script> [args...]    ${t('help.executeScript')}
  q -l                    ${t('help.listScripts')}
  q -path <dir>           ${t('help.setDirectory')}
  q -lang [code]          ${t('help.setLanguage')}
  q -ai [-config/-use]    ${t('help.aiChat')}

${t('help.localScripts')}
  q hello                 ${t('help.runScript', { script: 'hello.js or hello.sh' })}
  q backup /src /dest     ${t('help.runWithArgs')}
  
${t('help.remoteScripts')}
  q --sources             ${t('help.listSources')}
  q --add-source <name> github <url>   ${t('help.addGithubSource')}
  q --download <source> <script>       ${t('help.downloadScript')}
  q --remote-list         ${t('help.listDownloaded')}

${t('help.examples')}
  q -path ~/scripts       ${t('help.setDirectory')}
  q -lang zh              ${t('help.setChineseExample')}
  q -lang                 ${t('help.showLanguageExample')}
  q -ai -config           ${t('help.configureAI')}
  q -ai -use deepseek-v3  ${t('help.useAIModel')}
  q -l                    ${t('help.listScripts')}
  q --add-source utils github https://github.com/user/utils
  q --download utils backup.js
  q backup               ${t('help.executeScript')}

${t('help.configFiles')}
  ~/.quick-sh/config.json           ${t('help.globalConfig')}
  <script-path>/config.json         ${t('help.aliasConfig')}
`);
}

module.exports = {
  showHelp
}; 
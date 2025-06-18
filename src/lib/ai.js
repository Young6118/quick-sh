const readline = require('readline');
const { Configuration, OpenAIApi } = require('openai');
const { t } = require('./i18n');
const { readConfig, writeConfig } = require('./config');

// 对话历史
let conversationHistory = [];

// 创建readline接口
let rl = null;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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

// 预设的模型配置
const PRESET_MODELS = {
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    apiUrl: 'api.openai.com',
    apiPath: '/v1/chat/completions',
    defaultMaxTokens: 1000,
    defaultTemperature: 0.7
  },
  'gpt-4': {
    name: 'GPT-4',
    apiUrl: 'api.openai.com',
    apiPath: '/v1/chat/completions',
    defaultMaxTokens: 1000,
    defaultTemperature: 0.7
  },
  'deepseek-v3': {
    name: 'DeepSeek V3',
    apiUrl: 'api.deepseek.com',
    apiPath: '/v1/chat/completions',
    defaultMaxTokens: 2000,
    defaultTemperature: 0.8
  },
  'claude-3': {
    name: 'Claude 3',
    apiUrl: 'api.anthropic.com',
    apiPath: '/v1/messages',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7
  }
};

// 获取AI配置
async function getAIConfig() {
  const config = await readConfig();
  return config.ai || {};
}

// 保存AI配置
async function saveAIConfig(aiConfig) {
  const config = await readConfig();
  config.ai = aiConfig;
  await writeConfig(config);
}

// 配置AI模型
async function configureAI() {
  console.log(colorize(`\n🤖 ${t('ai.configTitle')}`, 'cyan'));
  console.log('='.repeat(40));
  
  const aiConfig = await getAIConfig();
  
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  return new Promise((resolve) => {
    async function promptConfig() {
      console.log(`\n${t('ai.configOptions')}:`);
      console.log(`[1] ${t('ai.addModel')}`);
      console.log(`[2] ${t('ai.editModel')}`);
      console.log(`[3] ${t('ai.deleteModel')}`);
      console.log(`[4] ${t('ai.showConfig')}`);
      console.log(`[5] ${t('ai.exit')}`);
      
      rl.question(`${t('ai.selectOption')}: `, async (choice) => {
        switch (choice.trim()) {
          case '1':
            await addModel();
            break;
          case '2':
            await editModel();
            break;
          case '3':
            await deleteModel();
            break;
          case '4':
            await showAIConfig();
            break;
          case '5':
            rl.close();
            resolve();
            return;
          default:
            console.log(colorize(`❌ ${t('ai.invalidOption')}`, 'red'));
        }
        promptConfig();
      });
    }
    
    promptConfig();
  });
}

// 添加模型
async function addModel() {
  console.log(`\n${t('ai.presetModels')}:`);
  const presetKeys = Object.keys(PRESET_MODELS);
  presetKeys.forEach((key, index) => {
    console.log(`[${index + 1}] ${key} - ${PRESET_MODELS[key].name}`);
  });
  console.log(`[${presetKeys.length + 1}] ${t('ai.customModel')}`);
  
  return new Promise((resolve) => {
    rl.question(`${t('ai.selectModel')}: `, async (choice) => {
      const index = parseInt(choice) - 1;
      
      if (index >= 0 && index < presetKeys.length) {
        // 使用预设模型
        const modelKey = presetKeys[index];
        const preset = PRESET_MODELS[modelKey];
        
        rl.question(`${t('ai.enterApiKey')}: `, async (apiKey) => {
          if (!apiKey.trim()) {
            console.log(colorize(`❌ ${t('ai.apiKeyRequired')}`, 'red'));
            resolve();
            return;
          }
          
          const aiConfig = await getAIConfig();
          if (!aiConfig.models) aiConfig.models = {};
          
          aiConfig.models[modelKey] = {
            name: preset.name,
            apiKey: apiKey.trim(),
            apiUrl: preset.apiUrl,
            apiPath: preset.apiPath,
            maxTokens: preset.defaultMaxTokens,
            temperature: preset.defaultTemperature,
            model: modelKey
          };
          
          await saveAIConfig(aiConfig);
          console.log(colorize(`✅ ${t('ai.modelAdded', { model: preset.name })}`, 'green'));
          resolve();
        });
      } else if (index === presetKeys.length) {
        // 自定义模型
        await addCustomModel();
        resolve();
      } else {
        console.log(colorize(`❌ ${t('ai.invalidChoice')}`, 'red'));
        resolve();
      }
    });
  });
}

// 添加自定义模型
async function addCustomModel() {
  console.log(`\n${t('ai.customModelConfig')}:`);
  
  return new Promise((resolve) => {
    rl.question(`${t('ai.modelId')}: `, (modelId) => {
      if (!modelId.trim()) {
        console.log(colorize(`❌ ${t('ai.modelIdRequired')}`, 'red'));
        resolve();
        return;
      }
      
      rl.question(`${t('ai.modelName')}: `, (modelName) => {
        rl.question(`${t('ai.apiUrl')}: `, (apiUrl) => {
          rl.question(`${t('ai.apiPath')} [/v1/chat/completions]: `, (apiPath) => {
            rl.question(`${t('ai.enterApiKey')}: `, async (apiKey) => {
              if (!apiKey.trim()) {
                console.log(colorize(`❌ ${t('ai.apiKeyRequired')}`, 'red'));
                resolve();
                return;
              }
              
              const aiConfig = await getAIConfig();
              if (!aiConfig.models) aiConfig.models = {};
              
              aiConfig.models[modelId.trim()] = {
                name: modelName.trim() || modelId.trim(),
                apiKey: apiKey.trim(),
                apiUrl: apiUrl.trim() || 'api.openai.com',
                apiPath: apiPath.trim() || '/v1/chat/completions',
                maxTokens: 1000,
                temperature: 0.7,
                model: modelId.trim()
              };
              
              await saveAIConfig(aiConfig);
              console.log(colorize(`✅ ${t('ai.modelAdded', { model: modelName.trim() || modelId.trim() })}`, 'green'));
              resolve();
            });
          });
        });
      });
    });
  });
}

// 编辑模型
async function editModel() {
  const aiConfig = await getAIConfig();
  if (!aiConfig.models || Object.keys(aiConfig.models).length === 0) {
    console.log(colorize(`❌ ${t('ai.noModelsConfigured')}`, 'red'));
    return;
  }
  
  console.log(`\n${t('ai.configuredModels')}:`);
  const modelKeys = Object.keys(aiConfig.models);
  modelKeys.forEach((key, index) => {
    console.log(`[${index + 1}] ${key} - ${aiConfig.models[key].name}`);
  });
  
  return new Promise((resolve) => {
    rl.question(`${t('ai.selectModelToEdit')}: `, async (choice) => {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < modelKeys.length) {
        const modelKey = modelKeys[index];
        const model = aiConfig.models[modelKey];
        
        console.log(`\n${t('ai.editingModel', { model: model.name })}:`);
        console.log(`${t('ai.currentApiKey')}: ${model.apiKey.substring(0, 8)}...`);
        console.log(`${t('ai.currentMaxTokens')}: ${model.maxTokens}`);
        console.log(`${t('ai.currentTemperature')}: ${model.temperature}`);
        
        rl.question(`${t('ai.newApiKey')} [${t('ai.keepCurrent')}]: `, (newApiKey) => {
          rl.question(`${t('ai.newMaxTokens')} [${model.maxTokens}]: `, (newMaxTokens) => {
            rl.question(`${t('ai.newTemperature')} [${model.temperature}]: `, async (newTemperature) => {
              if (newApiKey.trim()) model.apiKey = newApiKey.trim();
              if (newMaxTokens.trim()) model.maxTokens = parseInt(newMaxTokens.trim()) || model.maxTokens;
              if (newTemperature.trim()) model.temperature = parseFloat(newTemperature.trim()) || model.temperature;
              
              await saveAIConfig(aiConfig);
              console.log(colorize(`✅ ${t('ai.modelUpdated', { model: model.name })}`, 'green'));
              resolve();
            });
          });
        });
      } else {
        console.log(colorize(`❌ ${t('ai.invalidChoice')}`, 'red'));
        resolve();
      }
    });
  });
}

// 删除模型
async function deleteModel() {
  const aiConfig = await getAIConfig();
  if (!aiConfig.models || Object.keys(aiConfig.models).length === 0) {
    console.log(colorize(`❌ ${t('ai.noModelsConfigured')}`, 'red'));
    return;
  }
  
  console.log(`\n${t('ai.configuredModels')}:`);
  const modelKeys = Object.keys(aiConfig.models);
  modelKeys.forEach((key, index) => {
    console.log(`[${index + 1}] ${key} - ${aiConfig.models[key].name}`);
  });
  
  return new Promise((resolve) => {
    rl.question(`${t('ai.selectModelToDelete')}: `, (choice) => {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < modelKeys.length) {
        const modelKey = modelKeys[index];
        const modelName = aiConfig.models[modelKey].name;
        
        rl.question(`${t('ai.confirmDelete', { model: modelName })} (y/N): `, async (confirm) => {
          if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            delete aiConfig.models[modelKey];
            await saveAIConfig(aiConfig);
            console.log(colorize(`✅ ${t('ai.modelDeleted', { model: modelName })}`, 'green'));
          } else {
            console.log(colorize(`❌ ${t('ai.deleteCancelled')}`, 'yellow'));
          }
          resolve();
        });
      } else {
        console.log(colorize(`❌ ${t('ai.invalidChoice')}`, 'red'));
        resolve();
      }
    });
  });
}

// 显示AI配置
async function showAIConfig() {
  const aiConfig = await getAIConfig();
  
  console.log(colorize(`\n⚙️  ${t('ai.currentConfig')}`, 'yellow'));
  console.log('='.repeat(40));
  
  if (!aiConfig.models || Object.keys(aiConfig.models).length === 0) {
    console.log(colorize(`❌ ${t('ai.noModelsConfigured')}`, 'red'));
    console.log(`💡 ${t('ai.useConfigCommand')}`);
    return;
  }
  
  console.log(`${t('ai.configuredModels')}:`);
  Object.entries(aiConfig.models).forEach(([key, model]) => {
    console.log(`  • ${key} - ${model.name}`);
    console.log(`    ${t('ai.apiUrl')}: ${model.apiUrl}`);
    console.log(`    ${t('ai.apiKey')}: ${model.apiKey.substring(0, 8)}...`);
    console.log(`    ${t('ai.maxTokens')}: ${model.maxTokens}`);
    console.log(`    ${t('ai.temperature')}: ${model.temperature}`);
  });
  
  if (aiConfig.defaultModel) {
    console.log(`\n${t('ai.defaultModel')}: ${aiConfig.defaultModel}`);
  }
}

// 选择模型进行对话
async function selectModel(modelName = null) {
  const aiConfig = await getAIConfig();
  
  if (!aiConfig.models || Object.keys(aiConfig.models).length === 0) {
    console.log(colorize(`❌ ${t('ai.noModelsConfigured')}`, 'red'));
    console.log(`💡 ${t('ai.useConfigCommand')}`);
    return;
  }
  
  let selectedModel = null;
  
  if (modelName) {
    // 直接使用指定的模型
    if (aiConfig.models[modelName]) {
      selectedModel = aiConfig.models[modelName];
      selectedModel.key = modelName;
    } else {
      console.log(colorize(`❌ ${t('ai.modelNotFound', { model: modelName })}`, 'red'));
      return;
    }
  } else {
    // 显示选择菜单
    console.log(colorize(`\n🤖 ${t('ai.selectModelTitle')}`, 'cyan'));
    console.log('='.repeat(40));
    
    const modelKeys = Object.keys(aiConfig.models);
    modelKeys.forEach((key, index) => {
      const isDefault = aiConfig.defaultModel === key;
      const marker = isDefault ? ' ← default' : '';
      console.log(`[${index + 1}] ${key} - ${aiConfig.models[key].name}${marker}`);
    });
    
    if (!rl) {
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    return new Promise((resolve) => {
      rl.question(`${t('ai.selectOption')}: `, (choice) => {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < modelKeys.length) {
          const modelKey = modelKeys[index];
          selectedModel = aiConfig.models[modelKey];
          selectedModel.key = modelKey;
          
          // 设置为默认模型
          aiConfig.defaultModel = modelKey;
          saveAIConfig(aiConfig);
          
          startChat(selectedModel);
          resolve();
        } else {
          console.log(colorize(`❌ ${t('ai.invalidChoice')}`, 'red'));
          resolve();
        }
      });
    });
  }
  
  if (selectedModel) {
    startChat(selectedModel);
  }
}

// 开始聊天
function startChat(model) {
  console.log(colorize(`\n🚀 ${t('ai.chatStarted', { model: model.name })}`, 'cyan'));
  console.log('='.repeat(50));
  console.log(`${t('ai.chatInstructions')}`);
  console.log(`${t('ai.availableCommands')}:`);
  console.log(`  /help     - ${t('ai.showHelp')}`);
  console.log(`  /clear    - ${t('ai.clearHistory')}`);
  console.log(`  /history  - ${t('ai.showHistory')}`);
  console.log(`  /config   - ${t('ai.showCurrentConfig')}`);
  console.log(`  /exit     - ${t('ai.exitChat')}`);
  console.log('');
  
  conversationHistory = [];
  
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  function promptUser() {
    rl.question(colorize(`💬 ${t('ai.you')}: `, 'green'), (input) => handleUserInput(input, model, promptUser));
  }
  
  // 处理进程退出信号
  process.on('SIGINT', () => {
    console.log(colorize(`\n\n👋 ${t('ai.goodbye')}`, 'yellow'));
    rl.close();
    process.exit(0);
  });
  
  promptUser();
}

// 处理用户输入
async function handleUserInput(input, model, promptCallback) {
  const trimmed = input.trim();
  
  // 处理命令
  if (trimmed.startsWith('/')) {
    const command = trimmed.toLowerCase();
    
    switch (command) {
      case '/help':
        showChatHelp();
        break;
      case '/clear':
        clearHistory();
        break;
      case '/history':
        showHistory();
        break;
      case '/config':
        showModelConfig(model);
        break;
      case '/exit':
      case '/quit':
        console.log(colorize(`\n👋 ${t('ai.goodbye')}`, 'yellow'));
        rl.close();
        return;
      default:
        console.log(colorize(`❌ ${t('ai.unknownCommand', { command })}`, 'red'));
        console.log(`${t('ai.typeHelp')}`);
    }
    
    promptCallback();
    return;
  }
  
  // 处理空输入
  if (!trimmed) {
    promptCallback();
    return;
  }
  
  // 添加用户消息到历史
  conversationHistory.push({ role: 'user', content: trimmed });
  
  try {
    console.log(colorize(`\n🤔 ${t('ai.thinking')}`, 'yellow'));
    
    // 调用AI API
    const response = await callAI(conversationHistory, model);
    
    if (response && response.choices && response.choices.length > 0) {
      const aiMessage = response.choices[0].message.content;
      
      // 添加AI回复到历史
      conversationHistory.push({ role: 'assistant', content: aiMessage });
      
      // 显示AI回复
      console.log(colorize(`\n🤖 ${model.name}:`, 'blue'));
      console.log(aiMessage);
      console.log('');
    } else {
      console.log(colorize(`❌ ${t('ai.noResponse')}`, 'red'));
    }
  } catch (error) {
    console.log(colorize(`❌ ${t('ai.error', { error: error.message })}`, 'red'));
    // 如果API调用失败，移除最后添加的用户消息
    conversationHistory.pop();
  }
  
  promptCallback();
}

// 调用AI API
async function callAI(messages, model) {
  try {
    // 构建基础URL
    let basePath = model.apiUrl;
    if (!basePath.startsWith('http://') && !basePath.startsWith('https://')) {
      basePath = `https://${basePath}`;
    }
    
    // 创建 OpenAI 配置
    const configuration = new Configuration({
      apiKey: model.apiKey,
      basePath: basePath,
    });
    
    // 创建 OpenAI API 实例
    const openai = new OpenAIApi(configuration);

    // 调用 chat completions API
    const response = await openai.createChatCompletion({
      model: model.model,
      messages: messages,
      max_tokens: model.maxTokens,
      temperature: model.temperature,
    });

    return response.data;
  } catch (error) {
    // 处理不同类型的错误
    if (error.code === 'ENOTFOUND') {
      throw new Error(`${t('ai.connectionError')}: ${error.message}`);
    } else if (error.response && error.response.status) {
      throw new Error(`${t('ai.apiError')}: ${error.response.status} - ${error.response.statusText}`);
    } else {
      throw new Error(`${t('ai.error', { error: error.message })}`);
    }
  }
}

// 显示聊天帮助
function showChatHelp() {
  console.log(colorize(`\n🤖 ${t('ai.chatHelp')}`, 'cyan'));
  console.log('='.repeat(35));
  console.log(`${t('ai.availableCommands')}:`);
  console.log(`  /help     - ${t('ai.showHelp')}`);
  console.log(`  /clear    - ${t('ai.clearHistory')}`);
  console.log(`  /history  - ${t('ai.showHistory')}`);
  console.log(`  /config   - ${t('ai.showCurrentConfig')}`);
  console.log(`  /exit     - ${t('ai.exitChat')}`);
  console.log('');
  console.log(`${t('ai.justTypeMessage')}`);
  console.log('');
}

// 显示模型配置
function showModelConfig(model) {
  console.log(colorize(`\n⚙️  ${t('ai.currentModelConfig')}`, 'yellow'));
  console.log('='.repeat(30));
  console.log(`${t('ai.modelName')}: ${model.name}`);
  console.log(`${t('ai.modelId')}: ${model.model}`);
  console.log(`${t('ai.maxTokens')}: ${model.maxTokens}`);
  console.log(`${t('ai.temperature')}: ${model.temperature}`);
  console.log(`${t('ai.apiKey')}: ${model.apiKey.substring(0, 8)}...`);
  console.log('');
}

// 显示对话历史
function showHistory() {
  console.log(colorize(`\n📜 ${t('ai.conversationHistory')}`, 'magenta'));
  console.log('='.repeat(30));
  if (conversationHistory.length === 0) {
    console.log(t('ai.noHistory'));
  } else {
    conversationHistory.forEach((msg, index) => {
      const role = msg.role === 'user' ? colorize(t('ai.you'), 'green') : colorize('AI', 'blue');
      console.log(`${index + 1}. ${role}: ${msg.content}`);
    });
  }
  console.log('');
}

// 清除对话历史
function clearHistory() {
  conversationHistory = [];
  console.log(colorize(`✅ ${t('ai.historyCleared')}`, 'green'));
}

module.exports = {
  configureAI,
  selectModel,
  showAIConfig,
  getAIConfig,
  saveAIConfig
}; 
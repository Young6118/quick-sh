#!/usr/bin/env node
// Description: AI chat tool for command-line conversations with OpenAI API

const readline = require('readline');
const https = require('https');

// 配置
const CONFIG = {
  // 可以通过环境变量或者直接配置API key
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
  apiUrl: 'api.openai.com',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7
};

// 对话历史
let conversationHistory = [];

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// 调用OpenAI API
function callOpenAI(messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: CONFIG.model,
      messages: messages,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature
    });

    const options = {
      hostname: CONFIG.apiUrl,
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 显示帮助信息
function showHelp() {
  console.log(colorize('\n🤖 AI Chat Demo - Help', 'cyan'));
  console.log('=====================================');
  console.log('Commands:');
  console.log('  /help     - Show this help message');
  console.log('  /clear    - Clear conversation history');
  console.log('  /history  - Show conversation history');
  console.log('  /config   - Show current configuration');
  console.log('  /exit     - Exit the chat');
  console.log('  /quit     - Exit the chat');
  console.log('');
  console.log('Just type your message and press Enter to chat with AI.');
  console.log('');
}

// 显示配置信息
function showConfig() {
  console.log(colorize('\n⚙️  Current Configuration', 'yellow'));
  console.log('========================');
  console.log(`Model: ${CONFIG.model}`);
  console.log(`Max Tokens: ${CONFIG.maxTokens}`);
  console.log(`Temperature: ${CONFIG.temperature}`);
  console.log(`API Key: ${CONFIG.apiKey ? CONFIG.apiKey.substring(0, 8) + '...' : 'Not set'}`);
  console.log('');
}

// 显示对话历史
function showHistory() {
  console.log(colorize('\n📜 Conversation History', 'magenta'));
  console.log('========================');
  if (conversationHistory.length === 0) {
    console.log('No conversation history yet.');
  } else {
    conversationHistory.forEach((msg, index) => {
      const role = msg.role === 'user' ? colorize('You', 'green') : colorize('AI', 'blue');
      console.log(`${index + 1}. ${role}: ${msg.content}`);
    });
  }
  console.log('');
}

// 清除对话历史
function clearHistory() {
  conversationHistory = [];
  console.log(colorize('✅ Conversation history cleared.', 'green'));
}

// 处理用户输入
async function handleUserInput(input) {
  const trimmed = input.trim();
  
  // 处理命令
  if (trimmed.startsWith('/')) {
    const command = trimmed.toLowerCase();
    
    switch (command) {
      case '/help':
        showHelp();
        break;
      case '/clear':
        clearHistory();
        break;
      case '/history':
        showHistory();
        break;
      case '/config':
        showConfig();
        break;
      case '/exit':
      case '/quit':
        console.log(colorize('\n👋 Goodbye!', 'yellow'));
        rl.close();
        return;
      default:
        console.log(colorize(`❌ Unknown command: ${command}`, 'red'));
        console.log('Type /help for available commands.');
    }
    
    promptUser();
    return;
  }
  
  // 处理空输入
  if (!trimmed) {
    promptUser();
    return;
  }
  
  // 检查API key
  if (!CONFIG.apiKey || CONFIG.apiKey === 'your-api-key-here') {
    console.log(colorize('❌ Error: OpenAI API key not configured.', 'red'));
    console.log('Please set your API key using one of these methods:');
    console.log('1. Environment variable: export OPENAI_API_KEY=your_key_here');
    console.log('2. Edit the script and replace "your-api-key-here" with your actual key');
    promptUser();
    return;
  }
  
  // 添加用户消息到历史
  conversationHistory.push({ role: 'user', content: trimmed });
  
  try {
    console.log(colorize('\n🤔 AI is thinking...', 'yellow'));
    
    // 调用AI API
    const response = await callOpenAI(conversationHistory);
    
    if (response.choices && response.choices.length > 0) {
      const aiMessage = response.choices[0].message.content;
      
      // 添加AI回复到历史
      conversationHistory.push({ role: 'assistant', content: aiMessage });
      
      // 显示AI回复
      console.log(colorize('\n🤖 AI:', 'blue'));
      console.log(aiMessage);
      console.log('');
    } else {
      console.log(colorize('❌ No response from AI', 'red'));
    }
  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, 'red'));
    // 如果API调用失败，移除最后添加的用户消息
    conversationHistory.pop();
  }
  
  promptUser();
}

// 提示用户输入
function promptUser() {
  rl.question(colorize('💬 You: ', 'green'), handleUserInput);
}

// 主函数
function main() {
  console.log(colorize('🚀 AI Chat Demo', 'cyan'));
  console.log('================');
  console.log('Welcome to the AI Chat Demo!');
  console.log('Type /help for commands or just start chatting.');
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--config')) {
    showConfig();
    process.exit(0);
  }
  
  // 如果有直接的消息参数，处理它
  if (args.length > 0 && !args[0].startsWith('-')) {
    const directMessage = args.join(' ');
    console.log(colorize(`\n💬 You: ${directMessage}`, 'green'));
    handleUserInput(directMessage);
    return;
  }
  
  console.log('');
  promptUser();
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Goodbye!', 'yellow'));
  rl.close();
  process.exit(0);
});

// 启动程序
if (require.main === module) {
  main();
} 
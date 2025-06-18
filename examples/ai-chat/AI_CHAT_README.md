# AI Chat Demo 使用说明

这是一个基于OpenAI API的命令行AI聊天工具demo，支持多轮对话。

## 功能特点

🤖 **智能对话**: 基于OpenAI GPT模型的AI对话  
💬 **多轮聊天**: 支持上下文连续对话  
🎨 **彩色输出**: 美观的命令行界面  
⚙️ **灵活配置**: 支持多种配置方式  
📜 **历史记录**: 查看和管理对话历史  

## 安装和配置

### 1. 获取OpenAI API Key

前往 [OpenAI官网](https://platform.openai.com/api-keys) 获取您的API密钥。

### 2. 配置API Key

有两种方式配置API Key：

**方法1: 环境变量（推荐）**
```bash
export OPENAI_API_KEY=your_actual_api_key_here
```

**方法2: 直接修改脚本**
编辑 `ai-chat.js` 文件，将 `your-api-key-here` 替换为您的实际API key。

## 使用方法

### 基本用法

```bash
# 启动交互式聊天
q ai

# 或者
q ai-chat

# 发送单条消息（非交互模式）
q ai "你好，介绍一下你自己"
```

### 交互式命令

在聊天模式下，您可以使用以下命令：

| 命令 | 功能 |
|------|------|
| `/help` | 显示帮助信息 |
| `/clear` | 清除对话历史 |
| `/history` | 查看对话历史 |
| `/config` | 显示当前配置 |
| `/exit` 或 `/quit` | 退出聊天 |

### 命令行参数

```bash
# 显示帮助
q ai --help

# 显示配置信息
q ai --config
```

## 使用示例

### 示例1: 基本对话
```bash
$ q ai
🚀 AI Chat Demo
================
Welcome to the AI Chat Demo!
Type /help for commands or just start chatting.

💬 You: 你好
🤔 AI is thinking...

🤖 AI:
你好！我是Claude，一个由Anthropic开发的AI助手。很高兴和你聊天！有什么我可以帮助你的吗？

💬 You: 请介绍一下JavaScript的闭包概念
🤔 AI is thinking...

🤖 AI:
闭包（Closure）是JavaScript中一个重要且强大的概念。简单来说，闭包是指函数能够访问其外部作用域中变量的能力，即使在外部函数已经执行完毕之后。

[详细回答会继续...]

💬 You: /exit
👋 Goodbye!
```

### 示例2: 单条消息模式
```bash
$ q ai "请写一个快速排序的JavaScript实现"
💬 You: 请写一个快速排序的JavaScript实现
🤔 AI is thinking...

🤖 AI:
下面是一个JavaScript快速排序的实现：

```javascript
function quickSort(arr) {
  // 基础情况：数组长度小于等于1时直接返回
  if (arr.length <= 1) {
    return arr;
  }
  
  // 选择基准元素（这里选择中间元素）
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];
  
  // 分割数组
  const left = [];
  const right = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (i === pivotIndex) continue;
    
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  
  // 递归排序并合并结果
  return [...quickSort(left), pivot, ...quickSort(right)];
}

// 使用示例
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("原数组:", numbers);
console.log("排序后:", quickSort(numbers));
```

[更多解释...]
```

## 配置选项

可以在脚本中修改以下配置：

```javascript
const CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
  apiUrl: 'api.openai.com',
  model: 'gpt-3.5-turbo',        // 使用的模型
  maxTokens: 1000,               // 最大token数
  temperature: 0.7               // 创造性参数 (0-1)
};
```

## 故障排除

### 常见问题

**1. "OpenAI API key not configured" 错误**
- 确保已正确设置 `OPENAI_API_KEY` 环境变量
- 或者在脚本中直接配置API key

**2. API调用失败**
- 检查网络连接
- 确认API key是否有效
- 检查API额度是否已用完

**3. "Command not found: q" 错误**
- 确保已经运行 `npm link` 创建全局链接
- 确保已经设置脚本路径：`q -path examples`

### 调试技巧

```bash
# 查看当前配置
q ai --config

# 查看脚本是否正确链接
q -list

# 手动运行脚本进行调试
node examples/ai-chat.js
```

## 注意事项

⚠️ **API费用**: OpenAI API是按使用量收费的，请注意控制使用量  
🔐 **安全**: 不要将API key提交到代码仓库中  
🌐 **网络**: 需要稳定的网络连接访问OpenAI API  
📱 **兼容性**: 需要Node.js 14+环境  

## 扩展建议

您可以根据需要扩展这个demo：

- 添加更多AI模型支持（如Claude、Google Bard等）
- 实现对话历史的持久化存储
- 添加流式响应支持
- 集成语音输入/输出
- 添加插件系统

## 许可证

此demo遵循MIT许可证。 
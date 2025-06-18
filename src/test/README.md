# quick sh 测试

本目录包含了 quick sh 的完整模块化测试套件。

## 🧪 测试架构

测试已重构为模块化架构，包含以下测试套件：

- **基础功能测试** (`basic.test.js`) - 核心命令和基本功能
- **脚本执行测试** (`script-execution.test.js`) - JavaScript、Shell脚本执行
- **别名配置测试** (`alias.test.js`) - 各种别名配置场景
- **错误处理测试** (`error-handling.test.js`) - 异常情况处理
- **配置管理测试** (`config.test.js`) - 配置文件管理

## 🚀 运行测试

### 运行所有测试

```bash
npm test
# 或
node test/run-all.js
```

### 运行特定测试套件

```bash
npm run test:basic          # 基础功能测试
npm run test:script         # 脚本执行测试
npm run test:alias          # 别名配置测试
npm run test:error          # 错误处理测试
npm run test:config         # 配置管理测试
```

### 查看测试选项

```bash
npm run test:help
# 或
node test/run-all.js --help
```

### 运行旧版测试（兼容性）

```bash
npm run test:legacy
```

## 📊 测试覆盖范围

### 基础功能测试 (7个测试)
- ✅ q命令可用性检查
- ✅ 脚本路径设置
- ✅ 状态列表查看
- ✅ help命令功能
- ✅ 命令别名功能
- ✅ 无参数默认行为

### 脚本执行测试 (10个测试)
- ✅ JavaScript脚本执行（有/无参数）
- ✅ Shell脚本执行（有/无参数）
- ✅ 目录脚本执行
- ✅ 特殊字符参数处理
- ✅ 空格参数处理
- ✅ 文件扩展名自动识别

### 别名配置测试 (11个测试)
- ✅ 相对路径alias配置
- ✅ 绝对路径alias配置
- ✅ 系统命令alias配置
- ✅ 复杂参数传递
- ✅ 优先级测试
- ✅ 用户脚本与内置命令区分
- ✅ git工具、AI聊天等实际应用

### 错误处理测试 (10个测试)
- ✅ 不存在脚本/alias处理
- ✅ 错误路径设置处理
- ✅ 系统命令回退机制
- ✅ 特殊字符脚本名处理
- ✅ 路径遍历攻击防护
- ✅ 各种边界情况

### 配置管理测试 (10个测试)
- ✅ 配置文件路径解析
- ✅ 相对/绝对路径配置
- ✅ 配置持久化
- ✅ 配置文件格式验证
- ✅ alias配置读取
- ✅ 无配置默认行为

## 🛠️ 测试工具

### 测试工具函数 (`test-utils.js`)

提供了共用的测试工具函数：
- `execCommand()` - 执行命令并返回结果
- `runTestSuite()` - 运行测试套件
- `checkLink()` - 检查npm link状态
- `createTempConfig()` - 创建临时配置
- 彩色输出函数

### 集成测试运行器 (`run-all.js`)

- 运行所有测试套件
- 生成综合测试报告
- 提供测试选项帮助
- 支持单独测试套件运行

## 📋 测试要求

- **必须先运行** `npm link` 来创建全局 `q` 命令链接
- **Node.js** 14.0.0 或更高版本
- **可选**: 设置测试脚本路径到 `examples` 目录

## 🔧 手动测试

如果自动化测试有问题，可以手动测试：

```bash
# 设置测试环境
q -path examples

# 基础功能测试
q -list
q -help
q --version

# 脚本执行测试
q test-args
q test-args hello world "with spaces"
q test-args.sh param1 param2
q test-dir arg1 arg2

# 别名配置测试
q py --version
q chat --help
q w node
q echo "Hello World"

# 错误处理测试
q non-existent-script
q ../../../etc/passwd
```

## 📈 测试报告示例

```
🧪 quick sh 完整测试套件
============================================================

🧪 基础功能 测试开始
==================================================
ℹ️  [1/7] 运行测试: 检查q命令是否可用
✅ q命令版本检查通过
...

📊 总测试报告
============================================================
✅ 基础功能: 7 通过, 0 失败
✅ 脚本执行: 10 通过, 0 失败
✅ 别名配置: 11 通过, 0 失败
✅ 错误处理: 10 通过, 0 失败
✅ 配置管理: 10 通过, 0 失败
============================================================
🎯 总计: 48 通过, 0 失败
🎉 所有测试通过！
```

## 🐛 问题排查

如果测试失败：

1. **检查npm link**: `which q` 应该有输出
2. **检查Node版本**: `node --version` 应该 >= 14.0.0
3. **检查权限**: 确保有执行脚本的权限
4. **查看错误信息**: 测试会显示详细的错误信息
5. **手动验证**: 使用上面的手动测试命令验证功能

## 🔄 CI/CD 集成

在CI/CD环境中运行测试：

```bash
# 安装依赖
npm install

# 创建全局链接
npm link

# 运行测试
npm test
``` 
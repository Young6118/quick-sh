# Examples 目录结构

本目录包含了Quick Shell的示例脚本，按功能分类组织。

## 目录结构

```
examples/
├── config.json              # 别名配置文件
├── README.md                 # 本文档
├── ai-chat/                  # AI聊天工具
│   ├── ai-chat.js            # AI聊天脚本
│   └── AI_CHAT_README.md     # AI聊天使用说明
├── git-tools/                # Git相关工具
│   ├── git-commit.js         # 交互式commit助手
│   ├── setup-git-hooks.js    # Git hooks设置工具
│   └── GIT_COMMIT_README.md  # Git工具使用说明
├── deploy/                   # 部署相关工具
│   └── index.js              # 部署脚本示例
├── test-scripts/             # 测试脚本
│   ├── test-args.js          # JavaScript参数测试
│   ├── test-args.sh          # Shell参数测试
│   └── test-dir/             # 目录脚本测试
│       └── index.js
└── utils/                    # 工具脚本
    ├── backup.sh             # 备份脚本
    ├── hello.js              # Hello示例
    └── help.js               # Help示例
```

## 快速使用

### 1. 设置脚本路径
```bash
q -path examples
```

### 2. 可用的命令别名

#### AI聊天工具
```bash
q ai                    # 启动AI聊天
q ai-chat               # 启动AI聊天（同上）
```

#### Git工具
```bash
q commit                # 交互式创建commit
q setup-hooks           # 设置git hooks
q git-account           # Git账号管理工具
```

#### NPM工具
```bash
q npm-version           # NPM版本管理工具
```

#### 部署工具
```bash
q chat                  # 运行部署脚本
```

#### 工具脚本
```bash
q backup                # 备份脚本
q hello                 # Hello示例
q help                  # Help示例
```

#### 测试脚本
```bash
q test-args             # JavaScript参数测试
q test-args-sh          # Shell参数测试
q test-dir              # 目录脚本测试
```

#### 系统命令别名
```bash
q py                    # Python3
q w                     # which命令
q echo                  # echo命令
```

### 3. 查看状态
```bash
q -list                 # 查看可用脚本列表
```

## 工具说明

### 🤖 AI聊天工具 (ai-chat/)
基于OpenAI API的命令行AI聊天工具，支持多轮对话。
- 详细说明：[AI_CHAT_README.md](ai-chat/AI_CHAT_README.md)

### 🔧 Git工具 (git-tools/)
Git commit规范助手、hooks设置工具和多账号管理工具。
- Commit助手说明：[GIT_COMMIT_README.md](git-tools/GIT_COMMIT_README.md)
- 账号管理说明：[GIT_ACCOUNT_README.md](git-tools/GIT_ACCOUNT_README.md)

### 📦 NPM工具 (npm-tools/)
NPM包版本管理工具，支持自动化版本更新和changelog生成。
- 版本管理说明：[NPM_VERSION_README.md](npm-tools/NPM_VERSION_README.md)

### 🚀 部署工具 (deploy/)
部署脚本示例，展示如何处理部署流程。

### 🧪 测试脚本 (test-scripts/)
用于测试Quick Shell功能的各种脚本。

### 🛠️ 工具脚本 (utils/)
常用的工具脚本示例。

## 自定义配置

您可以编辑 `config.json` 文件来：
- 添加新的别名
- 修改现有路径
- 添加系统命令别名

配置格式：
```json
{
  "aliases": {
    "自定义命令": {
      "bin": "./path/to/script.js"
    },
    "系统命令别名": "系统命令"
  }
}
```

## 开发和扩展

1. 在相应的功能目录下添加新脚本
2. 更新 `config.json` 中的别名配置
3. 添加必要的使用说明文档
4. 确保脚本有执行权限 (`chmod +x`)

## 注意事项

- 所有路径都是相对于 `examples` 目录的
- JavaScript脚本需要添加 `#!/usr/bin/env node` shebang
- Shell脚本需要添加 `#!/bin/sh` 或 `#!/bin/bash` shebang
- 建议为复杂工具创建对应的README文档 
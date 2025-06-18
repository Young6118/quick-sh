# Git Commit 规范助手

这套工具帮助团队保持一致的Git commit message规范，基于[Conventional Commits](https://www.conventionalcommits.org/)标准。

## 功能特点

🔧 **交互式Commit**: 通过问答方式创建规范的commit message  
🔍 **自动验证**: Git hooks自动验证commit message格式  
📝 **模板支持**: 提供commit message模板和提示  
✨ **类型完整**: 支持所有标准的commit类型  
🎨 **彩色界面**: 美观的命令行交互体验  

## 工具组成

### 1. `git-commit.js` - 交互式Commit助手
交互式创建和验证commit message的主要工具。

### 2. `setup-git-hooks.js` - Git Hooks设置工具
自动安装git hooks来验证commit message规范。

## 快速开始

### 1. 安装Git Hooks（推荐）

```bash
# 在你的项目根目录运行
q setup-hooks
```

这将安装两个git hooks：
- `commit-msg`: 验证commit message格式
- `prepare-commit-msg`: 提供commit message模板

### 2. 交互式创建Commit

```bash
# 先添加要提交的文件
git add .

# 使用交互式助手创建commit
q commit
```

## 详细使用指南

### 交互式Commit工具

#### 基本用法
```bash
q commit                        # 启动交互式commit创建
q commit --help                 # 显示帮助信息
q commit --types                # 显示所有commit类型
q commit --validate "feat: add new feature"  # 验证commit message
```

#### 交互流程示例
```bash
$ q commit
🚀 Git Commit 助手
==================
📁 暂存的文件:
  • examples/git-commit.js
  • examples/config.json

📝 选择Commit类型:
================================
1. ✨ feat - 新功能 (feature)
2. 🐛 fix - 修复问题 (bug fix)
3. 📚 docs - 文档更新 (documentation)
4. 💄 style - 代码格式调整 (formatting, missing semi colons, etc)
5. ♻️ refactor - 代码重构 (refactoring production code)
6. ⚡ perf - 性能优化 (performance)
7. ✅ test - 测试相关 (adding tests, refactoring tests)
8. 🔧 build - 构建系统 (build system or external dependencies)
9. 👷 ci - CI配置 (continuous integration)
10. 🔨 chore - 其他杂项 (updating grunt tasks etc)
11. ⏪ revert - 回滚提交 (revert previous commit)

请选择commit类型 (1-11): 1

💡 作用域建议 (可选):
=====================
api, ui, database, config
auth, utils, components, services
middleware, router, models, views
tests, docs, scripts, deps

请输入作用域 (可选，直接回车跳过): git
请输入简短描述 (必填): add interactive commit helper
是否为破坏性变更? (y/N): n
请输入详细描述 (可选): 
请输入关联的issue (可选，如: #123, #456): 

📋 生成的Commit Message:
=============================
feat(git): add interactive commit helper

确认提交? (Y/n): y
✅ 提交成功!
```

### Git Hooks设置工具

#### 基本用法
```bash
q setup-hooks                  # 安装git hooks
q setup-hooks --check          # 检查hooks状态
q setup-hooks --remove         # 移除hooks
q setup-hooks --help           # 显示帮助
```

#### 安装示例
```bash
$ q setup-hooks
🔧 安装Git Hooks
================
✅ commit-msg hook 安装成功
✅ prepare-commit-msg hook 安装成功

🎉 所有Git hooks安装成功！

现在你的提交将自动验证commit message格式。
使用 "q commit" 来交互式创建规范的commit message。
```

#### 状态检查
```bash
$ q setup-hooks --check
📋 Git Hooks 状态检查
====================
已安装的hooks:
  ✅ commit-msg
  ✅ prepare-commit-msg
```

## Conventional Commits 规范

### 格式标准
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 支持的类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | ✨ 新功能 | `feat(auth): add OAuth2 login` |
| `fix` | 🐛 修复问题 | `fix(api): resolve validation error` |
| `docs` | 📚 文档更新 | `docs: update installation guide` |
| `style` | 💄 代码格式 | `style: fix indentation` |
| `refactor` | ♻️ 代码重构 | `refactor(utils): simplify helper functions` |
| `perf` | ⚡ 性能优化 | `perf(db): optimize query performance` |
| `test` | ✅ 测试相关 | `test: add unit tests for user service` |
| `build` | 🔧 构建系统 | `build: update webpack config` |
| `ci` | 👷 CI配置 | `ci: add automated testing workflow` |
| `chore` | 🔨 其他杂项 | `chore: update dependencies` |
| `revert` | ⏪ 回滚提交 | `revert: revert previous feature` |

### 作用域建议

常用的作用域包括：
- `api` - API相关
- `ui` - 用户界面
- `auth` - 认证授权
- `database` - 数据库
- `config` - 配置文件
- `utils` - 工具函数
- `tests` - 测试
- `docs` - 文档

### 破坏性变更

使用 `!` 标记破坏性变更：
```
feat!: remove deprecated API endpoints
feat(api)!: change user authentication method
```

## 示例Commit Messages

### 基本示例
```bash
# 新功能
feat(auth): add two-factor authentication

# 修复问题  
fix(parser): handle edge case in URL parsing

# 文档更新
docs: add API documentation for user endpoints

# 性能优化
perf(database): optimize user query with indexing

# 破坏性变更
feat!: remove support for IE11
```

### 完整示例
```bash
feat(shopping-cart): add discount code functionality

Allow users to apply discount codes during checkout.
Supports percentage and fixed-amount discounts.

Closes: #123, #456
```

## 验证规则

commit message会自动验证以下规则：

✅ **格式验证**: 必须符合 `<type>[scope]: <description>` 格式  
✅ **类型验证**: type必须是支持的类型之一  
✅ **长度检查**: 主题行建议不超过72个字符  
✅ **格式规范**: 主题行不应以句号结尾  
⚠️ **空行检查**: 主题行和正文之间应有空行  

## 团队使用建议

### 1. 项目初始化
```bash
# 在项目根目录运行
q setup-hooks

# 提交hooks配置
git add .githooks/
git commit -m "chore: add git commit hooks for conventional commits"
```

### 2. 团队规范
- 所有提交都应该使用 `q commit` 进行交互式创建
- 重要功能和修复必须包含详细的描述
- 破坏性变更必须在commit message中明确标注
- 关联相关的issue和PR编号

### 3. 自动化集成
可以与以下工具集成：
- **semantic-release**: 自动版本管理和发布
- **conventional-changelog**: 自动生成CHANGELOG
- **commitizen**: 命令行commit工具
- **husky**: Git hooks管理

## 故障排除

### 常见问题

**1. Hook安装失败**
```bash
# 检查是否在git仓库中
git status

# 手动创建hooks目录
mkdir -p .git/hooks

# 重新安装
q setup-hooks
```

**2. Commit被拒绝**
```bash
# 检查commit message格式
q commit --validate "your commit message"

# 使用交互式工具重新创建
q commit
```

**3. Hook不生效**
```bash
# 检查hook状态
q setup-hooks --check

# 检查hook文件权限
ls -la .git/hooks/commit-msg
```

### 调试技巧

```bash
# 验证特定commit message
q commit --validate "feat(api): add new endpoint"

# 查看所有commit类型
q commit --types

# 手动测试hook
echo "invalid commit" | .git/hooks/commit-msg
```

## 扩展配置

你可以根据项目需要自定义：

1. **修改支持的类型**: 编辑 `git-commit.js` 中的 `COMMIT_TYPES`
2. **自定义作用域**: 编辑 `SCOPES_SUGGESTIONS` 数组
3. **调整验证规则**: 修改 `validateCommitMessage` 函数
4. **自定义模板**: 编辑 `setup-git-hooks.js` 中的模板内容

## 相关资源

- [Conventional Commits 官方规范](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)
- [Semantic Versioning](https://semver.org/)
- [Git Hooks 文档](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) 
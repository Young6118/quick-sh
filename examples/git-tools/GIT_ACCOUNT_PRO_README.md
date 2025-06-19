# Git Account Pro - 完美的Git账号自动化管理工具

## 🌟 概述

Git Account Pro 是基于原有 `git-account` 工具扩展开发的完美Git账号自动化管理工具，提供智能账号切换、SSH密钥管理、规则自动化等高级功能。

## ✨ 核心特性

### 🧠 智能自动切换
- **目录规则**: 根据项目目录自动切换账号
- **域名规则**: 根据Git仓库域名自动选择账号
- **仓库规则**: 支持特定仓库的账号绑定
- **上下文感知**: 自动检测当前Git环境并推荐合适账号

### 🔐 SSH密钥管理
- **自动生成**: 为每个账号自动生成SSH密钥对
- **配置管理**: 自动更新SSH config文件
- **密钥状态**: 实时显示所有账号的SSH密钥状态
- **公钥展示**: 一键显示公钥内容，方便复制到Git平台

### 📋 完善的规则系统
- **目录模式匹配**: 支持通配符和路径匹配
- **域名智能识别**: GitHub、GitLab、Bitbucket等平台自动识别
- **优先级机制**: 目录 → 仓库 → 域名 → 默认账号
- **规则测试**: 实时测试规则匹配效果

### 🎯 用户体验优化
- **状态总览**: 一屏显示当前Git状态和智能推荐
- **命令行支持**: 支持命令行参数快速操作
- **颜色标识**: 直观的颜色编码状态显示
- **错误处理**: 完善的错误提示和恢复机制

## 🚀 快速开始

### 安装使用
```bash
# 通过q命令使用
q git-pro

# 或直接运行
node examples/git-tools/git-account-pro.js
```

### 初始化设置
```bash
# 快速初始化
q git-pro init

# 查看当前状态
q git-pro status

# 自动切换（全局）
q git-pro auto

# 自动切换（本地仓库）
q git-pro auto-local
```

## 📖 详细功能

### 1. 账号管理
- ➕ **添加账号**: 支持用户名、邮箱配置
- ✏️ **编辑账号**: 修改现有账号信息
- 🗑️ **删除账号**: 安全删除账号及相关配置
- 🔑 **SSH管理**: 自动生成和管理SSH密钥

### 2. 规则配置

#### 目录规则示例
```
~/work/* → work@company.com
~/personal/* → personal@gmail.com
~/contrib/* → opensource@contributor.com
```

#### 域名规则示例
```
github.com → personal@gmail.com
gitlab.company.com → work@company.com
bitbucket.org → freelance@contractor.com
```

### 3. 自动化功能

#### 智能检测
```bash
# 当前目录: ~/work/company-project
# 自动匹配: work@company.com (目录规则)
# 推荐操作: 切换到工作账号

# 当前仓库: git@github.com:user/personal-repo
# 自动匹配: personal@gmail.com (域名规则)
# 推荐操作: 切换到个人账号
```

#### 一键切换
```bash
# 全局切换（影响所有Git操作）
q git-pro auto

# 本地切换（仅影响当前仓库）
q git-pro auto-local
```

### 4. SSH密钥管理

#### 自动生成密钥
- 为每个账号生成独立的SSH密钥对
- 自动配置SSH config文件
- 支持多平台密钥管理（GitHub、GitLab等）

#### SSH配置示例
```ssh
# 自动生成的SSH配置
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_work
  IdentitiesOnly yes

Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_personal
  IdentitiesOnly yes
```

## 🎨 界面预览

### 主界面
```
📊 当前Git状态
==================================================
📁 目录信息:
   当前路径: /Users/dev/work/company-project
   Git仓库: 是
   远程地址: git@github.com:company/project.git

⚙️  Git配置:
   全局用户: John Doe
   全局邮箱: john@personal.com

🤖 智能推荐:
   推荐账号: work (目录规则: ~/work/*)
   用户名: John Doe
   邮箱: john@company.com
   当前状态: ⚠️  不匹配
   💡 提示: 启用了自动切换，运行 "auto" 命令可自动应用

🚀 Git账号管理专业版
==================================================
操作选项:
   [1] 自动切换 (当前目录)
   [2] 自动切换 (本地仓库)
   [3] 账号管理
   [4] 规则管理
   [5] 设置管理
   [6] 刷新状态
   [0] 退出
```

### 账号管理界面
```
👥 账号管理
==============================
📋 已保存的账号:
   [1] work
       👤 John Doe
       📧 john@company.com
   [2] personal
       👤 John Doe
       📧 john@personal.com
   [3] opensource
       👤 John Doe
       📧 john@contributor.com

操作选项:
   [1] 添加新账号
   [2] 删除账号
   [3] 编辑账号
   [4] SSH密钥管理
   [0] 返回主菜单
```

### SSH密钥管理界面
```
🔑 SSH密钥管理
========================================
SSH密钥状态:
   work: ✅ 已生成
     私钥: ~/.ssh/id_rsa_work
     公钥: ~/.ssh/id_rsa_work.pub
   personal: ✅ 已生成
     私钥: ~/.ssh/id_rsa_personal
     公钥: ~/.ssh/id_rsa_personal.pub
   opensource: ❌ 未生成

操作选项:
   [1] 为指定账号生成SSH密钥
   [2] 更新SSH配置文件
   [3] 显示公钥内容
   [0] 返回
```

## 🔧 配置文件

### 配置文件位置
```
~/.quick-sh/config.json
```

### 配置文件结构
Git Account Pro 复用 quick-sh 的主配置文件，与其他工具共享配置：

```json
{
  "aliases": {
    // ... quick-sh 的其他别名配置
  },
  "gitAccounts": {
    "work": {
      "name": "John Doe",
      "email": "john@company.com"
    },
    "personal": {
      "name": "John Doe", 
      "email": "john@personal.com"
    }
  },
  "gitAccountRules": {
    "directories": {
      "~/work/*": "work",
      "~/personal/*": "personal"
    },
    "repositories": {
      "company/": "work"
    },
    "domains": {
      "github.com": "personal",
      "gitlab.company.com": "work"
    }
  },
  "gitAccountSettings": {
    "autoSwitch": true,
    "sshKeyManagement": true,
    "defaultAccount": "personal"
  }
}
```

> 💡 **配置复用优势**：
> - 统一配置管理，避免文件分散
> - 与 `git-account` 工具完全兼容  
> - 一个配置文件管理所有功能

## 💡 使用场景

### 场景1: 公司员工
```bash
# 设置工作目录规则
目录规则: ~/work/* → work@company.com
域名规则: gitlab.company.com → work@company.com

# 设置个人项目规则  
目录规则: ~/personal/* → personal@gmail.com
域名规则: github.com → personal@gmail.com
```

### 场景2: 开源贡献者
```bash
# 个人项目
目录规则: ~/my-projects/* → personal@gmail.com

# 开源贡献
目录规则: ~/contrib/* → contributor@opensource.org
域名规则: github.com/apache/ → contributor@opensource.org
```

### 场景3: 自由职业者
```bash
# 客户项目分离
目录规则: ~/client-a/* → john@client-a.com
目录规则: ~/client-b/* → john@client-b.com
目录规则: ~/personal/* → john@personal.com
```

## 🚀 高级功能

### 1. 批量操作
- 一键为所有账号生成SSH密钥
- 批量更新SSH配置
- 规则导入导出

### 2. 智能提示
- 实时状态检测
- 账号不匹配警告
- 操作建议提示

### 3. 安全特性
- SSH密钥权限检查
- 配置文件备份
- 操作确认机制

## 🔄 升级路径

### 从git-account升级
Git Account Pro 与原版 `git-account` 完全兼容，无需迁移：

```bash
# 使用相同的 gitAccounts 配置字段，完全兼容
q git-account  # 原版工具仍可正常使用
q git-pro      # 新版工具使用相同配置
```

### 配置兼容性  
- ✅ **完全兼容**：使用相同的 `gitAccounts` 字段
- ✅ **无缝切换**：两个工具可以同时使用
- ✅ **增量功能**：Pro版本添加新字段，不影响原版
- ✅ **零成本升级**：无需任何配置迁移

## 📝 命令速查

| 命令 | 功能 | 示例 |
|------|------|------|
| `q git-pro` | 启动主界面 | `q git-pro` |
| `q git-pro auto` | 自动切换（全局） | `q git-pro auto` |
| `q git-pro auto-local` | 自动切换（本地） | `q git-pro auto-local` |
| `q git-pro status` | 查看状态 | `q git-pro status` |
| `q git-pro accounts` | 账号管理 | `q git-pro accounts` |
| `q git-pro rules` | 规则管理 | `q git-pro rules` |
| `q git-pro settings` | 设置管理 | `q git-pro settings` |

## 🤝 与原版对比

| 特性 | git-account | git-account-pro |
|------|-------------|-----------------|
| 账号管理 | ✅ 基础功能 | ✅ 增强功能 |
| 手动切换 | ✅ 支持 | ✅ 支持 |
| 自动切换 | ❌ 不支持 | ✅ 智能自动 |
| SSH管理 | ❌ 不支持 | ✅ 完整支持 |
| 规则系统 | ❌ 不支持 | ✅ 强大规则 |
| 上下文感知 | ❌ 不支持 | ✅ 智能检测 |
| 批量操作 | ❌ 不支持 | ✅ 支持 |
| 命令行接口 | ❌ 仅交互 | ✅ 交互+命令行 |

## 🎯 最佳实践

### 1. 规则设置建议
- 优先使用目录规则（最精确）
- 域名规则作为备选
- 设置合理的默认账号

### 2. SSH密钥管理
- 为每个账号生成独立密钥
- 定期检查密钥状态
- 及时更新SSH配置

### 3. 工作流优化
- 项目开始时运行`auto`命令
- 定期检查状态匹配
- 使用本地切换避免全局影响

---

**Git Account Pro** - 让Git账号管理变得智能、自动、完美！ 🚀 
# Quick-sh 多源配置管理功能

## 概述

Quick-sh 的多源配置管理功能允许您从远程源（如GitHub仓库、CDN等）下载脚本并在本地使用，就像使用本地脚本一样简单。

## 功能特性

✅ **多源支持** - 支持GitHub、原始URL等多种脚本源  
✅ **无缝集成** - 远程脚本与本地脚本使用相同的调用方式  
✅ **独立存储** - 远程脚本存储在独立目录，不影响用户脚本路径  
✅ **自动权限** - 自动为下载的脚本设置执行权限  
✅ **源管理** - 完整的源添加、删除、列表功能  
✅ **脚本管理** - 下载、删除、列表远程脚本  

## 支持的源类型

### 1. GitHub 仓库
```bash
q --add-source myrepo github https://github.com/user/repo
q --add-source myrepo github https://github.com/user/repo --branch develop
```

### 2. 原始 URL
```bash
q --add-source cdn raw_url https://cdn.example.com/scripts
```

## 使用指南

### 源管理

#### 添加源
```bash
# 添加GitHub源（默认main分支）
q --add-source awesome-scripts github https://github.com/user/awesome-scripts

# 添加GitHub源（指定分支）
q --add-source dev-scripts github https://github.com/user/scripts --branch develop

# 添加原始URL源
q --add-source cdn-scripts raw_url https://cdn.example.com/scripts
```

#### 查看所有源
```bash
q --sources
q -s
```

#### 删除源
```bash
q --remove-source awesome-scripts
```

### 脚本下载

#### 下载脚本
```bash
# 基本下载
q --download awesome-scripts utils/backup.js

# 下载并重命名
q --download awesome-scripts tools/deploy.sh my-deploy

# 从子目录下载
q --download awesome-scripts helpers/format.js
```

#### 查看已下载的脚本
```bash
q --remote-list
q -rl
```

#### 删除远程脚本
```bash
q --remove-remote awesome-scripts backup.js
```

### 脚本执行

下载后的脚本可以像本地脚本一样直接调用：

```bash
# 执行远程脚本
q backup /src /dest
q deploy production
q format input.txt

# 传递参数
q backup --compress /src /dest
q deploy production --verbose
```

## 执行优先级

Quick-sh 按以下优先级查找和执行脚本：

1. **别名配置** (`config.json`)
2. **本地脚本目录** (用户设置的脚本路径)
3. **远程下载脚本** (`~/.quick-sh/remote-scripts/`)
4. **系统命令** (PATH中的命令)

## 存储结构

```
~/.quick-sh/
├── config.json                    # 全局配置（包含源配置）
└── remote-scripts/                # 远程脚本存储目录
    ├── awesome-scripts/           # 源名称
    │   ├── backup.js
    │   └── deploy.sh
    └── cdn-scripts/
        └── format.js
```

## 配置文件格式

全局配置文件 `~/.quick-sh/config.json` 中的源配置：

```json
{
  "scriptPath": "/path/to/local/scripts",
  "sources": {
    "awesome-scripts": {
      "type": "github",
      "url": "https://github.com/user/awesome-scripts",
      "branch": "main",
      "addedAt": "2024-01-01T00:00:00.000Z"
    },
    "cdn-scripts": {
      "type": "raw_url",
      "url": "https://cdn.example.com/scripts",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 实际使用示例

### 示例 1: 添加常用工具脚本源

```bash
# 添加一个包含常用工具的GitHub仓库
q --add-source utils github https://github.com/awesome-dev/shell-utils

# 下载备份脚本
q --download utils backup/mysql-backup.sh

# 下载部署脚本
q --download utils deploy/docker-deploy.js

# 使用下载的脚本
q mysql-backup.sh production
q docker-deploy.js staging
```

### 示例 2: 团队共享脚本

```bash
# 添加团队内部脚本仓库
q --add-source team-scripts github https://github.com/mycompany/dev-scripts

# 下载团队标准脚本
q --download team-scripts setup/env-setup.sh
q --download team-scripts testing/run-tests.js
q --download team-scripts deployment/release.sh

# 团队成员都可以使用相同的脚本
q env-setup.sh
q run-tests.js --coverage
q release.sh v1.2.3
```

### 示例 3: CDN脚本资源

```bash
# 添加CDN脚本源
q --add-source public-cdn raw_url https://scripts.example.com/public

# 下载公共工具脚本
q --download public-cdn formatters/json-formatter.js
q --download public-cdn validators/url-validator.js

# 使用公共脚本
q json-formatter.js input.json
q url-validator.js https://example.com
```

## 常用命令速查

| 命令 | 功能 |
|------|------|
| `q --sources` | 查看所有配置的源 |
| `q --add-source <name> <type> <url>` | 添加新源 |
| `q --remove-source <name>` | 删除源 |
| `q --download <source> <script>` | 下载脚本 |
| `q --remote-list` | 查看已下载的远程脚本 |
| `q --remove-remote <source> <script>` | 删除远程脚本 |
| `q -l` | 查看所有脚本（包括远程） |

## 注意事项

1. **网络连接** - 下载脚本需要网络连接
2. **权限管理** - 下载的脚本会自动设置执行权限
3. **名称冲突** - 远程脚本名称与本地脚本冲突时，本地脚本优先
4. **安全考虑** - 下载脚本前请确保源的可信度
5. **分支支持** - GitHub源支持指定分支，默认使用main分支

## 演示和帮助

```bash
# 查看功能演示
q remote-demo

# 查看完整帮助
q --help

# 查看当前状态（包括远程脚本）
q -l
```

## 技术实现

- **存储**: 远程脚本存储在 `~/.quick-sh/remote-scripts/` 目录
- **配置**: 源配置保存在全局配置文件中
- **下载**: 支持HTTPS下载，30秒超时
- **权限**: 自动为 `.js`、`.sh`、`.mjs` 文件设置可执行权限
- **集成**: 无缝集成到现有的脚本发现和执行机制

---

多源配置管理功能让 Quick-sh 不仅是本地脚本管理工具，更是一个强大的脚本生态系统平台！🚀 
# Git账号管理工具

一个方便的Git多账号管理工具，支持快速切换不同的Git用户配置。

## 功能特性

- 🔄 **快速切换**: 在多个Git账号之间一键切换
- 💾 **配置管理**: 保存和管理多个Git账号配置
- 🎨 **美观界面**: 彩色交互式命令行界面
- 🔧 **完整功能**: 添加、删除、切换Git账号配置
- 📋 **状态显示**: 实时显示当前Git配置状态

## 安装使用

### 1. 设置脚本路径
```bash
q -path examples
```

### 2. 启动Git账号管理工具
```bash
q git-account
```

## 使用指南

### 主界面
启动工具后，会显示：
- 📋 当前Git配置 (用户名和邮箱)
- 💾 已保存的Git账号列表
- 📋 可用操作菜单

### 可用操作

#### [1] 切换到已保存的账号
- 显示所有已保存的Git账号
- 选择要切换的账号
- 自动更新全局Git配置

#### [2] 添加新账号
- 输入账号标识 (如: work, personal, github)
- 输入用户名
- 输入邮箱地址
- 确认信息并保存
- 可选择立即切换到新账号

#### [3] 删除已保存的账号
- 选择要删除的账号
- 确认删除操作
- 从配置中移除

#### [4] 刷新显示
- 重新加载和显示当前状态
- 更新账号列表

#### [0] 退出
- 退出工具

## 配置存储

Git账号配置存储在 `~/.quick-sh/config.json` 文件中，格式如下：

```json
{
  "scriptPath": "/path/to/your/scripts",
  "gitAccounts": {
    "work": {
      "name": "Your Work Name",
      "email": "work@company.com"
    },
    "personal": {
      "name": "Your Personal Name", 
      "email": "personal@gmail.com"
    },
    "github": {
      "name": "GitHub Username",
      "email": "github@example.com"
    }
  }
}
```

## 使用场景

### 工作场景切换
```bash
# 切换到工作账号
q git-account
# 选择 [1] 切换账号
# 选择 work 账号

# 切换到个人项目
q git-account  
# 选择 [1] 切换账号
# 选择 personal 账号
```

### 添加新账号
```bash
q git-account
# 选择 [2] 添加新账号
# 输入标识: github
# 输入用户名: YourGitHubUsername
# 输入邮箱: your@example.com
# 确认添加: y
# 立即切换: y
```

## 示例输出

```
🔧 Git账号管理工具
==================

📋 当前Git配置:
   👤 用户名: John Doe
   📧 邮箱:   john@company.com

💾 已保存的Git账号:
   [1] work ✓ 当前使用
       👤 John Doe
       📧 john@company.com
   [2] personal
       👤 John Smith
       📧 john@gmail.com
   [3] github
       👤 johnsmith
       📧 john@github.com

📋 可用操作:
   [1] 切换到已保存的账号
   [2] 添加新账号
   [3] 删除已保存的账号
   [4] 刷新显示
   [0] 退出

请选择操作 (0-4):
```

## 注意事项

1. **Git依赖**: 需要系统已安装Git
2. **全局配置**: 修改的是Git全局配置 (`git config --global`)
3. **配置备份**: 建议在使用前备份现有Git配置
4. **权限要求**: 需要有写入家目录的权限

## 常见问题

### Q: 如何查看当前Git配置？
A: 可以使用以下命令：
```bash
git config --global user.name
git config --global user.email
```

### Q: 配置文件在哪里？
A: 配置文件位于 `~/.quick-sh/config.json`

### Q: 如何手动编辑配置？
A: 可以直接编辑 `~/.quick-sh/config.json` 文件，然后重启工具

### Q: 删除账号后如何恢复？
A: 需要重新添加账号信息，建议在删除前做好备份

## 扩展功能

### 配置验证
工具会自动验证：
- Git是否已安装
- 配置文件是否可读写
- 用户输入是否有效

### 错误处理
- 友好的错误提示
- 自动恢复机制
- 输入验证

### 界面优化
- 彩色输出
- 清晰的状态显示  
- 直观的操作提示

## 技术实现

- **Node.js**: 使用Node.js实现
- **readline**: 交互式命令行输入
- **child_process**: 执行Git命令
- **fs-extra**: 文件系统操作
- **JSON配置**: 结构化配置存储

## 相关工具

- `q commit`: 交互式Git提交工具
- `q setup-hooks`: Git hooks设置工具
- `q -list`: 查看所有可用脚本

---

更多信息请参考 [Quick Sh 文档](../README.md) 
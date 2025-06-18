# quick sh

一个本地脚本管理工具，让你可以快速执行JavaScript和Shell脚本。

## 安装

```bash
npm install -g quick-sh
```

安装后，你就可以使用 `q` 命令了。

## 使用方法

### 设置脚本目录

首先，你需要设置一个目录来存放你的脚本：

```bash
q -path /path/to/your/scripts
```

### 执行脚本

设置好路径后，你就可以执行脚本了：

```bash
# 执行JavaScript文件
q my-script      # 会查找 my-script.js 并用 node 执行

# 执行Shell脚本
q my-shell       # 会查找 my-shell.sh 并用 sh 执行

# 执行目录中的脚本
q my-folder      # 会在 my-folder 中查找 index.js 或 index.sh 并执行
```

### 参数透传

你可以向脚本传递参数，这些参数会透传给目标脚本：

```bash
# 向JavaScript脚本传递参数
q my-script arg1 arg2 "with spaces"

# 向Shell脚本传递参数
q my-shell.sh param1 param2

# 向目录脚本传递参数
q my-folder data1 data2
```

对于JavaScript脚本，参数可以通过 `process.argv.slice(2)` 获取：
```javascript
console.log('Arguments:', process.argv.slice(2));
```

对于Shell脚本，参数可以通过 `$1`, `$2`, `$*`, `$@` 等获取：
```bash
echo "First arg: $1"
echo "All args: $*"
echo "Number of args: $#"
```

## Alias 配置功能

你可以在脚本目录中创建 `config.json` 文件来定义命令别名，支持三种类型：

### 配置格式

```json
{
  "aliases": {
    "chat": {"bin": "./chat/src/main.js"},
    "python3": "/usr/bin/python3", 
    "w": "which"
  }
}
```

### 三种别名类型

1. **相对路径别名**: `{"command": {"bin": "./relative/path"}}`
   - 相对于脚本目录的路径
   - 例：`q chat hello` 执行 `./chat/src/main.js hello`

2. **绝对路径别名**: `{"command": "/absolute/path"}`
   - 直接执行绝对路径的可执行文件
   - 例：`q python3 script.py` 执行 `/usr/bin/python3 script.py`

3. **系统命令别名**: `{"command": "system-command"}`
   - 映射到系统命令
   - 例：`q w node` 执行 `which node`

### 执行优先级

1. **Alias 配置** (最高优先级)
2. **脚本目录中的文件**
3. **系统可执行命令** (最低优先级)

### 查看状态

```bash
q -list          # 或 q -l
q                # 不带参数也会显示状态
```

这会显示：
- 当前配置的脚本路径
- 可用的脚本列表

### 获取帮助

```bash
q -help          # 或 q -h
```

显示完整的英文帮助信息，包括：
- 工具描述和用法
- 所有可用命令
- 脚本执行示例
- 支持的文件类型

## 支持的文件类型

- **JavaScript**: `.js`, `.mjs` - 使用 `node` 执行
- **Shell**: `.sh` - 使用 `sh` 执行
- **目录**: 会查找目录中的 `index.js`、`index.sh` 或 `index.mjs`

## 示例

假设你有以下目录结构：
q - 
```
/home/user/scripts/
├── hello.js
├── backup.sh
├── deploy/
│   └── index.js
└── utils/
    └── index.sh
```

设置脚本目录：
```bash
q -path /home/user/scripts
```

执行脚本：
```bash
q hello                    # 执行 hello.js
q backup                   # 执行 backup.sh
q deploy                   # 执行 deploy/index.js
q utils                    # 执行 utils/index.sh

# 带参数执行
q hello "John Doe"         # 向 hello.js 传递参数
q backup /data /backup     # 向 backup.sh 传递源目录和目标目录
q deploy production        # 向 deploy/index.js 传递环境参数
```

## 开发和测试

### 本地开发

克隆项目后：

```bash
# 安装依赖
npm install

# 创建全局链接用于测试
npm link

# 运行自动化测试
npm test

# 查看手动测试提示
npm run test:manual
```

### 测试用例

项目包含完整的测试套件：

- **自动化测试**: `npm test` - 运行所有自动化测试
- **手动测试**: 使用 `examples/` 目录中的测试脚本
- **功能覆盖**: 命令执行、参数传递、错误处理等

## 配置

配置文件存储在 `~/.quick-sh/config.json`。

## 许可证

MIT 
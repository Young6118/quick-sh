# quick sh 发布指南

## 发布前准备

### 1. 确保你有npm账号
```bash
npm whoami
```

如果没有账号，请访问 https://www.npmjs.com/ 注册

### 2. 登录npm
```bash
npm login
```

### 3. 更新版本号（如果需要）
```bash
# 小版本更新 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本更新 (1.0.0 -> 1.1.0)
npm version minor

# 主要版本更新 (1.0.0 -> 2.0.0)
npm version major
```

## 发布步骤

### 1. 运行测试
```bash
npm test
```

### 2. 预览发布内容
```bash
npm pack --dry-run
```

### 3. 发布到npm
```bash
# 发布到公开仓库
npm publish --access public

# 如果是作用域包的首次发布，需要指定access
npm publish --access public
```

## 发布后验证

### 1. 检查包是否成功发布
```bash
npm view quick-sh
```

### 2. 全局安装并测试
```bash
npm install -g quick-sh
q -help
```

## 版本管理

- 遵循语义化版本 (SemVer)
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

## 包信息

- **包名**: `quick-sh`
- **命令**: `q`

## 注意事项

1. 发布前必须通过所有测试（prepublishOnly脚本会自动运行测试）
2. 确保README.md文档是最新的
3. 检查package.json中的仓库信息是否正确
4. 首次发布作用域包时需要使用 `--access public` 
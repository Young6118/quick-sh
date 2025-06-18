#!/usr/bin/env node

const { warning } = require('./test-utils');

console.log('- npm test                    # 运行所有测试');
console.log('- npm run test:basic          # 基础功能测试');
console.log('- npm run test:script         # 脚本执行测试');
console.log('- npm run test:alias          # 别名配置测试');
console.log('- npm run test:error          # 错误处理测试');
console.log('- npm run test:config         # 配置管理测试');
console.log('');
console.log('模块化测试进行中...');
console.log('');

// 重定向到新的测试运行器
require('./run-all.js'); 
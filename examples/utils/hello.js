#!/usr/bin/env node
// Description: Simple greeting script demonstrating JavaScript execution

console.log('Hello from JavaScript!');
console.log('Current directory:', process.cwd());

const args = process.argv.slice(2);
console.log('Arguments:', args);

if (args.length > 0) {
  // 如果传入了参数，直接使用第一个参数作为名字
  const name = args[0];
  console.log(`Nice to meet you, ${name}!`);
  
  if (args.length > 1) {
    console.log('Additional arguments received:');
    args.slice(1).forEach((arg, index) => {
      console.log(`  Extra arg ${index + 1}: ${arg}`);
    });
  }
} else {
  // 如果没有参数，就询问用户输入
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('What is your name? ', (name) => {
    console.log(`Nice to meet you, ${name}!`);
    rl.close();
  });
} 
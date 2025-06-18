#!/usr/bin/env node
// Description: Test script for validating argument passing in JavaScript

console.log('=== JavaScript Arguments Test ===');
console.log('Script name:', process.argv[1]);
console.log('Arguments received:', process.argv.slice(2));
console.log('Number of arguments:', process.argv.slice(2).length);

if (process.argv.slice(2).length > 0) {
  console.log('\nArgument details:');
  process.argv.slice(2).forEach((arg, index) => {
    console.log(`  Arg ${index + 1}: "${arg}"`);
  });
} else {
  console.log('\nNo arguments provided.');
}

console.log('\nDone!'); 
#!/usr/bin/env node

console.log('=== Directory Script Arguments Test ===');
console.log('Script location:', __dirname);
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

console.log('\nDirectory script execution completed!'); 
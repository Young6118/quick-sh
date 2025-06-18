# Quick Sh

[![npm version](https://badge.fury.io/js/quick-sh.svg)](https://badge.fury.io/js/quick-sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A local script management tool for quick execution of JavaScript and Shell scripts with advanced alias support.

[中文文档](https://github.com/Young6118/quick-sh/blob/main/README-zh.md) | English

## Features

- 🚀 **Quick Execution**: Run local scripts with simple `q script-name` command
- 📁 **Multiple Formats**: Support JavaScript (.js), Shell scripts (.sh), and directories
- 🔗 **Advanced Aliases**: Configure custom aliases with relative paths, absolute paths, and system commands
- 📝 **Parameter Forwarding**: Pass arguments transparently to your scripts
- 🎯 **Smart Priority**: Alias config > Script files > System commands
- ⚡ **Global Access**: Install once, use anywhere
- 🧪 **Comprehensive Testing**: 16 automated test cases ensure reliability

## Installation

```bash
npm install -g quick-sh
```

After installation, you can use the `q` command globally.

## Quick Start

### 1. Set Script Directory

```bash
# Set your script directory
q -path /path/to/your/scripts

# Check current status
q -list
```

### 2. Run Scripts

```bash
# Run a JavaScript file
q myscript

# Run a shell script
q deploy.sh

# Run with parameters
q backup --target /data --compress

# Execute directory (looks for index.js or index.sh)
q myproject
```

### 3. Configure Aliases

Create or edit `config.json` in your script directory:

```json
{
  "aliases": {
    "deploy": {
      "bin": "./deploy/index.js"
    },
    "backup": {
      "bin": "/usr/local/bin/backup.sh"
    },
    "start": {
      "bin": "npm start"
    }
  }
}
```

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `q -path <dir>` | Set script directory | `q -path ~/scripts` |
| `q -list` | Show current status and available scripts | `q -list` |
| `q -help` | Display help information | `q -help` |
| `q <script>` | Execute script or alias | `q deploy` |

## Alias Configuration

### Supported Alias Types

1. **Relative Path**: Relative to script directory
   ```json
   {
     "aliases": {
       "deploy": {"bin": "./deploy/index.js"}
     }
   }
   ```

2. **Absolute Path**: Full system path
   ```json
   {
     "aliases": {
       "backup": {"bin": "/usr/local/bin/backup.sh"}
     }
   }
   ```

3. **System Command**: Execute system commands
   ```json
   {
     "aliases": {
       "list": {"bin": "ls -la"},
       "findnode": {"bin": "which node"}
     }
   }
   ```

### Execution Priority

1. **Alias Configuration** (highest priority)
2. **Script Files** (medium priority)
3. **System Commands** (lowest priority)

## Parameter Forwarding

All parameters are transparently forwarded to target scripts:

```bash
# These parameters will be passed to the script
q deploy --env production --verbose
q backup /data/important --compress
```

In your script, access parameters normally:
- **JavaScript**: `process.argv`
- **Shell**: `$1`, `$2`, etc.

## Examples

### Directory Structure
```
~/scripts/
├── config.json
├── deploy.js
├── backup.sh
└── utils/
    └── index.js
```

### config.json
```json
{
  "aliases": {
    "deploy": {"bin": "./deploy.js"},
    "util": {"bin": "./utils"},
    "backup": {"bin": "./backup.sh"},
    "start": {"bin": "npm start"}
  }
}
```

### Usage
```bash
# Execute via alias
q deploy --env prod

# Execute shell script
q backup.sh /data

# Execute directory (looks for utils/index.js)
q utils --help

# System command via alias
q start
```

## Development

### Testing

```bash
# Run all tests
npm test

# Manual testing with example scripts
npm run test:manual
```

### Project Structure

```
quick-sh/
├── bin/           # CLI entry point
├── lib/           # Core modules
│   ├── config.js      # Configuration management
│   ├── executor.js    # Script execution
│   ├── help.js        # Help text
│   ├── script-manager.js  # Main logic
│   └── utils.js       # Utilities
├── test/          # Test suite
└── examples/      # Example scripts
```

## Requirements

- Node.js >= 14.0.0
- npm or yarn

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- **Young6118** - *Initial work*

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/Young6118/quick-sh/issues) on GitHub. 
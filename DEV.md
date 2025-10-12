# Development Guide

This guide covers how to build, test, and publish the `@onFlow/react-sdk` package to npm.

## Prerequisites

- Node.js 18+
- npm account with access to publish `@onFlow/react-sdk`
- Git configured with your credentials

## Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run tests:**

   ```bash
   npm test
   ```

3. **Run linting:**

   ```bash
   npm run lint
   ```

4. **Start development build (watch mode):**
   ```bash
   npm run dev
   ```

## Building the Package

### Production Build

To build the package for production:

```bash
npm run build
```

This command:

- Compiles TypeScript to JavaScript
- Generates both ESM (`dist/index.js`) and CommonJS (`dist/index.cjs`) formats
- Creates TypeScript declaration files (`dist/index.d.ts`)
- Cleans the dist directory before building

### Build Output

The build process creates the following files in the `dist/` directory:

- `index.js` - ESM module
- `index.cjs` - CommonJS module
- `index.d.ts` - TypeScript declarations
- Source maps (`.js.map` files)

## Testing

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npx vitest
```

### Test Structure

Tests are located in `__tests__/` directory:

- `helpers.test.ts` - Tests for utility functions

### Adding Tests

When adding new functionality:

1. Create test files in `__tests__/` directory
2. Use Vitest testing framework
3. Follow existing test patterns
4. Ensure tests cover edge cases and error conditions

## Publishing to npm

### Pre-publish Checklist

Before publishing, ensure:

1. **Version is updated** in `package.json`
2. **Tests pass:** `npm test`
3. **Linting passes:** `npm run lint`
4. **Build succeeds:** `npm run build`
5. **Package is properly configured** (see package.json validation below)

### Version Management

Update the version in `package.json`:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major
```

This automatically:

- Updates `package.json`
- Creates a git tag
- Commits the changes

### Publishing Process

1. **Login to npm** (if not already logged in):

   ```bash
   npm login
   ```

2. **Publish the package:**

   ```bash
   npm publish
   ```

3. **Verify publication:**
   ```bash
   npm view @onFlow/react-sdk
   ```

### Publishing Scopes

The package is published under the `@onFlow` scope. Ensure you have:

- Access to publish packages under this scope
- Proper npm organization permissions

### Package Configuration

Key configuration in `package.json`:

```json
{
  "name": "@onFlow/react-sdk",
  "version": "0.1.0",
  "private": false,
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=17",
    "react-dom": ">=17"
  }
}
```

Important fields:

- `private: false` - Required for publishing
- `files: ["dist"]` - Only include built files
- `main`/`module`/`types` - Entry points for different module systems
- `peerDependencies` - React version requirements

## CI/CD Integration

### Automated Publishing

Consider setting up automated publishing via CI/CD:

1. **Trigger on version tags:**

   ```yaml
   # Example GitHub Actions
   on:
     push:
       tags:
         - "v*"
   ```

2. **Build and publish:**

   ```yaml
   - name: Build
     run: npm run build

   - name: Publish to npm
     run: npm publish
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

### Environment Variables

For CI/CD, you'll need:

- `NPM_TOKEN` - npm authentication token
- Access to `@onFlow` npm organization

## Troubleshooting

### Common Issues

1. **"Package already exists" error:**
   - Increment version number
   - Use `npm version` command

2. **"Insufficient permissions" error:**
   - Check npm organization access
   - Verify you're logged in: `npm whoami`

3. **Build failures:**
   - Check TypeScript errors: `npx tsc --noEmit`
   - Verify all dependencies are installed
   - Clear node_modules and reinstall if needed

4. **Test failures:**
   - Run tests individually to isolate issues
   - Check test environment setup

### Debugging

1. **Check package contents before publishing:**

   ```bash
   npm pack
   tar -tzf onFlow-react-sdk-0.1.0.tgz
   ```

2. **Test package locally:**

   ```bash
   npm pack
   npm install ./onFlow-react-sdk-0.1.0.tgz
   ```

3. **Verify package.json:**
   ```bash
   npm publish --dry-run
   ```

## Development Workflow

### Feature Development

1. Create feature branch
2. Make changes
3. Add/update tests
4. Run tests and linting
5. Build package locally
6. Test integration
7. Create pull request

### Release Process

1. Merge feature branches to main
2. Update version number
3. Run full test suite
4. Build production package
5. Publish to npm
6. Create release notes
7. Tag release in git

## Dependencies

### Production Dependencies

- `zod` - Schema validation

### Development Dependencies

- `typescript` - TypeScript compiler
- `tsup` - Build tool
- `vitest` - Testing framework
- `eslint` - Linting
- `@types/*` - TypeScript type definitions

### Peer Dependencies

- `react` >=17 - React framework
- `react-dom` >=17 - React DOM rendering

## Contributing

When contributing to the SDK:

1. Follow existing code style
2. Add tests for new functionality
3. Update documentation
4. Ensure backward compatibility
5. Test with different React versions

## Support

For issues with the SDK:

1. Check this documentation
2. Review existing GitHub issues
3. Create new issue with detailed description
4. Include reproduction steps and environment details

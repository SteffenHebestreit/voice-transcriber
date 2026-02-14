# Contributing to Voice Transcriber

First off, thank you for considering contributing to Voice Transcriber! It's people like you that make this tool better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, inclusive, and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, config files, etc.)
- **Describe the behavior you observed** and what you expected
- **Include screenshots or GIFs** if applicable
- **Include your environment details**:
  - OS version (Windows/Linux)
  - Node.js version
  - Electron version
  - Docker version
  - Whisper model being used

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/voice-transcriber.git
cd voice-transcriber

# Install dependencies
npm install

# Start the Whisper server
cd server
docker-compose up -d
cd ..

# Run in development mode
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing code style (we use ESLint)
- Add types for all function parameters and return values
- Avoid `any` types when possible

### Code Style

```typescript
// Good
function startRecording(mode: 'toggle' | 'ptt'): Promise<void> {
  // Implementation
}

// Avoid
function startRecording(mode) {
  // Implementation
}
```

### Comments

- Write clear, concise comments for complex logic
- Use JSDoc for public APIs
- Avoid obvious comments

```typescript
// Good
/**
 * Converts WebM audio to WAV format using bundled ffmpeg
 * @param inputPath - Path to WebM file
 * @param outputPath - Desired path for WAV output
 */
private async convertToWav(inputPath: string, outputPath: string): Promise<void>

// Avoid
// This function adds two numbers
function add(a: number, b: number): number
```

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests

```
Good commit messages:
- Add GPU acceleration support for Whisper
- Fix hold-to-talk timing issue
- Update README with Docker setup instructions
- Refactor audio capture to use MediaRecorder API

Avoid:
- fixed stuff
- updates
- asdf
```

## Project Structure

```
voice-transcriber/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # Settings UI
│   ├── preload/        # IPC bridge
│   ├── shared/         # Shared types
│   └── overlay/        # Recording overlay
├── server/             # Docker Whisper server
├── resources/          # App icons and assets
└── dist/              # Build output (gitignored)
```

## Testing

Before submitting a PR:

1. **Test all recording modes** (toggle and push-to-talk)
2. **Test on your target platform** (Windows/Linux)
3. **Verify Whisper integration** works
4. **Check for TypeScript errors**: `npm run type-check`
5. **Run the linter**: `npm run lint`
6. **Build the app**: `npm run build`

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for new public APIs
- Update inline comments for complex logic changes
- Create/update examples if adding new features

## Questions?

Feel free to ask questions by:
- Opening a GitHub issue
- Starting a GitHub Discussion
- Commenting on existing issues/PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

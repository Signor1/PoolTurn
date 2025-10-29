# Contributing to PoolTurn

Thank you for your interest in contributing to PoolTurn! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Security](#security)

## Getting Started

PoolTurn is a decentralized Rotating Savings and Credit Association (ROSCA) platform built on Base. Before contributing, please:

1. Read the [README.md](./README.md) to understand the project
2. Check existing [issues](../../issues) and [pull requests](../../pulls)
3. Join our community discussions

## Development Setup

### Prerequisites
- Node.js v18+ and npm
- Foundry (for smart contract development)
- Git

### Smart Contract Development

```bash
# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testJoinCircleSuccess -vvv

# Format code
forge fmt
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
rosca-base/
├── src/                      # Smart contracts
│   ├── PoolTurnSecure.sol   # Main ROSCA contract
│   ├── USDC.sol             # Mock USDC token
│   └── USDT.sol             # Mock USDT token
├── test/                     # Contract tests
│   └── PoolTurnSecure.t.sol
├── script/                   # Deployment scripts
├── frontend/                 # Next.js application
│   ├── app/                 # Page routes
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   │   ├── contract/       # Contract interaction hooks
│   │   └── ...
│   ├── lib/                 # Utilities
│   └── abi/                 # Contract ABIs
└── docs/                    # Additional documentation
```

## Coding Standards

### Solidity

- Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public/external functions
- Maintain test coverage above 80%
- Use explicit function visibility
- Prefer custom errors over require strings for gas optimization
- Always include event emissions for state changes

Example:
```solidity
/**
 * @notice Allows a member to contribute to the current round
 * @dev Checks membership, contribution status, and transfers tokens
 * @param circleId The ID of the circle
 */
function contribute(uint256 circleId) external nonReentrant whenNotPaused {
    // Implementation
}
```

### TypeScript/React

- Use TypeScript strict mode
- Follow React best practices and hooks rules
- Use functional components with hooks
- Prefer named exports over default exports
- Document complex functions with JSDoc
- Keep components under 300 lines (split if larger)

Example:
```typescript
/**
 * Hook for managing circle data with auto-refresh
 * @param circleId - The ID of the circle to fetch
 * @returns Circle data, loading state, and error
 */
export function useCircleData(circleId: bigint) {
    // Implementation
}
```

### Naming Conventions

- **Smart Contracts**: PascalCase (e.g., `PoolTurnSecure`)
- **Functions**: camelCase (e.g., `createCircle`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_MEMBERS`)
- **React Components**: PascalCase (e.g., `CircleCard`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useCircleData`)
- **Types/Interfaces**: PascalCase (e.g., `CircleInfo`)

## Testing

### Smart Contract Tests

All smart contract changes must include tests:

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-path test/PoolTurnSecure.t.sol

# Generate coverage report
forge coverage
```

**Test Requirements:**
- Test happy paths
- Test edge cases and boundary conditions
- Test failure scenarios
- Test access control
- Test event emissions

### Frontend Tests

Frontend testing will be implemented using:
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright (coming soon)

## Submitting Changes

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes**
   ```bash
   # Smart contracts
   forge test

   # Frontend
   npm run build
   ```

4. **Commit your changes** with clear, descriptive messages
   ```bash
   git commit -m "feat: add circle comparison feature"
   ```

   Commit message format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Test results

### PR Review Criteria

Your PR will be reviewed for:
- ✅ Code quality and style compliance
- ✅ Test coverage
- ✅ Documentation updates
- ✅ No breaking changes (or properly documented)
- ✅ Gas optimization (for smart contracts)
- ✅ Security considerations

## Security

### Reporting Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security concerns to [security contact - add email]
2. Provide detailed description of the vulnerability
3. Include steps to reproduce if possible
4. Allow time for the issue to be addressed before public disclosure

### Security Best Practices

When contributing:
- Never commit private keys or sensitive data
- Use environment variables for configuration
- Validate all user inputs
- Follow the checks-effects-interactions pattern in smart contracts
- Be aware of common vulnerabilities (reentrancy, overflow, etc.)
- Use OpenZeppelin libraries when possible

## Code Review Guidelines

When reviewing PRs:
- Be respectful and constructive
- Focus on code quality and correctness
- Suggest improvements, don't demand perfection
- Test the changes locally when possible
- Approve only when you're confident in the changes

## Questions?

If you have questions about contributing:
- Check existing issues and discussions
- Create a new discussion in the repository
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PoolTurn! 🚀

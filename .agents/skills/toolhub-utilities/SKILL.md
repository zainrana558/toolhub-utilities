```markdown
# toolhub-utilities Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the development conventions and patterns used in the `toolhub-utilities` repository, a TypeScript project built with the Next.js framework. You'll learn about file naming, import/export styles, commit message habits, and how to write and organize tests. This guide will help you contribute code that matches the project's established standards.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `myUtilityFunction.ts`

### Import Style
- Use **alias imports** for referencing modules.
  - Example:
    ```typescript
    import { fetchTools } from '@/utils/fetchTools';
    ```

### Export Style
- **Mixed exports** are used (both named and default).
  - Example:
    ```typescript
    // Named export
    export function doSomething() { ... }

    // Default export
    export default function mainHandler() { ... }
    ```

### Commit Patterns
- Commit messages are **freeform** (no enforced prefixes).
- Average commit message length: ~36 characters.
  - Example:  
    ```
    Add utility for parsing tool metadata
    ```

## Workflows

_No automated workflows detected in this repository._

## Testing Patterns

- **Test Framework:** Not explicitly detected; check project dependencies for details.
- **Test File Pattern:** Files named with `.test.` in the filename.
  - Example: `parseToolData.test.ts`
- **Test Example:**
  ```typescript
  // parseToolData.test.ts
  import { parseToolData } from '@/utils/parseToolData';

  test('parses tool data correctly', () => {
    const input = { name: 'Tool', version: '1.0' };
    const result = parseToolData(input);
    expect(result).toHaveProperty('name', 'Tool');
  });
  ```

## Commands
| Command | Purpose |
|---------|---------|
| /format-code | Format your code to match camelCase file naming and alias import conventions |
| /run-tests | Run all test files matching *.test.* |
| /add-utility | Scaffold a new utility function with proper export style |
```
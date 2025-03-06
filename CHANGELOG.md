# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Added example for advanced boolean operations (`examples/boolean/advancedoperations.dem`).
- Added examples for arrow functions (`examples/functions/arrowfunctions`).
- Added example for callback functions (`examples/functions/callbacks.dem`).
- Added experimental map test for future feature development (`experimentation/maptest.dem`).
- Added experimental object test for debugging and feature testing (`experimentation/objects.dem`).

### Changed
- Enhanced `run_examples.ps1` script to capture and summarize failures dynamically.
- Improved parser logic in `src/frontend/parser.ts` for parentheses handling and function calls.
  - Note: Some examples are still failing (Terminal#567-584) and will be fixed in the next patch.
- Updated `examples/statements/assert.dem` to reflect current runtime behavior and error handling.
- Refactored AST structure in `src/frontend/ast.ts` to improve compatibility with new parser logic.
- Enhanced lexer in `src/frontend/lexer.ts` to handle additional token types for upcoming features.
- Improved logging utility in `src/helpers/logging.ts` for better debugging and error reporting.
- Updated runtime value definitions in `src/runtime/values.ts` to align with new features.
- Improved statement evaluation logic in `src/runtime/eval/statements.ts`.
- Fixed expression evaluation bugs in `src/runtime/eval/expressions.ts` and added support for advanced operations.

### Fixed
- Fixed minor bugs in `src/runtime/environment.ts` related to runtime handling.

---

## [1.0.0] - Initial Release
### Added
- Core language features:
  - Strings, objects, functions, if statements, variable declarations, arithmetic operations, loops, and comparison operators.
- Support for floating-point numbers and arrays.
- Assert function for testing.
- Syntax highlighting via Demi-SyntaxHighlighting extension (VSCode).
- Temporary fix for `sleep_ms` function.
- Boolean operators (`&&`, `||`, `!`) support.
- String interpolation support.
- Benchmark tests.

### Changed
- Printing functions now display a tree describing the function instead of the AST.

### Fixed
- Fixed printing objects to show properties.
- Fixed `stdlib.time` sleep functionality.

---
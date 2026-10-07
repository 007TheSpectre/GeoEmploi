# Git Commit Guidelines

This repository follows the **[Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)** standard with a capitalized domain prefix (`[Frontend]` / `[Backend]` / `[Shared]`) to clearly separate frontend and backend changes.

---

## 1. Commit Message Structure

```text
[Domain](type): <description>

[optional body]

[optional footer(s)]
```

### Domain Prefix (Required)
Always specify which area of the codebase is modified:
- **`[Frontend]`** — Frontend application / UI / client-side components
- **`[Backend]`** — Backend API / server / database / business logic
- **`[Shared]`** — Shared types, monorepo configs, root files, or CI/CD

---

## 2. Commit Types

| Type | When to Use |
| :--- | :--- |
| **`feat`** | Introduces a new feature or functionality |
| **`fix`** | Fixes a bug |
| **`docs`** | Documentation changes only (README, docstrings, API docs) |
| **`refactor`** | Code restructuring without altering behavior or fixing bugs |
| **`perf`** | Performance improvements |
| **`test`** | Adding or correcting unit/integration tests |
| **`build`** | Build system or dependency updates (`npm`, `pip`, `Cargo`, etc.) |
| **`ci`** | CI/CD pipeline changes (GitHub Actions, Dockerfiles, etc.) |
| **`chore`** | Maintenance, formatting, or tooling configurations |

---

## 3. Rules & Style Guide

- **Imperative tone**: Write `"add"` instead of `"added"` or `"adds"`.
- **Lowercase summary**: Start the description in lowercase and **do not** end with a period (`.`).
- **Breaking changes**: Add a `!` before the closing parenthesis (e.g., `[Backend](feat)!: drop legacy endpoint`) or include a `BREAKING CHANGE:` footer.
- **References**: Reference issue numbers in the footer when applicable (`Closes: #42`, `Fixes: #12`).

---

## 4. Examples

```text
[Frontend](feat): implement site navigation, responsive navbar, and routing infrastructure
[Frontend](fix): fix mobile hamburger menu not opening

[Backend](feat): authentication module with JWT login and password reset
[Backend](fix): resolve database connection pool timeout on heavy load

[Backend](feat)!: replace sessions with JWT tokens
BREAKING CHANGE: Authorization header format changed to Bearer tokens.

[Shared](chore): upgrade shared typescript types package
[Shared](ci): add automated test workflow on PR
```

---

## 5. Quick Pre-Commit Checklist

- [ ] Starts with `[Frontend]`, `[Backend]`, or `[Shared]`
- [ ] Uses a valid lowercase type (`feat`, `fix`, `refactor`, `chore`, etc.)
- [ ] Description is in the imperative mood (*"fix bug"*, not *"fixed bug"*) without a trailing period
- [ ] Breaking changes are marked with `!` or a `BREAKING CHANGE:` footer

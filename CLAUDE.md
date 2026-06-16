# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

| Task | Command |
|------|---------|
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Run Tests | `pnpm test` (single test: `pnpm test --file test-file.js`)
| Development Servers |
| CLI | `pnpm dev:cli` |
| Server | `pnpm dev:server` |
| UI | `pnpm dev:ui` |
| Release | `pnpm release` |

## CLI Tools

Common operations:
- `ccr start` - Start server
- `ccr stop` - Stop server
- `ccr restart` - Restart server
- `ccr status` - Show current status
- `ccr code` - Execute claude command

## Architecture Overview

### Core Packages
- **cli**: Command-line interface components
- **server**: Core server logic and routing
- **shared**: Reusable utilities and constants
- **ui**: React-based web interface using Vite

### Key Components
- Routing follows default routing rules, project configurations, or custom JavaScript routers
- Uses `@musistudio/llms` for request/response transformations
- Features plugin-based agents for code modification
- Server-level logging with pino, application-level logging

### Development Workflow
- New features follow: `/task create` → `/plan` → Implement → `/verify` → Commit
- Tasks are tracked via CLI with status management

## Configuration
- Main config: `~/.claude-code-router/config.json`
- Presets directory: `~/.claude-code-router/presets/`
- Logs stored in: `~/.claude-code-router/logs/`

## Important Notes
- Avoid including sensitive data in code
- Use `/ask-user` for clarifying requirements
- Use `/loop` for recurring tasks
- Use `/cron` for scheduled jobs
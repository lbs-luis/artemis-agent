# Artemis Agent

> A lean, local-first AI agent harness — runs on your machine, low cost, few knobs.

Artemis is a small AI **harness**: the runtime that wraps a model in a loop, gives it
tools, streams its output, and remembers the conversation. Today it runs locally on
[Ollama](https://ollama.com) with `gemma4:12b` — cheap to run and simple to set up — with
more providers and models to come.

It's built to do **simple tasks well** with sane defaults, and just as much to **learn**
why the harness (not the model) is what makes an agent useful in this AI era.

## Why this exists

- **Lean** — no provider matrix, no config sprawl. Sensible defaults over options.
- **Local & low-cost** — runs against your own Ollama; no API keys, no per-token bill.
- **Purpose-built tools** — each tool is designed and reviewed for a specific task, so you just run it and it works.
- **A learning project** — a from-scratch study of how a real agent harness is wired.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | [Bun](https://bun.com) + TypeScript (native TS, workspaces) |
| Model backend | [Ollama](https://ollama.com) — fixed `gemma4:12b` (native tool calls + thinking) |
| Terminal UI | React 19 + [OpenTUI](https://github.com/sst/opentui) |
| Web UI *(WIP)* | React 19 + Tailwind v4 + shadcn/ui |
| Lint/format | [Biome](https://biomejs.dev) |

## Architecture

A [Bun workspaces](https://bun.com/docs/install/workspaces) monorepo. Shared libraries
live in `src/packages/`, runnable apps in `apps/` and `web/`. Each package has a name
(`@artemis/*`) and is imported by name, so the pure engine stays decoupled from the UIs.

```text
artemis-agent/
├─ src/packages/         shared libraries (workspaces)
│  ├─ llm-core/          @artemis/llm-core      · the pure engine: ReAct loop + Ollama provider
│  └─ session-store/     @artemis/session-store · chat persistence (JSONL behind a swappable port)
├─ apps/
│  └─ cli/               @artemis/cli           · readline CLI + OpenTUI terminal chat
└─ web/                  browser chat UI (work in progress)
```

The engine (`llm-core`) holds no I/O: a **provider** streams events, the **loop** re-prompts
the model until it stops asking for tools, and the **session store** plugs in at the edge to
give a stateless model memory.

## Requirements

- [Bun](https://bun.com) (v1.3+)
- [Ollama](https://ollama.com) running locally with the model pulled:

```bash
ollama pull gemma4:12b
```

By default Artemis talks to Ollama at `http://localhost:11434`.

## Getting started

```bash
# 1. install dependencies
bun install

# 2. make sure Ollama is up and gemma4:12b is pulled (see Requirements)

# 3a. run the simple readline CLI
bun run cli

# 3b. or run the OpenTUI terminal chat
bun run tui
```

Conversations are persisted to `./sessions/<id>.jsonl` and resumed automatically.

## Scripts

| Command | What it does |
|---------|--------------|
| `bun run cli` | Minimal readline chat loop |
| `bun run tui` | OpenTUI terminal chat |
| `bun run lint` | Biome check |
| `bun run fix` | Biome check + autofix |
| `bun run typecheck` | `tsc --noEmit` |

> The web UI (`bun run dev` / `bun run start`) is still being wired up.

## What I'm learning

Notes-to-self on the concepts this project exists to teach me:

- **Harness vs. model** — the loop, tools, and memory are what turn a model into an agent.
- **The ReAct loop** — generate → call tools → feed results back → repeat until it stops.
- **Streaming as an async iterable** — the provider yields events; the UI renders rounds.
- **Errors-as-values** — failed tool calls flow back to the model instead of crashing.
- **Ports & adapters** — the session store is an interface, so SQLite can drop in later.
- **Stateless memory** — replaying the full transcript each turn is how memory works.
- **Cancellation** — an `AbortSignal` threaded end-to-end stops a run cleanly.

## License

MIT © 2026 Luis S. — see [LICENSE](LICENSE).

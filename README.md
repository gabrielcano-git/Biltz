# biltz

Orquestra agentes de codificação (gemini, claude, kimi, cursor) executando tarefas de `tasks.md` no formato OpenSpec.

## Quickstart

```bash
npm install -g biltz
# ou localmente
npm link

# Inicializa configuração interativa
biltz init

# Inicia o loop de orquestração
biltz start

# Verifica setup
biltz doctor

# Status das tarefas
biltz status

# Para graciosamente uma instância em execução
biltz stop
```

## Formato OpenSpec (tasks.md)

```markdown
# Sprint 1

- [ ] 1 Setup projeto [E]
- [ ] 2 Implementar parser [M] (deps: 1)
- [ ] 3 Testes unitários [H] (deps: 2)
- [x] 4 CI/CD [E]
```

Status: `[ ]` pending, `[DOING]` em execução, `[x]` done, `[FAILED]` falhou.
Dificuldade: `[E]` easy, `[M]` medium, `[H]` hard.

## Configuração (biltz.yml)

```yaml
version: 1
spec: openspec
agents:
  - gemini
  - claude
routing:
  easy:
    agent: gemini
    model: gemini-1.5-flash-latest
  medium:
    agent: claude
    model: claude-sonnet-4-20250514
    fallbacks:
      - agent: gemini
        model: gemini-1.5-pro-latest
  hard:
    agent: claude
    model: claude-opus-4-20250514
options:
  max_parallel: 1
  agent_timeout_seconds: 1800
  log_dir: .biltz/logs
  on_failure: stop
  poll_interval_ms: 5000
```

## Comandos

- `biltz init` — wizard interativo para criar `biltz.yml`
- `biltz start` — inicia o orquestrador
- `biltz start --dry-run` — simula sem executar
- `biltz start --once` — executa uma única tarefa
- `biltz start --max-parallel 2` — paralelismo (v0.2)
- `biltz doctor` — valida configuração e agentes
- `biltz status` — árvore de tarefas
- `biltz stop` — sinaliza parada graciosa

## Exit codes

| Cenário | Exit |
|---------|------|
| Sucesso | 0 |
| Agente falha + on_failure: stop | 1 |
| Config/lock/agente ausente | 2 |
| Deadlock/ciclo | 3 |

# 🤝 Guia de Contribuição

Obrigado por querer contribuir com o Assistente Virtual IA! Este guia explica como organizar o trabalho no GitHub e as convenções do projeto.

---

## Fluxo de Trabalho

Usamos o **GitHub Flow**:

1. Crie uma branch a partir de `main`
2. Faça seus commits
3. Abra um Pull Request
4. Solicite review
5. Faça merge após aprovação

---

## Nomenclatura de Branches

```
<tipo>/<descricao-curta>

Exemplos:
feature/fluxo-agendamento
fix/debounce-mensagens-audio
docs/atualiza-setup
infra/docker-compose-redis
```

| Tipo | Uso |
|---|---|
| `feature/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `docs/` | Documentação |
| `infra/` | Infraestrutura/config |
| `refactor/` | Refatoração sem mudança de comportamento |
| `test/` | Testes |

---

## Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(escopo): descrição curta em português ou inglês

Exemplos:
feat(n8n): adiciona fluxo de debounce com Redis
fix(evolution): corrige envio de mensagens de áudio
docs(setup): atualiza guia de configuração do n8n
infra(docker): adiciona serviço Redis ao compose
```

| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `infra` | Infraestrutura e configs |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Tarefas de manutenção |

---

## Issues

### Criando uma Issue

Antes de criar, verifique se já existe uma issue similar.

Use o template apropriado:
- **🐛 Bug Report** — Para reportar comportamentos inesperados
- **✨ Feature Request** — Para propor novas funcionalidades
- **📋 Task** — Para tarefas de desenvolvimento planejadas

### Labels

Aplique as labels corretas ao criar/triagem de issues:

| Label | Quando usar |
|---|---|
| `feature` | Nova funcionalidade |
| `bug` | Erro ou comportamento inesperado |
| `documentation` | Melhorias na documentação |
| `automation` | Fluxos n8n |
| `dashboard` | Frontend |
| `infra` | Docker, CI/CD |
| `ai` | OpenAI, Whisper |
| `database` | Supabase, schemas |
| `whatsapp` | Evolution API |
| `priority: high` | Impacto alto ou bloqueante |
| `priority: medium` | Importante, mas não urgente |
| `priority: low` | Pode aguardar |

---

## Pull Requests

- Vincule o PR à issue correspondente usando `Closes #123` na descrição
- Preencha o template de PR completamente
- Um review é necessário para fazer merge em `main`
- Mantenha os PRs pequenos e focados (prefira PRs menores)

---

## Estrutura de Código

### Fluxos n8n

- Exporte os fluxos como JSON e salve em `src/automation/flows/`
- Nomeie o arquivo com o prefixo do tipo: `flow-nome-do-fluxo.json`
- Documente o fluxo no cabeçalho do JSON com `"description"`

### Dashboard

- Use TypeScript
- Componentes na pasta `components/`
- Siga o padrão de imports absolutos configurado no `tsconfig.json`
- Estilize com Tailwind CSS

---

## Dúvidas?

Abra uma issue com a label `question` ou inicie uma discussão na aba **Discussions** do repositório.

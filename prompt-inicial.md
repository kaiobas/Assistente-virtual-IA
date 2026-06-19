# Prompt Inicial — Configurar Projeto no opencode

Use este prompt ao iniciar um novo repositório no opencode. Ele instrui a IA a analisar o projeto e criar toda a configuração necessária automaticamente.

## Instruções de uso
1. Abra o repositório no opencode
2. Cole o prompt abaixo como primeira mensagem
3. A IA vai analisar, perguntar o que precisar, e criar tudo

---

```
Analise este repositório e configure o opencode para trabalhar nele. Siga os passos abaixo:

## 1. Análise do projeto
- Detecte a stack (linguagem, framework, banco de dados, runtime)
- Identifique a estrutura de diretórios
- Descubra se usa Prisma, Docker, testes, lint, etc
- Leia package.json, tsconfig, Dockerfile, docker-compose, Makefile, etc

## 2. Crie um CLAUDE.md com:
- Descrição do projeto (baseada no README ou package.json)
- Stack detectada
- Comandos principais (dev, build, test, lint, type-check)
- Estrutura de diretórios
- Convenções de código que façam sentido para a stack encontrada:
  - Nomenclatura (camelCase, PascalCase, kebab-case)
  - Padrão de commits (convencional ou outro)
  - Organização (feature-first, layer-first)
- Se detectar Prisma + PostgreSQL, inclua seção de RAG Context
- Bons hábitos (ler antes de editar, testes, tipos estritos, segurança)

## 3. Crie/atualize opencode.json com:
- `$schema` apontando para https://opencode.ai/config.json
- Permissões seguras
- Instruções apontando para CLAUDE.md
- Skills paths para diretório skills/ (se existir)
- Agentes que façam sentido para a stack detectada (ex: RAG agent se tiver Prisma)

## 4. Se aplicável, crie skills:
- Se tiver Prisma + banco → skill de RAG context com embeddings (Ollama ou OpenAI)
- Se tiver testes → skill de boas práticas de teste
- Sempre inclua skill de clean code se o projeto for TypeScript/JavaScript

## 5. Regras importantes
- Não seja invasivo — respeite a estrutura existente
- Prefira configuração mínima viável, não polua o repositório
- Pergunte antes de criar arquivos se não tiver certeza
- Use português para nomes de commits e comentários
- Código e variáveis em inglês
- TypeScript estrito se detectar TypeScript
- Variáveis de ambiente nunca commitadas

Vou revisar o que você criar antes de finalizar.
```

# Skill: OpenCode Setup

Configura o ambiente de desenvolvimento com opencode.

## Comandos

```bash
# Inicializar opencode no projeto
opencode init

# Listar agentes disponíveis
opencode agent list

# Executar agente específico
opencode run rag-agent "buscar contexto sobre agendamentos"

# Verificar configuração
opencode doctor
```

## Estrutura opencode.json

O arquivo `opencode.json` na raiz define:
- **Agents**: especialistas em cada domínio (WhatsApp, RAG, IA, Dashboard)
- **Skills**: habilidades reutilizáveis (RAG, n8n, WhatsApp)
- **Rules**: regras que o opencode segue automaticamente
- **Language**: português como idioma padrão

## Integração com Prisma

O opencode usa o schema Prisma para entender a estrutura de dados e fornecer contexto RAG automaticamente ao gerar respostas.

## Extensões

```json
{
  "skills": {
    "rag-context": { "description": "Busca contexto vetorial via Prisma" },
    "n8n-workflow": { "description": "Cria fluxos n8n" },
    "whatsapp-evolution": { "description": "Configura Evolution API" }
  }
}
```

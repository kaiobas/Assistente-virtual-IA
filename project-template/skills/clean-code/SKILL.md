---
name: clean-code
description: |
  Use para garantir qualidade de código, boas práticas e padrões consistentes.
  Ativa quando o usuário pedir "revisar", "melhorar", "refatorar", "clean code", "boas práticas".
---

# Skill: Clean Code

Padrões de código limpo e boas práticas para projetos TypeScript/JavaScript.

## Princípios gerais
- **DRY** — Don't Repeat Yourself. Extraia lógica repetida em funções/utilidades
- **KISS** — Keep It Simple. Prefira a solução mais simples que funciona
- **SRP** — Single Responsibility. Uma função/módulo faz uma coisa só
- **Nomes significativos** — nomes de variáveis e funções revelam intenção
- **Sem side effects** — funções puras quando possível

## TypeScript
- Preferir `interface` sobre `type` para objetos públicos
- Usar `type` para unions, tuples, e utilitários
- `strict: true` no tsconfig — `strictNullChecks`, `noImplicitAny`, etc
- Evitar `any` — usar `unknown` se o tipo for realmente indeterminado
- Usar `as const` para constantes e enums literais
- Preferir `z.infer<typeof schema>` para tipos derivados de schemas de validação

## React / Frontend
- Componentes puros (sem lógica de efeito misturada)
- Estado o mais próximo possível de onde é usado
- Custom hooks para lógica reutilizável
- Preferir `useMutation`/`useQuery` (TanStack Query) sobre `useEffect` para dados

## Organização de arquivos
- Feature-first: agrupar por funcionalidade, não por tipo
- Um componente/arquivo exporta uma única coisa como `default`
- Testes ao lado do arquivo que testam: `Componente.tsx` + `Componente.test.tsx`

## Padrão de commits
```
feat: adiciona autenticação por magic link
fix: corrige cálculo de horário no fuso UTC-3
docs: atualiza README com instruções de deploy
refactor: extrai lógica de embedding para serviço separado
chore: atualiza dependências do Prisma
```

## Checklist antes de finalizar
- [ ] Removeu imports não usados?
- [ ] Removeu `console.log` de debug?
- [ ] Tipagem explícita em parâmetros e retornos?
- [ ] Tratamento de erro (não apenas `catch` vazio)?
- [ ] Nome de variável/função claro?
- [ ] Cobre edge cases (null, undefined, arrays vazios)?

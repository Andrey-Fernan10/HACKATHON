# Registro de uso de IA (AI_LOG)

[English](AI_LOG.md) · **Português (Brasil)**

Registrem aqui como o time usou inteligência artificial no projeto. O uso de IA é liberado e incentivado, desde que documentado: este arquivo é entregável obrigatório e serve de roteiro para o bloco “IA na prática” da apresentação.

A documentação do projeto deve ser escrita **em inglês** (a versão principal é o [`AI_LOG.md`](AI_LOG.md)), com uma **versão em português** ao lado. Mantenham as duas versões alinhadas.

Mantenham este arquivo na **raiz** do repositório. Incluam as ferramentas utilizadas e, para cada uso relevante, o prompt principal, o que a IA gerou, o que o time aproveitou e o que foi corrigido ou rejeitado — e por quê.

Nunca commitem chaves de API, senhas ou outros segredos. Esses valores vão em `.env` (fora do repositório) e em GitHub Secrets.

Copiem o modelo abaixo sempre que precisarem de uma entrada nova.

## Ferramentas

- ChatGPT

## Modelo de registro

```markdown
### [data] — [tarefa ou trecho]
- **Prompt principal:**
- **O que a IA gerou:**
- **O que o time aproveitou:**
- **O que o time corrigiu ou rejeitou, e por quê:**
```

## Registro

### 24/11/2026 — Autenticação JWT (exemplo)

- **Prompt principal:** "Gere um middleware de autenticação JWT em Node.js/Express, com tratamento de token expirado e uma rota protegida de exemplo."
- **O que a IA gerou:** um middleware e um exemplo de rota, com uma dependência desatualizada e sem validação de variáveis de ambiente.
- **O que o time aproveitou:** a estrutura do middleware e o fluxo de verificação do token.
- **O que o time corrigiu ou rejeitou, e por quê:** atualizamos a biblioteca, movemos o segredo para variável de ambiente e incluímos testes. O exemplo de rota foi reescrito para se adequar ao nosso modelo de usuário.

### [24/11] — [Desenvolvimento da Ideia]

- **Prompt principal:** "Analise o diagrama inicial do nosso MVP de monitoria inteligente com triagem por IA para alunos do Senac. Aponte falhas no fluxo e sugira melhorias práticas de usabilidade para evitarmos um sistema básico demais e resolvermos de fato o problema das dúvidas repetidas."
- **O que a IA gerou:** uma análise do fluxograma inicial destacando pontos positivos (separação de papéis e ciclo de retorno) e falhas de lógica (ambiguidade na condição `SE = APRESENTA`, ausência do papel do monitor e falta de uma base de conhecimento). Para evoluir o MVP, sugeriu pré-triagem em tempo real com detecção de duplicidade e urgência, fila inteligente para monitores, indexação das dúvidas resolvidas e botão de confirmação ("Resolveu?").
- **O que o time aproveitou:** Como era basicamente uma analise do projeto inicial, partimos para aproveitar suas sugestões afim de melhorar esse conceito e poder ser melhor explorado.
- **O que o time corrigiu ou rejeitou, e por quê:** Como era apenas sugestões para melhora do desenvolvimento da ideia, o que corrigimos foi posteriormente seu prompt afim de que pudesse entender melhor o contexto do projeto e pudesse trabalhar de maneira mais eficiente.

### [24/11] — [Refinamento do Fluxo e Regras de Negócio]

- **Prompt principal:** "Detalhar o funcionamento do sistema como um fórum de dúvidas (estilo Brainly) com triagem por IA para buscar correlações já respondidas, escalonamento para fila humana caso não resolva, sistema de respostas comunitárias com selo de constância, aval de validação do professor e seleção livre de perfil (aluno/professor) no login."
- **O que a IA gerou:** uma validação da arquitetura conceitual do fórum e recomendações práticas de design e escopo para o MVP: justificar a seleção livre de perfil no login para facilitar testes, diferenciar visualmente os status das respostas (professor, comunidade com selo e avaliada), estruturar a busca por correlação combinando tags e similaridade semântica, definir estados claros no ciclo de vida da pergunta e organizar a interface em quatro pilares (feed filtrável, prévia de similares ao digitar, painel de triagem/aval e perfil com selos).
- **O que o time aproveitou:** A ideia de perfil verificado e a estrutura do ciclo de perguntas foram coisas que puderam ser bem aproveitadas no desenrolar do projeto
- **O que o time corrigiu ou rejeitou, e por quê:** A organização da tela foi alterada levemente com o fim de deixar mais prático e melhor para a equipe estruturar.
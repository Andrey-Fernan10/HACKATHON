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

### [24/11] — [Evolução do Diagrama e Modelagem Inicial]

- **Prompt principal:** "Enviar print do fluxo atualizado do sistema ('dei uma melhoradinha, o que acha?') com os primeiros blocos de dados e etapas de triagem para validar a evolução da arquitetura."
- **O que a IA gerou:** uma avaliação do diagrama refinado destacando o acoplamento inicial com atributos de dados (`USER`, `question_box` e `respostas`), a clareza na etapa de correlação por IA e o fechamento do ciclo da base de respostas. Também apontou ajustes no fluxo do `ELSE` para sair do filtro de IA, refinamento de campos e chaves das entidades, e o caminho para respostas comunitárias de outros alunos.
- **O que o time aproveitou:**  A sugestão para melhora de fluxo e sua sugestão para início
- **O que o time corrigiu ou rejeitou, e por quê:** Tornar o diagrama muito complexo e perder seu essencial para distrair do principal do projeto.

### [24/11] — [Definição de Stack e Automação de IA]

- **Prompt principal:** "Apresentar o consenso da stack (HTML, CSS e JS no front-end, SQLite no banco e Java + Python para automação da IA) e perguntar se compensa manter tudo em Java de forma prática."
- **O que a IA gerou:** uma análise comparando manter Java + Python versus concentrar tudo em Java no back-end, apontando que fazer tudo em Java reduz a complexidade operacional e de ambientes no MVP mantendo a praticidade via API de IA, além de detalhar quando Python ainda faria sentido, como estruturar o serviço de IA em Java e cuidados práticos com o SQLite.
- **O que o time aproveitou:** Sua sugestão de uso de Java para potencializar ao máximo o uso de nossa aplicação.
- **O que o time corrigiu ou rejeitou, e por quê:** O uso de Python pelo motivo de deixar mais complexo um trabalho que já era grande, então já que não eram todos que tinham afinidade com essa linguagem, preferimos focar nosso backend apenas em Java

### [25/11] — [Início da Codificação: Entidade User em Java]

- **Prompt principal:** "Mostrar o primeiro rascunho em Java da classe `User` (com campos privados, construtor e getters/setters) como início da implementação e pedir avaliação."
- **O que a IA gerou:** uma revisão da classe `User` destacando o encapsulamento e construtor inicial, sugerindo ajustes imediatos (adicionar `id`, `Role` em enum e pensar no tratamento de `password`), indicando o que adiar para não travar o MVP (padrão Builder formal e selo de contribuidor) e apresentando um exemplo atualizado da classe.
- **O que o time aproveitou:** O código aprimorado pela IA
- **O que o time corrigiu ou rejeitou, e por quê:** Algumas das sugestões que foram trazidas junto ao código por motivos de preferência.

### [25/11] — [Configuração de CI com GitHub Actions para Java]

- **Prompt principal:** "Pedir o passo a passo de como criar um workflow inicial no GitHub Actions para rodar em Pull Requests e pushes na main, adaptando o build para o back-end em Java."
- **O que a IA gerou:** um guia passo a passo para criar `.github/workflows/ci.yml`, configurar checkout e Java 17 (Temurin), compilar/testar com Maven (ou `javac` para arquivos avulsos), enviar via Git e acompanhar a execução na aba Actions.
- **O que o time aproveitou:** O tutorial para criar o .yml e aproveitou para entender melhor como funcionava.
- **O que o time corrigiu ou rejeitou, e por quê:** Arrumar naquele momento o pom.xml por conta que não foi visto como necessário

### [26/11] — [Revisão da Estrutura de Pastas do Repositório]

- **Prompt principal:** "Foi mostrado o print da estrutura atual da pasta do projeto no VS Code para avaliar a organização das pastas, documentação, CI e código Java."
- **O que a IA gerou:** uma análise da estrutura da pasta `HACKATHON` destacando os acertos (workflow de CI na raiz, documentação bilíngue e separação inicial do backend em Java) e os pontos de atenção (organização da pasta `main` junto a `model`, arquivo `ci.yml` ainda não versionado no Git e ausência das demais camadas/pastas do MVP como repositório, serviço de IA e front-end).
- **O que o time aproveitou:** 
- **O que o time corrigiu ou rejeitou, e por quê:** As pastas de frontend que foram sugeridas foram feitas em um esquema.

### [26/11] — [Início do Front-end: Tela de Registro]

- **Prompt principal:** "Mostrar o início do front-end com o HTML de registro e pedir avaliação e próximos passos para integrar com a classe `User` em Java."
- **O que a IA gerou:** uma análise do HTML inicial apontando o redirecionamento direto no botão e o desalinhamento dos valores dos rádios com o enum `Role` do Java, acompanhada de um `registro.html` estruturado com `<form>`, um `registro.js` com `fetch` para enviar os dados em JSON e o próximo passo de expor a rota no back-end Java.
- **O que o time aproveitou:**  O código principal mandado pela IA depois de revisar.
- **O que o time corrigiu ou rejeitou, e por quê:**
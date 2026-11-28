# Monitoria Inteligente / Smart Mentorship

[English](#english) · [Português (Brasil)](#português-brasil)

---

## Português (Brasil) {#português-brasil}

# Monitoria Inteligente

[English](#english) · Português (Brasil)

Preencham este README e mantenham-no atualizado. Ele faz parte da entrega e deve permanecer na raiz do repositório, junto com DECISIONS.md e AI_LOG.md (e as versões em português: README.pt-BR.md, DECISIONS.pt-BR.md e AI_LOG.pt-BR.md).

A documentação do projeto deve ser escrita em inglês (a versão principal é o [README.md](#english)), com uma versão em português ao lado. Mantenham as duas versões alinhadas.

Criem, dentro do repositório, as pastas de cada parte do projeto que forem desenvolver (por exemplo, /backend, /frontend, /docs). A organização é escolha do time — descrevam-na na seção [Estrutura de pastas](#estrutura-de-pastas).

No primeiro dia, adicionem o professor como colaborador do repositório, com o e-mail **adrianoanschau@gmail.com.

## Equipe

- Turma: TDS — turmas mistas 6570, 6756 e 6863
- Tech Lead: Luísa Lopes
- Responsável pela apresentação: Andrey Fernandes
- Integrantes:
  - Luisa — luisalopes11
  - João Vitor — GHuser26-dev
  - Andrey — Andrey-Fernan10
  - Murilo — murilomachadofelix

## Tema / área

Monitoria inteligente — vida no campus e comunidade

## Problema

A proposta da nossa aplicação é tentar resolver a dificuldade que os estudantes podem vivenciar para localizar e acessar monitorias de acordo com suas necessidades acadêmicas.
Esta aplicação tem como público-alvo, principalmente, alunos que precisam de auxílio nos estudos e desejam encontrar ajuda com monitores de acordo com suas determinadas disciplinas.

## Solução

O Monitoria Inteligente é uma aplicação desenvolvida para facilitar a conexão entre alunos e monitores, permitindo que os estudantes encontrem monitorias disponíveis de acordo com suas necessidades e disciplinas. A plataforma busca tornar o processo de acompanhamento acadêmico mais organizado e acessível, facilitando a consulta e o gerenciamento das informações relacionadas às monitorias, com apoio da API Gemini para triagem de perguntas e geração de filtros inteligentes (`POST /api/questions/ai-filters`), fallback de modelos, múltiplas tentativas por modelo e cache dos filtros no `localStorage`.

MVPs – Monitoria Inteligente
1. Autenticação de usuários:
  - Login de usuários.
  - Identificação do perfil (Professor ou Aluno).
  - Cadastro de nome, e-mail e senha.
2. Gerenciamento de perguntas:
  - Aluno pode enviar perguntas.
  - Armazenamento do texto das perguntas.
  - Identificação do aluno que enviou a pergunta.
3. Filtro inteligente com IA:
  - Análise das perguntas recebidas.
  - Identificação de perguntas relacionadas por correlação.
  - Encaminhamento das perguntas conforme o resultado da análise.
4. Área do professor:
  - Visualização da caixa de perguntas dos alunos.
  - Acesso às perguntas recebidas.
  - Possibilidade de responder às perguntas.
5. Sistema de respostas:
  - Armazenamento do texto das respostas.
  - Associação da resposta à pergunta correspondente.
  - Registro de avaliação da resposta (good_response, inicialmente falso).
6. Visualização das perguntas respondidas:
  - Apresentação das perguntas que já possuem respostas.
  - Exibição das respectivas respostas para os alunos.

## Stack

Linguagem utilizada:
  Front-End:
- JavaScript (HTML e CSS integrados em `src/main/resources/static`)

  Back-End:
- Java (Spring Boot, `HttpClient`, Spring JPA);
- Integração com a API Gemini (`QuestionTriageService`) para triagem e filtros inteligentes

O projeto será desenvolvido, inicialmente, para web (servido em serviço único pelo back-end, com arquivos estáticos em `src/main/resources/static`).

## Estrutura de pastas

Descrevam a organização do repositório. Ajustem o exemplo abaixo à escolha do time.

```text
/
├── README.md
├── README.pt-BR.md
├── DECISIONS.md
├── DECISIONS.pt-BR.md
├── AI_LOG.md
├── AI_LOG.pt-BR.md
├── .env.example
├── backend/
│   ├── pom.xml
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   │           ├── application.properties
│   │           └── static/
└── docs/
```

## Como rodar

### Pré-requisitos

Back-End:
  - Java JDK 17
  - Apache Maven
  - Spring Boot 3.3.5
  - SQLite

Front-End:
  - Navegador Web atualizado

Ferramentas de desenvolvimento:
  - Visual Studio Code
  - Git

### Back-end

# comandos para instalar dependências e subir o back-end

### Back-end

```bash
#    (As dependências do Spring Boot e do SQLite vêm do pom.xml e são baixadas automaticamente pelo Maven;
cd backend && .\mvnw.cmd clean spring-boot:run
```

### Front-end


# comandos para instalar dependências e subir o front-end


## CI/CD

Pipeline de GitHub Actions configurada para executar build, lint e testes em pull requests e pushes na branch main (ajustar conforme os workflows ativos no repositório).

## Deploy

O deploy automático ainda não foi configurado.

## Links

- Repositório:
- Deploy (se houver):
- **https://github.com/Andrey-Fernan10/HACKATHON.git**
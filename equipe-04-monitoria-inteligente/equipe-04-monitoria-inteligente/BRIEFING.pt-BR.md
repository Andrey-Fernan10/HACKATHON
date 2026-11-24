# Briefing do tema: Monitoria inteligente

[English](BRIEFING.md) · **Português (Brasil)**

**Hack com IA: Codando com Inteligência**  
Senac na Prática · Técnico em Desenvolvimento de Sistemas  
Área: vida no campus e comunidade  
Imersão de 23/11 a 29/11 · apresentações em 30/11 e 01/12

Este briefing é o ponto de partida do **seu** tema. Leiam com calma, recortem um MVP que caiba em uma semana e registrem as decisões. Vocês vão transformar este problema em um produto real, com front-end e back-end, repositório organizado e uso documentado de IA. Esta é uma imersão colaborativa: a banca avalia o que o time construiu, decidiu e aprendeu.

## Tema e contexto

**Monitoria inteligente** — Plataforma que conecta alunos com dúvidas a monitores, com IA para triagem das perguntas.

No campus, a dúvida raramente espera a próxima aula. Ela aparece no corredor, no intervalo ou à noite, na frente do exercício que não fecha. Muitos estudantes recorrem a grupos de mensagens lotados, em que a mesma pergunta se repete, a resposta se perde no histórico e quem poderia ajudar — monitores e colegas mais avançados — não consegue ver com clareza o que é urgente, o que é simples e o que já foi respondido.

O resultado é familiar: monitores sobrecarregados, alunos desistindo de perguntar e um conhecimento que não fica registrado para a próxima turma. Vocês vão atacar esse problema no Senac, no cotidiano do Técnico em Desenvolvimento de Sistemas e das demais turmas do campus.

## Público e personas

- **Aluno com dúvida:** quer uma resposta confiável, no recorte da disciplina, sem precisar “caçar” alguém no grupo.
- **Monitor ou colega que apoia:** precisa de uma fila organizada, com contexto da pergunta, para responder o que ainda não tem solução.
- **Professor (visão opcional no MVP):** pode acompanhar os temas que mais geram dúvida, sem transformar a ferramenta em diário de classe oficial.

## Objetivo

Entregar um MVP em que o aluno registra uma dúvida, a IA faz a triagem (tema, dificuldade, possível duplicata) e um monitor consegue assumir, responder e encerrar a pergunta — com histórico consultável.

## Requisitos mínimos (MVP)

O recorte abaixo é realista para uma semana. Fechem-no no primeiro dia e registrem no `DECISIONS.md` o que entra, o que fica de fora e por quê. É melhor um fluxo completo e demonstrável do que uma lista longa pela metade.

1. O aluno autentica-se de forma simples (mesmo que seja um cadastro básico) e envia uma pergunta, com disciplina ou assunto e um texto claro.
2. A IA classifica a pergunta (tema, nível aproximado de dificuldade) e indica se já existe uma dúvida parecida respondida.
3. Há uma fila ou lista de perguntas abertas para o monitor, com o resultado da triagem visível.
4. O monitor assume uma pergunta, registra a resposta e altera o status (aberta, em andamento, respondida).
5. O aluno acompanha o status da própria dúvida e visualiza a resposta.
6. Existe uma busca ou listagem das perguntas já respondidas, para reaproveitar o que o time já resolveu.

## Onde a IA entra

O uso de IA é liberado e incentivado — no produto e no processo — e precisa aparecer no `AI_LOG.md`. Algumas frentes concretas neste tema:

- Classificar a pergunta por disciplina, assunto e dificuldade, a partir do texto.
- Detectar dúvidas repetidas e sugerir a resposta já publicada, para o aluno ou o monitor validarem.
- Sugerir um rascunho de resposta para o monitor revisar — nunca publicar automaticamente como se fosse a resposta final.
- Ajudar o aluno a reescrever a pergunta quando ela estiver vaga demais para ser triada.

Não publiquem, sem revisão de vocês, um texto ou uma decisão automática da IA como se já fosse a versão final.

## Extras opcionais

Só depois que o MVP estiver em pé. São ideias, não obrigações:

- Anexar imagem ou trecho de código à pergunta.
- Horários de disponibilidade do monitor.
- Aviso quando a dúvida for assumida ou respondida.
- Visão simples dos temas mais frequentes para o professor.

## Fora de escopo

Para proteger o prazo e o foco do produto:

- Substituir a aula ou a correção oficial de trabalhos e provas.
- Pagamento ou bolsas de monitoria.
- Um ambiente virtual de aprendizagem completo (notas, frequência, material oficial da disciplina).
- Publicar, sem revisão humana, uma resposta gerada por IA como se fosse a do monitor.

## Perguntas para guiar o time

Usem estas perguntas no primeiro dia, ao definir o MVP, e de novo antes da demo:

- O que acontece se nenhuma pessoa assumir a pergunta em um prazo razoável?
- Como evitar que dois monitores respondam a mesma dúvida ao mesmo tempo?
- Como vocês deixam claro, na interface, o que veio da IA e o que foi validado por uma pessoa?
- Que informação mínima a pergunta precisa ter para a triagem funcionar de verdade?
- Como um aluno encontra, no histórico, uma resposta em que possa confiar?

## Entregáveis e como a banca avalia

Esta é uma **imersão colaborativa** de uma semana, com times de 3 ou 4 estudantes do TDS. A banca avalia o trabalho de **vocês**, no próprio projeto — um retorno formativo, não uma comparação com outros times.

**O que precisa estar pronto no repositório** (raiz), em **inglês** (versão principal) e em **português** (`.pt-BR`), com o link entre os idiomas no topo de cada arquivo:

- `README.md` e `README.pt-BR.md`
- `DECISIONS.md` e `DECISIONS.pt-BR.md`
- `AI_LOG.md` e `AI_LOG.pt-BR.md`

A aplicação precisa ter **front-end e back-end**. O back-end pode ser **Java**, **Python** ou **Node.js** (isolados ou combinados, desde que integrados). O front-end é obrigatório (web, desktop ou mobile). Justifiquem a stack no `DECISIONS.md`. Também são obrigatórios o histórico com Conventional Commits, o trabalho via Pull Request com revisão, a proteção da `main` e uma pipeline de **GitHub Actions** verde (build, lint e testes) em PRs e na `main`. Não commitem segredos. No primeiro dia, adicionem o professor como colaborador: **adrianoanschau@gmail.com**.

O **congelamento do código** é no domingo, **29/11, às 23h59**. As apresentações são em **15 minutos + 5 minutos de perguntas**, nos dias 30/11 e 01/12, no Senac de Canoas, Sala 103. Ensaiem a demo e o roteiro (problema e solução, demo ao vivo, fluxo de trabalho, decisões, IA na prática e CI/CD).

A avaliação tem **duas bancas, com o mesmo peso**:

- **Banca Técnica (50%):** qualidade de código e arquitetura; Git, Conventional Commits e PRs; CI/CD; domínio do código nas perguntas.
- **Banca de Inovação e Impacto (50%):** originalidade; impacto (o problema real e para quem); experiência do usuário; clareza do pitch; uso criativo da IA.

Qualquer pessoa do time pode ser perguntada sobre qualquer parte do projeto. Usem a IA com inteligência, registrem o que ela gerou e o que vocês corrigiram, e assumam o código que forem apresentar.

Bom trabalho — e que a semana seja intensa, colaborativa e bem documentada.


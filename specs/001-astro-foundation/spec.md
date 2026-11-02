# Feature Specification: Fundação técnica e pipeline estático

**Feature Branch**: `astro`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Fundação técnica do Facillit Games: criar a casca vazia da aplicação e o pipeline de build estático, sem nenhuma tela de jogo. Entrega um projeto Astro com output estático, TypeScript strict, Tailwind, React habilitado para ilhas client:only, gerenciado por pnpm, com Vitest configurado e rodando, e lint/format configurados. A POC atual (index.html, script.js, style.css) permanece congelada e intocada. Não inclui o contrato GameDefinition, schema de persistência, design system, telas ou qualquer jogo — isso vem nas fases seguintes. O objetivo verificável é: pnpm install && pnpm build gera artefato estático publicável em CDN, pnpm test roda o Vitest com sucesso, e a configuração não inviabiliza ilhas client:only para estado de partida."

## Nota sobre o leitor desta spec

O "usuário" desta feature não é o jogador: é **quem constrói as fases seguintes**
(Fase 3 — contrato de jogo, Fase 4 — design system, Fase 5 — primeiro jogo) e o
**pipeline de publicação**. A feature não entrega nenhuma tela ao jogador final.

As tecnologias nomeadas aqui não são decisões desta spec. Elas são **restrições
herdadas** da seção "Additional Constraints" da constituição (`Stack fixa`), que
só pode ser alterada por emenda. Esta spec as trata como dado de entrada, não
como escolha de implementação.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Artefato estático reproduzível a partir de um clone novo (Priority: P1)

Quem assume as fases seguintes clona o repositório numa máquina limpa, roda um
par de comandos documentados e obtém um diretório de arquivos estáticos pronto
para publicar em CDN — sem configurar servidor, sem preencher variável de
ambiente, sem credencial.

**Why this priority**: sem isso nada depois pode ser publicado nem revisado. É a
única entrega desta fase sem a qual todas as outras são inúteis.

**Independent Test**: em um clone limpo, instalar as dependências e rodar o
build; verificar que o diretório de saída existe, contém um documento HTML
servível e que o processo termina com código de sucesso sem pedir nenhuma
configuração.

**Acceptance Scenarios**:

1. **Given** um clone novo do repositório sem dependências instaladas e sem
   variáveis de ambiente definidas, **When** o desenvolvedor roda o comando de
   instalação seguido do comando de build, **Then** ambos terminam com sucesso e
   um diretório de saída estático é produzido.
2. **Given** o build concluído, **When** o conteúdo do diretório de saída é
   servido por um servidor de arquivos estáticos sem nenhuma lógica, **Then** a
   página inicial carrega sem erro de console.
3. **Given** o build concluído, **When** o artefato é inspecionado, **Then** não
   há nenhuma função de servidor, handler, adapter de runtime ou arquivo que
   exija execução no servidor.

---

### User Story 2 - Suíte de testes executável desde o primeiro dia (Priority: P2)

Quem implementa a Fase 3 precisa escrever teste unitário de regra de pontuação
no primeiro commit. Para isso, o corredor de testes tem que existir, estar
configurado e provar que executa — antes de haver qualquer regra.

**Why this priority**: a constituição (Princípio III) proíbe regra de pontuação
sem teste unitário. Se o corredor de testes não estiver pronto nesta fase, a
Fase 3 começa violando a constituição ou para para configurá-lo.

**Independent Test**: rodar o comando de teste e verificar que ele relata ao
menos um teste executado e termina com código de sucesso.

**Acceptance Scenarios**:

1. **Given** as dependências instaladas, **When** o desenvolvedor roda o comando
   de teste, **Then** o corredor relata ao menos um teste executado, zero falhas,
   e termina com código de sucesso.
2. **Given** um teste que falha intencionalmente, **When** o comando de teste é
   rodado, **Then** ele termina com código de erro — ou seja, o comando
   realmente verifica algo e não passa vazio.
3. **Given** um módulo escrito em TypeScript com tipagem estrita, **When** um
   teste o importa, **Then** o teste resolve o módulo e seus tipos sem
   configuração adicional.

---

### User Story 3 - A configuração comprova que estado de navegador só roda no cliente (Priority: P3)

A casca precisa provar, antes de existir qualquer tela de partida, que é
possível montar um componente que só executa no navegador e **nunca** durante o
build.

**Why this priority**: é a armadilha mais caras desta base de código e um
princípio não negociável (Princípio IV). Descobrir na Fase 5 que a configuração
não suporta isso significa refazer as telas. Provar agora custa um componente
trivial.

**Independent Test**: criar um componente que leia uma API exclusiva de
navegador, montá-lo como ilha exclusiva de cliente, e verificar que o build
termina com sucesso (porque o componente não executou no build) e que o HTML
gerado não contém a marcação do componente.

**Acceptance Scenarios**:

1. **Given** um componente que acessa uma API disponível apenas no navegador,
   **When** o build é executado, **Then** o build termina com sucesso e não
   falha por ausência dessa API.
2. **Given** o HTML gerado pelo build, **When** ele é inspecionado, **Then** a
   marcação renderizada do componente exclusivo de cliente não está presente —
   confirmando que nada dele foi renderizado no build.
3. **Given** a página servida no navegador, **When** ela carrega, **Then** o
   componente aparece e lê a API de navegador sem erro e sem aviso de
   divergência de hidratação no console.

---

### User Story 4 - Lint e formatação com veredito consistente (Priority: P4)

Qualquer pessoa ou agente que abra um PR obtém o mesmo veredito de estilo e
qualidade estática que o revisor, rodando um comando local.

**Why this priority**: evita revisão gastando atenção em formatação. Útil, mas o
projeto avança sem isso — por isso é a última prioridade.

**Independent Test**: rodar o comando de lint e o de verificação de formatação
numa árvore limpa e confirmar que ambos passam; introduzir uma violação óbvia e
confirmar que o comando correspondente falha.

**Acceptance Scenarios**:

1. **Given** a árvore de trabalho recém-criada por esta feature, **When** os
   comandos de lint e de verificação de formatação são rodados, **Then** ambos
   terminam com sucesso e sem aviso.
2. **Given** um arquivo com formatação fora do padrão configurado, **When** a
   verificação de formatação é rodada, **Then** ela termina com código de erro
   apontando o arquivo.
3. **Given** um arquivo com erro de tipagem, **When** a verificação de tipos é
   rodada, **Then** ela termina com código de erro apontando o arquivo.

---

### Edge Cases

- **A POC publicada é alterada por acidente.** A POC (`index.html`, `script.js`,
  `style.css`) continua no ar até o cutover da Fase 6. Qualquer alteração nesses
  três arquivos — inclusive reformatação automática por ferramenta de estilo — é
  reprovação. A configuração de lint e formatação MUST excluí-los.
- **A nova aplicação colide com a POC na raiz do repositório.** Os arquivos da
  POC vivem na raiz. A nova aplicação precisa conviver com eles sem sobrescrever,
  e seu diretório de saída de build não pode coincidir com a raiz.
- **Build num ambiente sem rede após instalar.** O build MUST NOT depender de
  acesso à rede nem de serviço externo em tempo de build.
- **Build num ambiente sem variáveis de ambiente.** Nenhuma variável de ambiente
  ou segredo MUST ser necessário para instalar, construir ou testar.
- **Diretório de saída e artefatos de ferramenta versionados por acidente.** O
  diretório de saída do build, o cache de ferramentas e `node_modules` MUST ser
  ignorados pelo controle de versão.
- **Gerenciador de pacotes divergente.** Instalar com um gerenciador diferente do
  fixado na constituição produz árvore de dependências diferente da revisada; o
  repositório MUST declarar o gerenciador esperado.

## Requirements *(mandatory)*

### Functional Requirements

**Pipeline e artefato**

- **FR-001**: O repositório MUST declarar um comando de instalação e um comando
  de build que, nessa ordem, produzam um artefato estático a partir de um clone
  limpo.
- **FR-002**: O build MUST produzir exclusivamente arquivos estáticos
  publicáveis em CDN — sem função de servidor, sem adapter de runtime, sem
  processo residente.
- **FR-003**: A instalação, o build e os testes MUST NOT exigir variável de
  ambiente, segredo, credencial ou serviço externo.
- **FR-004**: O repositório MUST declarar explicitamente o gerenciador de
  pacotes e sua versão, e MUST versionar o arquivo de lock correspondente.
- **FR-005**: A aplicação MUST ter uma página inicial mínima que carregue sem
  erro, servindo apenas como prova de que o pipeline funciona. Ela MUST NOT
  conter navegação de jogo, lista de jogos, cadastro de jogadores ou qualquer
  elemento de marcador de pontuação.

**Tipagem**

- **FR-006**: A verificação de tipos MUST rodar em modo estrito e MUST estar
  disponível como comando próprio, falhando com código de erro diante de erro de
  tipo.
- **FR-007**: O modo estrito MUST NOT ser relaxado por arquivo, por diretório ou
  por diretiva de supressão.

**Testes**

- **FR-008**: O repositório MUST declarar um comando de teste que execute a
  suíte unitária e termine com código de erro quando algum teste falhar.
- **FR-009**: A suíte MUST conter ao menos um teste que execute de fato,
  comprovando que o corredor está operante — e não um comando que passa vazio.
- **FR-010**: Os testes MUST resolver módulos TypeScript do projeto sem
  configuração adicional por teste.

**Renderização no cliente**

- **FR-011**: A configuração MUST permitir declarar um componente como ilha
  exclusiva de cliente, que não executa nenhuma vez durante o build.
- **FR-012**: A feature MUST incluir um componente mínimo de prova, montado como
  ilha exclusiva de cliente, que acesse uma API disponível apenas no navegador e
  demonstre que o build não a executa. Esse componente MUST NOT ler nem escrever
  estado de partida e MUST NOT persistir nada.
- **FR-013**: A documentação da fundação MUST registrar, no plano e no
  `AGENTS.md` se necessário, que estado de partida pertence a ilha exclusiva de
  cliente, para que as fases seguintes não precisem redescobrir isso.

**Qualidade estática**

- **FR-014**: O repositório MUST declarar um comando de lint e um comando de
  verificação de formatação, ambos terminando com código de erro diante de
  violação.
- **FR-015**: Lint, formatação e verificação de tipos MUST excluir `index.html`,
  `script.js` e `style.css` do escopo, para que nenhuma ferramenta os altere.

**Congelamento da POC**

- **FR-016**: `index.html`, `script.js` e `style.css` MUST permanecer
  byte-a-byte idênticos ao estado anterior a esta feature.
- **FR-017**: A nova aplicação MUST conviver na mesma árvore que a POC sem
  sobrescrever nenhum dos três arquivos, e seu diretório de saída de build MUST
  ser distinto da raiz do repositório.

**Escopo negativo (verificável)**

- **FR-018**: Esta feature MUST NOT introduzir o contrato de definição de jogo,
  schema persistido, leitura ou escrita de armazenamento local, design system,
  tokens de cor de produto, nem qualquer pasta de jogo.

### Key Entities

Não se aplica: esta feature não introduz nenhum dado persistido nem nenhuma
entidade de domínio. O schema persistido é escopo da Fase 3.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num clone limpo, dois comandos documentados produzem um artefato
  estático publicável, em ambiente sem nenhuma variável de ambiente definida.
- **SC-002**: O artefato pode ser servido por um servidor de arquivos estáticos
  sem lógica alguma e a página inicial carrega com zero erro de console.
- **SC-003**: O comando de teste relata ao menos um teste executado e zero
  falhas; introduzir uma falha proposital faz o comando terminar com erro.
- **SC-004**: O comando de verificação de tipos reprova um erro de tipo
  introduzido propositalmente.
- **SC-005**: O build conclui com sucesso mesmo contendo um componente que
  acessa API exclusiva de navegador, e o HTML gerado não contém a marcação desse
  componente.
- **SC-006**: A diferença desta feature contra o estado anterior mostra zero
  linha alterada em `index.html`, `script.js` e `style.css`.
- **SC-007**: Lint e verificação de formatação passam na árvore entregue, sem
  aviso suprimido e sem exceção por arquivo além do congelamento da POC.
- **SC-008**: Uma busca pelo artefato e pelo código da aplicação não encontra
  nenhuma referência a armazenamento local, a schema persistido nem a nome de
  jogo.

## Assumptions

- O leitor desta spec é quem implementa as fases seguintes, não o jogador final.
  A feature não entrega valor visível ao jogador — por decisão, não por omissão.
- As tecnologias são restrição da constituição (`Stack fixa`), não escolha desta
  spec. Trocá-las exige emenda, não alteração de spec.
- A publicação em produção fica fora desta feature. A criação do projeto na
  plataforma de hospedagem é passo humano, decidido na issue pai; aqui basta que
  o build local produza artefato estático válido e que nenhuma configuração de
  servidor ou credencial seja necessária.
- A página inicial entregue é descartável: a Fase 4 a substitui pelo design
  system e pelas telas reais. Investir em aparência agora é desperdício.
- O componente de prova de ilha exclusiva de cliente também é descartável, mas
  o **teste** de que o build não o renderiza deve sobreviver, porque guarda o
  Princípio IV contra regressão.
- A verificação de "zero erro de console" e de hidratação é feita manualmente
  nesta fase. Teste de navegador automatizado não está no escopo da fundação.
- A POC e a nova aplicação coexistem na mesma branch até o cutover da Fase 6; o
  cutover não é escopo desta feature.

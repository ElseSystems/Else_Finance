# Ferramentas — Else_Finance

Manual dos comandos deste repositório. O `./tools.sh` lê os blocos `<!-- ferramenta -->` abaixo e monta o menu navegável com as setas.

No menu: seta para cima e para baixo mudam o item, Enter executa, seta para a esquerda volta.

## Git

### Ver o que mudou

Mostra quais arquivos foram criados, alterados ou apagados e se ainda falta salvar ou enviar.

Comando: `git status`

### Ver a diferença linha a linha

Mostra o texto que mudou nos arquivos, antes de salvar no histórico.

Comando: `git diff`

### Ver os últimos salvamentos

Lista os 15 últimos pontos salvos no histórico, do mais novo para o mais antigo.

Comando: `git log --oneline -15`

### Salvar as alterações neste computador

Junta tudo que mudou nesta pasta e grava um ponto no histórico local. Ainda não envia para a nuvem.

Comando: `git add -A && git commit -m "$RESPOSTA"`

### Baixar o que está na nuvem

Traz para este computador os commits que já estão no GitHub.

Comando: `git pull`

### Enviar para a nuvem

Envia os salvamentos locais da branch atual para o GitHub.

Comando: `git push -u origin HEAD`

<!-- ferramenta
categoria: Git
titulo: Ver o que mudou
comando: git status
explica: Mostra quais arquivos foram criados, alterados ou apagados e se ainda falta salvar ou enviar.
confirma: nao
pergunta: 
-->

<!-- ferramenta
categoria: Git
titulo: Ver a diferença linha a linha
comando: git diff
explica: Mostra o texto que mudou nos arquivos, antes de salvar no histórico.
confirma: nao
pergunta: 
-->

<!-- ferramenta
categoria: Git
titulo: Ver os últimos salvamentos
comando: git log --oneline -15
explica: Lista os 15 últimos pontos salvos no histórico, do mais novo para o mais antigo.
confirma: nao
pergunta: 
-->

<!-- ferramenta
categoria: Git
titulo: Salvar as alterações neste computador
comando: git add -A && git commit -m "$RESPOSTA"
explica: Junta tudo que mudou nesta pasta e grava um ponto no histórico local. Ainda não envia para a nuvem.
confirma: sim
pergunta: Mensagem curta do que você mudou
-->

<!-- ferramenta
categoria: Git
titulo: Baixar o que está na nuvem
comando: git pull
explica: Traz para este computador os commits que já estão no GitHub.
confirma: sim
pergunta: 
-->

<!-- ferramenta
categoria: Git
titulo: Enviar para a nuvem
comando: git push -u origin HEAD
explica: Envia os salvamentos locais da branch atual para o GitHub.
confirma: sim
pergunta: 
-->


## Docker

### Este repositório não usa Docker

Não há docker-compose nem compose.yml aqui. Nada de container para subir ou desligar.

<!-- ferramenta
categoria: Docker
titulo: Este repositório não usa Docker
comando: 
explica: Não há docker-compose nem compose.yml aqui. Nada de container para subir ou desligar.
confirma: nao
pergunta: 
-->


## Scripts do projeto

### npm run dev

Sobe o projeto no seu computador para você usar e testar enquanto programa.

Comando: `npm run dev`

### npm run build

Gera a versão pronta para publicar, a partir do código atual.

Comando: `npm run build`

### npm run build:dev

Roda o script npm 'build:dev', definido no package.json como: vite build --mode development

Comando: `npm run build:dev`

### npm run lint

Procura erros de estilo e problemas simples no código.

Comando: `npm run lint`

### npm run preview

Abre uma prévia local da versão já gerada pelo build.

Comando: `npm run preview`

<!-- ferramenta
categoria: Scripts do projeto
titulo: npm run dev
comando: npm run dev
explica: Sobe o projeto no seu computador para você usar e testar enquanto programa.
confirma: nao
pergunta: 
-->

<!-- ferramenta
categoria: Scripts do projeto
titulo: npm run build
comando: npm run build
explica: Gera a versão pronta para publicar, a partir do código atual.
confirma: sim
pergunta: 
-->

<!-- ferramenta
categoria: Scripts do projeto
titulo: npm run build:dev
comando: npm run build:dev
explica: Roda o script npm 'build:dev', definido no package.json como: vite build --mode development
confirma: nao
pergunta: 
-->

<!-- ferramenta
categoria: Scripts do projeto
titulo: npm run lint
comando: npm run lint
explica: Procura erros de estilo e problemas simples no código.
confirma: nao
pergunta: 
-->

<!-- ferramenta
categoria: Scripts do projeto
titulo: npm run preview
comando: npm run preview
explica: Abre uma prévia local da versão já gerada pelo build.
confirma: nao
pergunta: 
-->


## Deploy

### Sem script de deploy nesta pasta

Não há deploy.sh na raiz nem em scripts/. Publicar, se existir, está em outro lugar ou ainda não foi automatizado.

<!-- ferramenta
categoria: Deploy
titulo: Sem script de deploy nesta pasta
comando: 
explica: Não há deploy.sh na raiz nem em scripts/. Publicar, se existir, está em outro lugar ou ainda não foi automatizado.
confirma: nao
pergunta: 
-->

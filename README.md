# Conversor de Markdown para PDF

Aplicação web local (Node.js + Express) para converter arquivos `.md` em PDFs com boa formatação — sem depender de nenhum serviço na nuvem. Tudo roda no seu computador, usando o Chrome ou Edge já instalados para gerar o PDF.

![Uso local](https://img.shields.io/badge/uso-100%25%20local-2f6b4f)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)

📖 Documentação completa na **[Wiki do projeto](../../wiki)**.

## Recursos

- **Arraste e solte** um ou vários arquivos `.md` / `.markdown` / `.txt`
- **Prévia** do conteúdo renderizado antes de converter
- **Um PDF por arquivo** ou **um único PDF unificado**, na ordem que você definir (reordenação com ▲ ▼)
- **Sumário/índice automático**, gerado a partir dos títulos (`#`, `##`, `###`) do Markdown, com links internos clicáveis
- **Controle de tamanho de fonte** (slider de 50% a 100%) aplicado a todo o PDF
- Papel **A4** ou **Letter**, margens compacta/normal/ampla e numeração de páginas opcional
- Suporte a **GFM** (tabelas, listas de tarefas, etc.) e **realce de sintaxe** em blocos de código
- Nada é enviado para servidores externos — a conversão roda no seu navegador Chrome/Edge local

## Instalação rápida

Pré-requisitos: [Node.js](https://nodejs.org) 18+ e Google Chrome ou Microsoft Edge instalados.

```powershell
git clone https://github.com/ErickGomesSilva/conversor-md-pdf.git
cd conversor-md-pdf
npm install
npm start
```

### Atalho no Windows

O arquivo [`iniciar.bat`](iniciar.bat) instala as dependências (na primeira vez), sobe o servidor e abre o navegador automaticamente. Você pode criar um atalho dele na Área de Trabalho para abrir a ferramenta com um clique.

## Como usar

1. Arraste seus arquivos `.md` para a área de envio (ou clique para selecionar).
2. Confira a prévia de cada arquivo.
3. Ajuste as opções de PDF (papel, margem, sumário, tamanho de fonte, numeração de páginas).
4. Escolha entre **um PDF por arquivo** ou **um único PDF com todos** (reordenando a fila se precisar).
5. Clique em converter — o(s) PDF(s) são baixados automaticamente.

Para a lista completa de opções e detalhes de cada uma, veja a página **[Opções e Configurações](../../wiki/Opções-e-Configurações)** da Wiki.

## Estrutura do projeto

```
├── server.js              # Servidor Express + geração do PDF via Puppeteer
├── lib/
│   └── pdf-template.js     # HTML/CSS usados para renderizar o PDF
├── public/
│   ├── index.html          # Interface da aplicação
│   ├── app.js               # Lógica do front-end (fila, prévia, conversão)
│   └── styles.css           # Estilo da interface
└── iniciar.bat             # Atalho para Windows (instala + inicia + abre o navegador)
```

## Documentação

A documentação detalhada — instalação, opções, solução de problemas e perguntas frequentes — está na **[Wiki](../../wiki)**:

- [Início](../../wiki/Home)
- [Instalação e primeiros passos](../../wiki/Instalação-e-Primeiros-Passos)
- [Opções e Configurações](../../wiki/Opções-e-Configurações)
- [Perguntas Frequentes (FAQ)](../../wiki/Perguntas-Frequentes)

## Licença

Distribuído sob a licença [MIT](LICENSE).

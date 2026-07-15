# Agenda de Contatos

App simples de agenda de contatos em HTML5, CSS3 e JavaScript puro (sem frameworks,
sem dependências externas). Persistência via `LocalStorage`.

## Estrutura

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Como usar

Basta abrir `index.html` no navegador — não precisa de servidor.

Para publicar no GitHub Pages:

1. Suba a pasta para um repositório no GitHub.
2. Em *Settings → Pages*, aponte para a branch `main` (pasta raiz).
3. O app ficará em `https://<usuario>.github.io/<repositorio>/`.

## Funcionalidades

- Cadastro de contatos: nome, telefone e e-mail (e-mail é opcional).
- Validação: nome e telefone obrigatórios, e-mail validado quando preenchido,
  bloqueio de contatos duplicados (mesmo nome + telefone).
- Pesquisa em tempo real por nome, telefone ou e-mail (ignora acentos e caixa).
- Edição: clique em "Editar" para carregar o contato no formulário; "Cancelar"
  descarta a edição sem alterar nada.
- Exclusão com confirmação antes de remover.
- Lista sempre ordenada por nome, com avatar de iniciais e contador de contatos.
- Acessibilidade: labels em todos os campos, foco visível, mensagens de erro em
  `aria-live`.
- Segurança: nenhum conteúdo digitado é inserido via `innerHTML` — tudo passa por
  `textContent`/`createElement`.

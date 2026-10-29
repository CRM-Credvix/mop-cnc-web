# CREDVIX DNA v4.0.1 - correcoes de login CAS (somente leitura)

O log de campo indicou que o robô desistiu antes de exibir a mensagem
'Autenticando no CAS: tentativa 1/2'. A versao v4.0 verificava qualquer
ocorrencia de 'CAPTCHA' ou 'token' no texto da pagina e tambem marcava
credenciais como rejeitadas antes de envia-las. Isso era um falso positivo
possivel e impedia a tentativa real.

- Verifica desafio interativo real (iframe de desafio de tamanho relevante,
  solicitacao visivel de codigo MFA ou imagens), distinguindo widget
  passivo de reCAPTCHA do bloqueio efetivo.
- Aceita que o formulario CAS carregue ate 7 segundos depois de DOMContentLoaded.
- Reconhece so mensagens explicitas e visiveis de senha invalida, sem tratar
  avisos genericos como erro de login.
- Identifica paginas autenticadas do Portal DNA por sinais da sessao, sem
  considerar a pagina CAS autenticada.
- Localiza inputs visiveis unicos mesmo com clones ocultos; bloqueia
  multiplos campos visiveis ambiguos.
- Em caso de login manual, reporta a etapa sem exibir URLs, senha ou CPF,
  e aguarda ate 18 segundos pela confirmacao apos ENTER.
- Mantem o dominio CAS estritamente permitido e o limite de ate duas
  tentativas; sem bypass de CAPTCHA, senha embutida ou alteracao de permissoes.

QA: 115 testes offline aprovados (11 regressoes novas). Login real no Edge ainda
nao homologado; execute o teste no Windows. Nenhum segredo foi incluido.
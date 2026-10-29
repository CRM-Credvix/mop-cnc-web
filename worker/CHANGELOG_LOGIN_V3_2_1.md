# Correcao DNA v3.2.1

- `INICIAR_ROBO_DNA.bat` distribuido no ZIP corrigido para UTF-8 sem BOM e CRLF.
- Ignora abas nao relacionadas do Edge, sem tentar preencher credenciais nelas.
- SSO externo permanece manual; apos ENTER, valida retorno ao DNA antes de continuar.
- Formulario duplicado deixa de encerrar inesperadamente e pede intervencao.
- Login local mantem ate duas tentativas; nenhuma alteracao de permissoes.
- Suite local do ZIP: 94 testes Python aprovados; login real no Windows requer validacao do operador.

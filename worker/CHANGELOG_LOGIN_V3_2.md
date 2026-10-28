# CREDVIX DNA v3.2 - Login automatico com reexecucao controlada

- Reaproveita a sessao Edge isolada quando o DNA ja esta autenticado.
- No primeiro uso, solicita usuario/senha **apenas no console local**. Depois de autenticado, guarda as credenciais no Windows Credential Manager (WinVault), nunca em texto puro.
- Nas proximas execucoes, tenta login automatico no dominio DNA permitido.
- Em falha transitoria de navegacao, tenta no maximo duas vezes com intervalo. Em senha rejeitada, nao repete; remove a credencial antiga do cofre.
- CAPTCHA, MFA, SSO externo e formulario ambiguo requerem intervencao manual, sem tentar contornar protecoes.
- Mantem todas as rotinas v3.1 de pesquisa CPF, verificacao do nome/login, duplicidade, leitura de 227 controles e gravacao bloqueada.
- Keyring fixado em 25.6.0, instalada pelo BAT com ambiente isolado.
- Testes: 85 de regressao aprovados localmente, incluindo 15 do login e simulacao de DOM Chromium. Login real no DNA depende de homologacao no computador do operador.
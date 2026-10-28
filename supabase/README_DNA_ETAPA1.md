# Gestão de Perfis DNA — Etapa 1 / Supabase

Projeto de produção: `ijcqgitluzefphomkkmo` (mop-cnc-web). Migrações aplicadas e verificadas em 28/10/2026.

## Banco

- `public.dna_modelos`: snapshots de Consultor 2 / Supervisor 1, versionados e imutáveis (sem registros ativos ainda).
- `public.dna_lotes`: fila de lotes com idempotência, estados, tempo de reserva e `modo='diagnostico'` obrigatório.
- `public.dna_itens`: até 50 pessoas por lote, resultados individuais, identidade única ou revisão.
- `public.dna_eventos`: auditoria append-only, proíbe UPDATE/DELETE.
- `dna_private.administradores`: autorização vinculada ao ID do usuário do Supabase Auth e e-mail confirmado. Nenhuma credencial é versionada.

## API e worker

- `public.dna_criar_lote(p_perfil, p_nomes, p_chave_idempotencia)`: RPC para conta autorizada. Só cria lote se houver modelo completo (224 permissões) homologado e ativo. Implementação privilegiada é privada.
- `public.dna_reivindicar_lote(p_trabalhador)`: apenas `service_role`, com `FOR UPDATE SKIP LOCKED` e lease de 10 min. O worker ainda não foi criado.
- RLS ativada nas quatro tabelas e leitura permitida somente ao administrador autenticado. Browser não faz INSERT/UPDATE/DELETE direto.

## Status e habilitação segura

O banco está implantado, mas **nenhum modelo foi carregado** e **nenhum lote foi criado**. Sem modelo homologado, a RPC recusa novos lotes. Não há acesso ao DNA, gravação de permissões nem robô conectado.

**Próxima entrega:** importar os dois JSONs de captura, reconciliar opções duplicadas, homologar snapshots e criar o robô Python em modo somente leitura. A operação de aplicação real exigirá migração futura separada para mudar a constraint de modo.

## Verificação

As duas migrações acima foram recuperadas da tabela de histórico `supabase_migrations.schema_migrations`. Não execute novamente em um banco onde já constam aplicadas. O SQL não modifica tabelas MOP-CNC existentes.

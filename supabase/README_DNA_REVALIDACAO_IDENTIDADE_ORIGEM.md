# DNA | Correção de revalidação sem redigitar identidade

## Motivo

Em 04/11/2026, o Supabase registrou recusas `42501` por identidade diferente da autorização do piloto. A interface mostrava apenas uma falha genérica. Nenhum segundo lote foi criado.

## Alteração

- A página usa `public.dna_web_revalidar_piloto(uuid)` para revalidar o **mesmo colaborador** do primeiro piloto concluído, sem solicitar CPF/nome novamente.
- A identidade original é recuperada **exclusivamente dentro da função privada** do Supabase, a partir do CPF criptografado e do nome autorizado do lote inicial. A função pública é `SECURITY INVOKER`; a privada valida o administrador.
- A autorização exige situação `confirmado`, validação independente, zero diferenças e gravação confirmada no piloto original.
- Uma única revalidação pode ser solicitada. O banco usa idempotência e mantém o vínculo com o lote inicial inalterado.
- Corrigido defeito: `v_piloto_ok` não pode ser reativado na revalidação e sobrescrever `lote_id` original.
- O site oculta a digitação de dados pessoais nessa revalidação e mostra erros categorizados por código seguro.

## Segurança

Os quatro modelos permanecem `ativo=false`. Apenas o agente Windows autorizado pode reservar/finalizar tarefas; esta atualização não aciona o DNA.

## Homologação

A estrutura SQL passou por transação revertida: permissão de administrador, bloqueio a `anon`, rejeição de idempotência nula e preservação do primeiro lote.

O operador deve atualizar a Administração, selecionar Consultor 2 e clicar **Solicitar padronização** uma única vez com o agente Windows conectado. Se o usuário continuar conforme, o resultado esperado é `ja_conforme`, sem gravação.

Não habilitar os quatro modelos globalmente com base somente neste teste.

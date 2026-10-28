/* CREDVIX DNA / etapa 3: importacao voluntaria de evidencia de leitura.
 * Nenhuma credencial local, token ou service_role. O Supabase valida cada controle
 * e aplica autorizacao por usuario no banco, nao pelo email mostrado na pagina.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const picker = $('dnaReportFiles');
  const button = $('dnaReportUpload');
  const refresh = $('dnaReportRefresh');
  const info = $('dnaReportInfo');
  const tbody = $('dnaReportRows');
  if (!picker || !button || !refresh || !tbody || !info) return;
  const client = window.MOP_SUPABASE;
  if (!client) return;

  function message(text, isError = false) {
    info.textContent = text;
    info.style.color = isError ? '#b91c1c' : '';
  }
  function shorten(v) { return String(v || '').slice(0, 8); }
  function formatDate(value) {
    try { return new Intl.DateTimeFormat('pt-BR', {dateStyle:'short',timeStyle:'short'}).format(new Date(value)); }
    catch (_) { return '—'; }
  }
  function cell(row, value) { row.insertCell().textContent = String(value ?? '—'); }
  function validReport(r) {
    if (!r || r.versao_relatorio !== 2 || r.gravou_no_dna !== false ||
        !['CONSULTOR','SUPERVISOR'].includes(r.perfil) ||
        !Array.isArray(r.controles_evidencia) || r.controles_evidencia.length !== 227 ||
        r.identidade_evidencia?.status !== 'nao_verificada') {
      throw new Error('Arquivo não é um diagnóstico DNA v2 válido. Gere novamente pelo robô atualizado.');
    }
    return r;
  }
  async function loadHistory() {
    if ($('dnaShell')?.hidden) return;
    refresh.disabled = true;
    try {
      const {data, error} = await client.from('dna_inspecoes')
        .select('id,perfil,resultado,divergencias_total,identidade_status,importado_em')
        .order('importado_em', {ascending:false}).limit(25);
      if (error) throw error;
      tbody.replaceChildren();
      for (const item of data || []) {
        const row = tbody.insertRow();
        cell(row, shorten(item.id));
        cell(row, formatDate(item.importado_em));
        cell(row, item.perfil === 'CONSULTOR' ? 'Consultor 2' : 'Supervisor 1');
        cell(row, item.divergencias_total);
        cell(row, item.identidade_status === 'nao_verificada' ? 'Identidade não confirmada' : 'Em revisão');
        cell(row, item.resultado === 'conforme_visual' ? 'Conforme na tela' : 'Divergências visuais');
      }
      if (!data?.length) {
        const row = tbody.insertRow();
        const td = row.insertCell(); td.colSpan = 6;
        td.className = 'dna-empty-row'; td.textContent = 'Nenhum relatório real importado.';
      }
    } catch (e) {
      message('Não foi possível consultar os relatórios: ' + (e?.message || 'erro de acesso'), true);
    } finally { refresh.disabled = false; }
  }
  async function uploadReports() {
    const files = Array.from(picker.files || []);
    if (!files.length) return message('Selecione um ou mais relatórios JSON.', true);
    if (files.length > 10) return message('Importe no máximo 10 relatórios por vez.', true);
    button.disabled = true;
    let successes = 0;
    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.json') || file.size > 180000 || file.size < 100) {
          throw new Error('Arquivo inválido ou maior que 180 KB: ' + file.name);
        }
        const report = validReport(JSON.parse(await file.text()));
        const {error} = await client.rpc('dna_registrar_inspecao', {p_relatorio: report});
        if (error) throw new Error(file.name + ': ' + error.message);
        successes++;
      }
      picker.value = '';
      message(successes + (successes === 1 ? ' relatório registrado. ' : ' relatórios registrados. ') +
        'Permissões não alteradas; identidade ainda requer confirmação.');
      await loadHistory();
    } catch (e) {
      message(successes + ' importado(s). ' + (e?.message || 'Falha na importação'), true);
    } finally { button.disabled = false; }
  }
  picker.addEventListener('change', () => {
    message((picker.files?.length || 0) + ' arquivo(s) selecionado(s). Clique em Registrar diagnósticos.');
  });
  button.addEventListener('click', uploadReports);
  refresh.addEventListener('click', loadHistory);
  // Acesso direto ao hash #auditoria: aguarda gate de autenticacao revelar o painel.
  const shell = $('dnaShell');
  if (shell && location.hash === '#auditoria') {
    const observer = new MutationObserver(() => {
      if (!shell.hidden) { observer.disconnect(); loadHistory(); }
    });
    if (!shell.hidden) loadHistory();
    else observer.observe(shell, {attributes:true, attributeFilter:['hidden']});
  }
  // So consulta apos usuario entrar na secao (gate DNA e politicas RLS mantidos).
  document.querySelectorAll('[data-target="auditoria"]').forEach(el =>
    el.addEventListener('click', () => { setTimeout(loadHistory, 0); }));
  window.addEventListener('hashchange', () => {
    if (location.hash === '#auditoria') loadHistory();
  });
})();
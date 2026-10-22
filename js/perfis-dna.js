(()=>{
  'use strict';

  const $ = (id) => document.getElementById(id);
  const root = $('dnaShell');
  const denied = $('dnaDenied');
  const stages = [...document.querySelectorAll('.dna-stage')];
  const sideLinks = [...document.querySelectorAll('.dna-side-link')];
  const profileInputs = [...document.querySelectorAll('input[name="dnaProfile"]')];
  const defaultNames = `Ana Martins\nBruno Rocha\nCarla Oliveira\nDiego Souza\nElisa Lima\nFábio Nunes\nGabriela Costa\nHugo Pereira\nÍris Duarte\nJoão Mendes`;

  const state = {
    stage: 'gestao',
    profile: 'CONSULTOR',
    profiles: {
      CONSULTOR: {
        label: 'Consultor',
        sub: 'Consultor 2',
        caps: 'CONSULTOR',
        pill: 'Padrão Consultor 2'
      },
      SUPERVISOR: {
        label: 'Supervisor',
        sub: 'Supervisor 1',
        caps: 'SUPERVISOR',
        pill: 'Padrão Supervisor 1'
      }
    }
  };

  function normalize(text){
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getNames(){
    return $('dnaNames').value
      .split(/\r?\n/)
      .map(v => v.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .slice(0, 50);
  }

  function profileData(){
    return state.profiles[state.profile];
  }

  function updateProfileCards(){
    document.querySelectorAll('[data-profile-card]').forEach(el => {
      el.classList.toggle('active', el.dataset.profileCard === state.profile);
    });
  }

  function updateReferenceBlocks(){
    const data = profileData();
    $('summaryProfileCaps').textContent = data.caps;
    $('summaryProfile').textContent = data.label;
    $('summarySubprofile').textContent = data.sub;
    $('conferencePatternPill').textContent = `🛡 ${data.pill}`;
    $('verificationPatternText').textContent = `Padrão aplicado: ${data.label} → ${data.sub}`;
    $('progressPatternText').textContent = `${data.label} · ${data.sub}`;
  }

  function updateCounts(){
    const count = getNames().length;
    $('dnaCountInline').textContent = `${count} ${count === 1 ? 'nome informado' : 'nomes informados'}`;
    $('previewCountText').textContent = `${count} ${count === 1 ? 'usuário informado' : 'usuários informados'}`;
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function renderConferenceTable(){
    const tbody = $('conferenceRows');
    const names = getNames();
    const examples = defaultNames.split(/\n/);
    const rows = names.length ? names : examples;
    const sample = rows.length === examples.length && rows.every((value, idx) => normalize(value) === normalize(examples[idx]));
    $('dnaFoundChip').textContent = sample ? '● 7 localizados' : '● Ainda não consultados';
    $('dnaAmbiguousChip').textContent = sample ? '● 2 nomes ambíguos' : '● Diagnóstico pendente';
    $('dnaMissingChip').textContent = sample ? '● 1 não localizado' : '● Sem consulta ao DNA';
    $('dnaWarningBox').hidden = !sample;
    tbody.innerHTML = '';

    rows.forEach((name, index) => {
      const tr = document.createElement('tr');
      let record = 'Cadastro único';
      let currentProfile = state.profile === 'CONSULTOR' ? 'Consultor' : (index % 2 === 0 ? 'Supervisor' : 'Consultor');
      let validation = '<span class="dna-tag dna-tag--green">● Identidade única</span>';
      let action = '<button class="dna-link-action" type="button">Conferir</button>';

      if(sample && (index === 5 || index === 6)){
        record = '2 cadastros';
        currentProfile = '—';
        validation = '<span class="dna-tag dna-tag--purple">● 2 resultados</span>';
        action = '<button class="dna-link-action" type="button">Revisar</button>';
      }
      if(sample && index === 9){
        record = 'Nenhum registro';
        currentProfile = '—';
        validation = '<span class="dna-tag dna-tag--red">● Não encontrado</span>';
        action = '<button class="dna-link-action" type="button">Revisar</button>';
      }

      if(!sample){
        record = 'Não consultado';
        currentProfile = '—';
        validation = '<span class="dna-tag dna-tag--blue">● Aguardando integração</span>';
        action = 'Prévia local';
      }

      tr.innerHTML = `
        <td>${escapeHtml(name)}</td>
        <td>${record}</td>
        <td>${currentProfile}</td>
        <td>${validation}</td>
        <td>${action}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function stageMeta(stage){
    const map = {
      gestao: 'Início › Gestão de Perfis DNA',
      conferencia: 'Início › Conferência de usuários',
      acompanhamento: 'Início › Acompanhamento do lote',
      auditoria: 'Início › Auditoria DNA'
    };
    return map[stage] || map.gestao;
  }

  function showStage(stage){
    stage = state.profiles[stage] ? 'gestao' : (['gestao','conferencia','acompanhamento','auditoria'].includes(stage) ? stage : 'gestao');
    state.stage = stage;
    stages.forEach(section => section.classList.toggle('active', section.dataset.stage === stage));
    sideLinks.forEach(link => link.classList.toggle('active', link.dataset.target === stage));
    $('dnaBreadcrumb').innerHTML = stageMeta(stage).replace('›', '<span>›</span>');
    window.location.hash = stage;
  }

  function applyProfileFromInputs(){
    const checked = document.querySelector('input[name="dnaProfile"]:checked');
    state.profile = checked ? checked.value : 'CONSULTOR';
    updateProfileCards();
    updateReferenceBlocks();
  }

  function bindEvents(){
    sideLinks.forEach(link => link.addEventListener('click', () => showStage(link.dataset.target)));
    document.querySelectorAll('[data-target]:not(.dna-side-link)').forEach(btn => btn.addEventListener('click', () => showStage(btn.dataset.target)));
    profileInputs.forEach(input => input.addEventListener('change', () => {
      applyProfileFromInputs();
      renderConferenceTable();
    }));
    $('dnaNames').addEventListener('input', () => {
      $('dnaNames').setCustomValidity('');
      updateCounts();
      renderConferenceTable();
    });
    document.querySelectorAll('.dna-link-action').forEach(el => el.addEventListener('click', (ev) => {
      ev.preventDefault();
      alert('Prévia demonstrativa: ainda não existe consulta ou execução real no DNA.');
    }));
    $('goConference').addEventListener('click', () => {
      const count = $('dnaNames').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean).length;
      if(count < 1 || count > 50){
        $('dnaNames').setCustomValidity('Informe de 1 a 50 nomes, um por linha.');
        $('dnaNames').reportValidity();
        return;
      }
      $('dnaNames').setCustomValidity('');
      showStage('conferencia');
    });
  }

  async function gate(){
    try{
      const client = window.MOP_SUPABASE;
      if(!client){
        throw new Error('Cliente Supabase ausente');
      }
      const { data, error } = await client.auth.getUser();
      if(error || !data?.user){
        location.replace('index.html');
        return;
      }
      const email = data.user.email || '';
      if(normalize(email) !== 'crm@credvix.com'){
        denied.hidden = false;
        return;
      }
      $('userName').textContent = email;
      root.hidden = false;
      $('dnaNames').value = $('dnaNames').value || defaultNames;
      applyProfileFromInputs();
      updateCounts();
      renderConferenceTable();
      bindEvents();
      showStage(location.hash.replace('#', '') || 'gestao');
    }catch(_err){
      denied.hidden = false;
    }
  }

  gate();
})();
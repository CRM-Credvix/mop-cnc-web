() => {
  "use strict";
  const normalizar = (valor) => String(valor || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const limpar = (valor) => String(valor || "").replace(/\s+/g, " ").trim();
  const TITULOS = new Map([
    ["funcoes consig", "Funções Consig"],
    ["funcoes para utilizacao do sistema", "Funções para Utilização do Sistema"],
    ["funcoes help", "Funções help"],
    ["acesso a telas", "Acesso a Telas"]
  ]);

  const visivel = (el) => {
    if (!el || !el.isConnected) return false;
    let atual = el;
    for (let i = 0; atual && i < 15; i++, atual = atual.parentElement) {
      const estilo = window.getComputedStyle(atual);
      if (estilo.display === "none" || estilo.visibility === "hidden" || estilo.visibility === "collapse") return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  function textoRotulo(el) {
    const candidatos = [];
    const adicionar = (t) => {
      const s = limpar(t);
      if (s && s.length <= 550 && !candidatos.includes(s)) candidatos.push(s);
    };
    adicionar(el.getAttribute("aria-label"));
    const by = el.getAttribute("aria-labelledby");
    if (by) adicionar(by.split(/\s+/).map(id => document.getElementById(id)?.textContent || "").join(" "));
    if (el.labels) Array.from(el.labels).forEach(l => adicionar(l.innerText || l.textContent));
    const paiLabel = el.closest("label");
    if (paiLabel) adicionar(paiLabel.innerText || paiLabel.textContent);
    if (el.id) {
      try {
        document.querySelectorAll("label[for]").forEach(l => {
          if (l.htmlFor === el.id) adicionar(l.innerText || l.textContent);
        });
      } catch (_e) { /* apenas leitura */ }
    }
    if (el.nextElementSibling) adicionar(el.nextElementSibling.innerText || el.nextElementSibling.textContent);
    // Formulários legados posicionam o checkbox e o texto dentro do mesmo div/td.
    let pai = el.parentElement;
    for (let profundidade = 0; pai && profundidade < 5; profundidade++, pai = pai.parentElement) {
      const qtd = pai.querySelectorAll('input[type="checkbox"], [role="checkbox"]').length;
      if (qtd !== 1) break;
      const texto = limpar(pai.innerText || pai.textContent);
      if (texto && texto.length <= 550) adicionar(texto);
    }
    // Evita rótulos globais da tela (ex.: 'Marcar/Desmarcar Todos' repetido).
    candidatos.sort((a, b) => a.length - b.length);
    return candidatos[0] || "";
  }

  function tituloExato(el) {
    if (!el || !el.tagName) return "";
    const tag = el.tagName.toLowerCase();
    if (!/^(div|span|legend|h[1-6]|strong|b|p|label|th|td)$/.test(tag)) return "";
    let textoProprio = "";
    for (const node of el.childNodes) {
      if (node.nodeType === 3) textoProprio += " " + node.textContent;
    }
    let chave = normalizar(textoProprio);
    if (!TITULOS.has(chave) && el.children.length <= 1) {
      chave = normalizar(el.textContent);
    }
    return TITULOS.get(chave) || "";
  }

  const formularios = [];
  let secao = "Seção não identificada";
  let subsecao = "";
  let checkboxPosicao = 0;
  let titulosVistos = [];
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT);
  let el;
  while ((el = walker.nextNode())) {
    const titulo = tituloExato(el);
    if (titulo && visivel(el)) {
      titulosVistos.push(titulo);
      if (titulo === "Acesso a Telas") {
        subsecao = titulo;
      } else {
        secao = titulo;
        subsecao = "";
      }
    }
    const isCheckbox = el.matches?.('input[type="checkbox"], [role="checkbox"]');
    if (!isCheckbox) continue;
    checkboxPosicao += 1;
    const visible = visivel(el) || (el.closest("label") && visivel(el.closest("label")));
    const checked = el.matches('input[type="checkbox"]') ? Boolean(el.checked)
      : el.getAttribute("aria-checked") === "true";
    const bruto = textoRotulo(el);
    const rotulo = bruto || `[SEM RÓTULO - posição ${checkboxPosicao}]`;
    const tecnico = (attr) => (el.getAttribute(attr) || "").slice(0, 250);
    formularios.push({
      ordem: checkboxPosicao,
      secao,
      subsecao,
      rotulo,
      rotulo_identificado: Boolean(bruto),
      marcado: checked,
      visivel: Boolean(visible),
      desabilitado: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true",
      controle_global: /marcar\s*\/\s*desmarcar\s+todos/i.test(rotulo),
      id: tecnico("id"),
      name: tecnico("name"),
      ng_model: tecnico("ng-model") || tecnico("data-ng-model"),
      aria_label: tecnico("aria-label")
    });
  }
  // Candidatos de identidade: lista estrita de ng-models da manutencao.
  // Nunca coleta senhas, cookies, tokens nem campos nao relacionados.
  const CAMPOS_CADASTRO = new Set([
    "usuario.id", "usuario.nome", "usuario.login", "usuario.codigo", "usuario.matricula"
  ]);
  const identidadeCandidatos = [];
  for (const entrada of document.querySelectorAll('[ng-model], [data-ng-model]')) {
    const campo = entrada.getAttribute('ng-model') || entrada.getAttribute('data-ng-model');
    if (!CAMPOS_CADASTRO.has(campo)) continue;
    const valor = String(entrada.value || entrada.getAttribute('value') || '').trim();
    if (valor && valor.length <= 140 &&
        !identidadeCandidatos.some(x => x.campo === campo && x.valor === valor)) {
      identidadeCandidatos.push({campo, valor});
    }
  }
  return {
    identidade_candidatos: identidadeCandidatos,
    itens: formularios,
    secoes_encontradas: [...new Set(titulosVistos)],
    total_dom: formularios.length,
    total_visiveis: formularios.filter(x => x.visivel).length
  };
}
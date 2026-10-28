() => {
  'use strict';
  // Return structural metadata only. Never return field values or secrets.
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g,' ');
  const visible = e => Boolean(e && e.isConnected && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none');
  const bodyText = norm((document.body && document.body.innerText || '').slice(0,12000));
  const pageAuth = /(?:sua sessao expira|voce esta logado com o usuario|sessao expira em)/.test(bodyText) ||
       (/(?:consulta de usuarios|manutencao de usuario|modulo de cadastro)/.test(bodyText) && !/(?:senha|password)\s*[:*]/.test(bodyText)) ||
       (/\bprincipal\b/.test(bodyText) && /\b(?:sair|cadastro|vendas|usuarios|propostas)\b/.test(bodyText));
  const challenge = /(?:selecione todas as imagens|selecione todos os quadrados|verificacao em duas etapas|codigo de verificacao|autenticacao de dois fatores|digite o codigo de verificacao|mfa|codigo enviado)/.test(bodyText) ||
    [...document.querySelectorAll('iframe')].some(e => /(?:recaptcha|hcaptcha|captcha|challenge)/i.test([e.src,e.title].join(' ')) && visible(e));
  const invalid = /(?:usuario ou senha invalid|senha incorret|credenciais invalid|dados de acesso invalid|senha invalid|usuario bloqueado|conta bloqueada|muitas tentativas|excesso de tentativas)/.test(bodyText);
  // Do not ever treat the password-change panel inside an authenticated module as login.
  const maintenancePage=/(?:manutencao de usuario|consulta de usuarios|propostas digitadas|alteracao de senha|alterar senha)/.test(bodyText);
  if (maintenancePage || pageAuth) {
    return {login:false,authenticated:pageAuth || maintenancePage,challenge,invalid:false,
      fields_ambiguous:false,username_index:null,password_index:null,submit_index:null};
  }
  const fields=[...document.querySelectorAll('input')];
  const eligible=fields.map((el,i)=>({el,i})).filter(({el})=>visible(el) && !['hidden','checkbox','radio','submit','button','reset','file'].includes((el.getAttribute('type')||'text').toLowerCase()));
  const passwords=eligible.filter(({el})=>(el.type||'').toLowerCase()==='password');
  if (passwords.length!==1) {
    return {login:false,authenticated:pageAuth && passwords.length===0,challenge,invalid,
      fields_ambiguous:passwords.length>1,username_index:null,password_index:null,submit_index:null};
  }
  const password=passwords[0];
  const root=password.el.closest('form')||document;
  const fieldHint=el => {
    const id=el.getAttribute('id')||'';
    const label=id?document.querySelector(`label[for="${CSS.escape(id)}"]`):null;
    return norm([el.getAttribute('autocomplete'),el.getAttribute('id'),el.getAttribute('name'),el.getAttribute('placeholder'),el.getAttribute('aria-label'),el.getAttribute('ng-model'),label?.textContent].join(' '));
  };
  const users=eligible.filter(({el})=>el!==password.el && ['text','email','tel','number'].includes((el.getAttribute('type')||'text').toLowerCase()));
  const points=users.map(v=>{
    const hint=fieldHint(v.el);
    const inForm=root===document||root.contains(v.el);
    let score=(inForm?20:0)+(/(?:usuario|user|login|email|e-mail|cpf|matricula)/.test(hint)?90:0)
      +(/(?:current-password|senha|password|codigo|token|otp)/.test(hint)?-100:0);
    if(v.el.getAttribute('autocomplete')==='username')score+=100;
    if(v.el.type==='email')score+=15;
    return {...v,score};
  }).sort((a,b)=>b.score-a.score);
  let user=null;
  if(points.length===1 && points[0].score>=20)user=points[0];
  if(points.length>1 && points[0].score>=85 && points[0].score-points[1].score>=50)user=points[0];
  const buttons=[...document.querySelectorAll('button,input[type="submit"],input[type="button"],a[role="button"]')];
  const candidates=buttons.map((el,i)=>{
    const label=norm([el.innerText,el.value,el.getAttribute('aria-label'),el.getAttribute('title')].filter(Boolean).join(' '));
    const inForm=root===document||root.contains(el);
    let score=(inForm?20:0)+(/^(?:entrar|acessar|login|iniciar sessao|fazer login|sign in)$/.test(label)?90:0)
      +(el.type==='submit'&&inForm?70:0);
    if(/(?:esqueci|recuperar|registrar|cadastrar|sair|cancelar|nova conta|alterar senha)/.test(label))score=-100;
    return {i,score,el};
  }).filter(o=>visible(o.el)&&!o.el.disabled).sort((a,b)=>b.score-a.score);
  let button=null;
  if(candidates.length===1 && candidates[0].score>=70)button=candidates[0];
  if(candidates.length>1 && candidates[0].score>=70 && candidates[0].score-candidates[1].score>=45)button=candidates[0];
  return {login:true,authenticated:false,challenge,invalid,fields_ambiguous:!user||!button,
    username_index:user?user.i:null,password_index:password.i,submit_index:button?button.i:null};
}
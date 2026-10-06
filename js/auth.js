(function(){
  const form=document.getElementById('loginForm');
  const email=document.getElementById('loginUser');
  const pass=document.getElementById('loginPass');
  const error=document.getElementById('loginError');
  const button=form?.querySelector('button[type="submit"]');
  const toggle=document.getElementById('togglePass');

  toggle?.addEventListener('click',()=>{pass.type=pass.type==='password'?'text':'password';});

  (async()=>{
    const {data}=await window.MOP_SUPABASE.auth.getSession();
    if(data.session) location.href='app.html';
  })();

  form?.addEventListener('submit',async(e)=>{
    e.preventDefault();
    error.hidden=true;
    button.disabled=true;
    button.textContent='Entrando...';

    const {error:signInError}=await window.MOP_SUPABASE.auth.signInWithPassword({
      email:email.value.trim(),
      password:pass.value
    });

    if(signInError){
      error.textContent='E-mail ou senha inválidos.';
      error.hidden=false;
      button.disabled=false;
      button.innerHTML='Entrar <span aria-hidden="true">→</span>';
      return;
    }

    location.href='app.html';
  });
})();

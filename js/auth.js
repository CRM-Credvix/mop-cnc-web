(function(){
  const form=document.getElementById('loginForm');
  const email=document.getElementById('loginUser');
  const pass=document.getElementById('loginPass');
  const error=document.getElementById('loginError');
  const button=form?.querySelector('button[type="submit"]');
  const toggle=document.getElementById('togglePass');
  const messages={
    'sem-loja':'Seu e-mail não possui loja liberada. Solicite o vínculo ao administrador.',
    erro:'Não foi possível validar seu acesso. Tente novamente.'
  };

  toggle?.addEventListener('click',()=>{pass.type=pass.type==='password'?'text':'password';});

  function showError(message){error.className='field-error';error.textContent=message;error.hidden=false;}
  async function enter(){
    const {data,error:accessError}=await window.MOP_SUPABASE
      .from('franquias_mop').select('codigo').limit(1);
    if(accessError){showError(messages.erro);return false;}
    if(!data?.length){
      await window.MOP_SUPABASE.auth.signOut({scope:'local'});
      showError(messages['sem-loja']);
      return false;
    }
    location.replace('app.html');
    return true;
  }

  (async()=>{
    const params=new URLSearchParams(location.search);
    if(params.get('senha')==='definida'){
      error.className='inline-alert success';
      error.textContent='Senha definida. Entre com seu e-mail e a nova senha. A loja precisa estar liberada pelo administrador.';
      error.hidden=false;
      return;
    }
    const reason=params.get('acesso');
    if(messages[reason]){showError(messages[reason]);return;}
    try{
      const {data}=await window.MOP_SUPABASE.auth.getUser();
      if(data.user)await enter();
    }catch(e){showError(messages.erro);}
  })();

  form?.addEventListener('submit',async(e)=>{
    e.preventDefault();
    error.hidden=true;
    button.disabled=true;
    button.textContent='Entrando...';
    try{
      const {error:signInError}=await window.MOP_SUPABASE.auth.signInWithPassword({
        email:email.value.trim(),password:pass.value
      });
      if(signInError){showError('E-mail ou senha inválidos.');return;}
      await enter();
    }catch(e){showError(messages.erro);}
    finally{
      button.disabled=false;
      button.innerHTML='Entrar <span aria-hidden="true">→</span>';
    }
  });
})();
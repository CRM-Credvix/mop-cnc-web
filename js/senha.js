(function(){
  const client=window.MOP_SUPABASE;
  const form=document.getElementById('passwordForm');
  const pass=document.getElementById('newPassword');
  const confirm=document.getElementById('confirmPassword');
  const feedback=document.getElementById('passwordFeedback');
  const button=form.querySelector('button[type="submit"]');
  let ready=false;

  function showError(message){feedback.textContent=message;feedback.hidden=false;}
  (async()=>{
    try{
      const {data:sessionData,error:sessionError}=await client.auth.getSession();
      if(sessionError||!sessionData.session)throw new Error('NO_SESSION');
      const {data,error}=await client.auth.getUser();
      if(error||!data.user?.email_confirmed_at)throw new Error('INVALID_SESSION');
      ready=true;
      form.hidden=false;
      button.disabled=false;
    }catch(error){
      showError('Link inválido ou expirado. Solicite um novo link ao administrador.');
    }finally{
      history.replaceState(null,'',location.pathname);
    }
  })();

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    if(!ready)return;
    feedback.hidden=true;
    if(pass.value.length<12||pass.value.length>128){
      showError('Use uma senha entre 12 e 128 caracteres.');return;
    }
    if(pass.value!==confirm.value){showError('As senhas não conferem.');return;}
    button.disabled=true;
    try{
      const {error}=await client.auth.updateUser({password:pass.value});
      if(error)throw error;
      pass.value='';confirm.value='';ready=false;
      try{await client.auth.signOut({scope:'local'});}catch(error){}
      location.replace('index.html?senha=definida');
    }catch(error){showError('Não foi possível definir a senha. Verifique o link e tente novamente.');}
    finally{button.disabled=!ready;}
  });
})();
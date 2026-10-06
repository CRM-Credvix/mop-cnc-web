(function(){
  const form=document.getElementById('firstAccessForm');
  const email=document.getElementById('firstEmail');
  const feedback=document.getElementById('firstFeedback');
  const button=form.querySelector('button[type="submit"]');
  const prefill=new URLSearchParams(location.search).get('email');
  if(prefill) email.value=prefill;

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    feedback.hidden=true;
    button.disabled=true;
    button.textContent='Enviando...';
    const value=email.value.trim().toLowerCase();
    try{
      const redirectTo=new URL('senha.html',location.href).href.split('?')[0].split('#')[0];
      const {error}=await window.MOP_SUPABASE.auth.signInWithOtp({
        email:value,
        options:{shouldCreateUser:false,emailRedirectTo:redirectTo}
      });
      if(error) throw error;
      feedback.className='inline-alert success';
      feedback.textContent='Se o e-mail estiver cadastrado, o link de primeiro acesso foi enviado. Verifique a caixa de entrada e o spam.';
      feedback.hidden=false;
      form.reset();
    }catch(error){
      feedback.className='inline-alert error';
      feedback.textContent='Não foi possível solicitar o link agora. Aguarde um momento e tente novamente.';
      feedback.hidden=false;
    }finally{
      button.disabled=false;
      button.innerHTML='Enviar link <span aria-hidden="true">→</span>';
    }
  });
})();
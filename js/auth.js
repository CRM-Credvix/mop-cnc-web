(function(){
  const form=document.getElementById('loginForm');
  const user=document.getElementById('loginUser');
  const pass=document.getElementById('loginPass');
  const error=document.getElementById('loginError');
  const toggle=document.getElementById('togglePass');
  toggle?.addEventListener('click',()=>{pass.type=pass.type==='password'?'text':'password';});
  form?.addEventListener('submit',(e)=>{
    e.preventDefault();
    if(!user.value.trim()||!pass.value.trim()){error.hidden=false;return;}
    error.hidden=true;
    sessionStorage.setItem('mopUser',user.value.trim());
    location.href='app.html';
  });
})();

// Supabase Edge Function - cadastro-dna-criar (NAO implantada)
// Autenticacao + autorizacao no servidor; CPF cifrado antes de chegar ao banco.
// Secrets obrigatorios: DNA_CADASTRO_ALLOWED_USER_IDS, DNA_CADASTRO_AES_KEY_HEX,
// DNA_CADASTRO_HMAC_KEY_HEX, DNA_CADASTRO_ALLOWED_ORIGIN.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao injetados pela plataforma.
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'

const ALLOWED_ORIGIN = Deno.env.get('DNA_CADASTRO_ALLOWED_ORIGIN') || ''
const headers = (origin: string | null) => ({
  'Content-Type': 'application/json; charset=utf-8',
  ...(origin === ALLOWED_ORIGIN && ALLOWED_ORIGIN ? {'Access-Control-Allow-Origin': origin, 'Vary': 'Origin'} : {}),
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})
const result = (status: number, data: unknown, origin: string | null) =>
  new Response(JSON.stringify(data), {status, headers: headers(origin)})

function hexBytes(value: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('CONFIGURACAO_CRIPTO_INVALIDA')
  return Uint8Array.from(value.match(/.{2}/g)!.map(v => parseInt(v, 16)))
}
function b64(bytes: Uint8Array): string {
  let s = ''
  for (let i=0; i<bytes.length; i+=8192) s += String.fromCharCode(...bytes.subarray(i,i+8192))
  return btoa(s)
}
function cpfValido(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false
  for (let n=9; n<=10; n++) {
    let soma=0
    for (let i=0; i<n; i++) soma += Number(value[i]) * (n+1-i)
    if (Number(value[n]) !== ((soma*10)%11)%10) return false
  }
  return true
}
function validar(raw: unknown) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('ENTRADA_INVALIDA')
  const data=raw as Record<string,unknown>
  const nome=String(data.nome||'').trim().replace(/\s+/g,' ')
  const cpf=String(data.cpf||'').replace(/\D/g,'')
  const nascimento=String(data.nascimento||'')
  const email=String(data.email||'').trim().toLowerCase()
  const telefone=String(data.telefone||'').replace(/\D/g,'')
  const perfil=String(data.perfil||'')
  const lojas=data.lojas
  const idempotencia=String(data.idempotencia||'')
  if (nome.length<5 || nome.length>140 || !nome.includes(' ') || !cpfValido(cpf)) throw new Error('COLABORADOR_INVALIDO')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) throw new Error('DATA_INVALIDA')
  const d=new Date(nascimento+'T12:00:00Z')
  if(Number.isNaN(d.valueOf()) || d.toISOString().slice(0,10)!==nascimento || d>new Date())throw new Error('DATA_INVALIDA')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254)throw new Error('EMAIL_INVALIDO')
  if (!/^\d{10,11}$/.test(telefone)) throw new Error('TELEFONE_INVALIDO')
  if (!['CONSULTOR','SUPERVISOR'].includes(perfil))throw new Error('PERFIL_INVALIDO')
  if (!Array.isArray(lojas) || lojas.length<1 || lojas.length>100 ||
      lojas.some(x=>typeof x!=='string'|| !/^\d+$/.test(x)) ||
      new Set(lojas).size!==lojas.length) throw new Error('LOJAS_INVALIDAS')
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencia))
    throw new Error('IDEMPOTENCIA_INVALIDA')
  return {nome,cpf,nascimento,email,telefone,perfil,lojas:lojas as string[],idempotencia}
}

Deno.serve(async req => {
  const origin=req.headers.get('origin')
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers:headers(origin)})
  if (req.method!=='POST') return result(405,{erro:'METODO_NAO_PERMITIDO'},origin)
  // Proibir origens web inesperadas. Clientes nao-web ainda dependem de JWT + UUID allowlist.
  if (origin && origin!==ALLOWED_ORIGIN) return result(403,{erro:'ORIGEM_NAO_PERMITIDA'},origin)
  const required=['DNA_CADASTRO_ALLOWED_USER_IDS','DNA_CADASTRO_AES_KEY_HEX',
    'DNA_CADASTRO_HMAC_KEY_HEX','DNA_CADASTRO_ALLOWED_ORIGIN',
    'SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']
  if(required.some(k=>!Deno.env.get(k)))return result(503,{erro:'RECURSO_NAO_HABILITADO'},origin)
  const bearer=req.headers.get('authorization')||''
  const jwt=/^Bearer\s+(.+)$/i.exec(bearer)?.[1]
  if (!jwt) return result(401,{erro:'AUTENTICACAO_OBRIGATORIA'},origin)
  const allowed=(Deno.env.get('DNA_CADASTRO_ALLOWED_USER_IDS')||'').split(',').map(s=>s.trim())
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{
    auth:{persistSession:false,autoRefreshToken:false}
  })
  try {
    const {data:{user},error:authError}=await supabase.auth.getUser(jwt)
    if(authError||!user) return result(401,{erro:'SESSAO_INVALIDA'},origin)
    if(!allowed.includes(user.id)) return result(403,{erro:'ACESSO_ADMIN_NEGADO'},origin)
    if(Number(req.headers.get('content-length')||'0')>8000)return result(413,{erro:'REQUISICAO_GRANDE'},origin)
    const body=await req.text()
    if(body.length>8000)return result(413,{erro:'REQUISICAO_GRANDE'},origin)
    let validated
    try{validated=validar(JSON.parse(body))}catch{return result(400,{erro:'DADOS_INVALIDOS'},origin)}
    const aes=await crypto.subtle.importKey('raw',hexBytes(Deno.env.get('DNA_CADASTRO_AES_KEY_HEX')!),'AES-GCM',false,['encrypt'])
    const hmac=await crypto.subtle.importKey('raw',hexBytes(Deno.env.get('DNA_CADASTRO_HMAC_KEY_HEX')!),{name:'HMAC',hash:'SHA-256'},false,['sign'])
    const enc=new TextEncoder()
    const iv=crypto.getRandomValues(new Uint8Array(12))
    const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,enc.encode(JSON.stringify(validated))))
    // payload no banco = IV(12 bytes) + ciphertext|tag (AES-GCM).
    const joined=new Uint8Array(iv.length+encrypted.length);joined.set(iv);joined.set(encrypted,iv.length)
    const digest=new Uint8Array(await crypto.subtle.sign('HMAC',hmac,enc.encode(validated.cpf)))
    const cpfHmac=Array.from(digest).map(x=>x.toString(16).padStart(2,'0')).join('')
    const {data,error}=await supabase.rpc('dna_cadastro_criar',{
      p_solicitante:user.id,p_idempotencia:validated.idempotencia,
      p_cpf_hmac:cpfHmac,p_cpf_final4:validated.cpf.slice(-4),
      p_lojas:validated.lojas,p_perfil:validated.perfil,p_cifra_base64:b64(joined)
    })
    if(error) {
      const code=['23505','42501','22023'].includes(error.code)?error.code:'FALHA'
      return result(code==='23505'?409:code==='42501'?403:400,{erro:code},origin)
    }
    return result(201,{id:data,status:'na_fila'},origin)
  } catch {
    return result(500,{erro:'ERRO_INTERNO'},origin)
  }
})

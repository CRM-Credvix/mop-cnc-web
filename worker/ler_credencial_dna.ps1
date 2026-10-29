param(
    [Parameter(Mandatory = $true)]
    [string]$CredentialFile
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path -LiteralPath $CredentialFile)) {
    throw "Credencial nao encontrada: $CredentialFile"
}

$data = Get-Content -LiteralPath $CredentialFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace([string]$data.username)) {
    throw 'Usuario vazio na credencial protegida.'
}
if ([string]::IsNullOrWhiteSpace([string]$data.password_protected)) {
    throw 'Senha protegida ausente na credencial.'
}

$secure = ConvertTo-SecureString ([string]$data.password_protected)
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $result = [ordered]@{
        username = [string]$data.username
        password = $plain
    }
    [Console]::Out.Write(($result | ConvertTo-Json -Compress))
}
finally {
    if ($null -ne $plain) { $plain = $null }
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
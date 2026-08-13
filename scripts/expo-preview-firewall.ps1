param(
  [ValidateSet("Enable", "Restore")]
  [string]$Mode = "Enable"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$nodePath = "C:\Users\Oyyh2\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$allowName = "Codex Expo Go Preview TCP 8082"
$statePath = Join-Path $PSScriptRoot "expo-preview-firewall-state.json"

function Get-MatchingTcpBlockRules {
  Get-NetFirewallApplicationFilter -PolicyStore ActiveStore |
    Where-Object { $_.Program -ieq $nodePath } |
    ForEach-Object { Get-NetFirewallRule -AssociatedNetFirewallApplicationFilter $_ } |
    Where-Object {
      $_.Direction -eq "Inbound" -and
      $_.Action -eq "Block" -and
      $_.Profile -match "Public" -and
      (Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_).Protocol -eq "TCP"
    }
}

if ($Mode -eq "Restore") {
  $previewRule = Get-NetFirewallRule -DisplayName $allowName -ErrorAction SilentlyContinue
  if ($previewRule) {
    Remove-NetFirewallRule -InputObject $previewRule
  }

  if (Test-Path -LiteralPath $statePath) {
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($state.blockRuleName) {
      Enable-NetFirewallRule -Name $state.blockRuleName
    }
  } else {
    Get-MatchingTcpBlockRules | Enable-NetFirewallRule
  }

  [pscustomobject]@{
    mode = "Restore"
    success = $true
    restoredAt = (Get-Date).ToString("o")
  } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
  exit 0
}

if (-not (Test-Path -LiteralPath $nodePath)) {
  throw "Bundled Node.js executable was not found: $nodePath"
}

$tcpBlocks = @(Get-MatchingTcpBlockRules | Where-Object { $_.Enabled -eq "True" })
if ($tcpBlocks.Count -ne 1) {
  throw "Safety check failed: expected exactly one enabled public TCP block rule, found $($tcpBlocks.Count)."
}

if (Get-NetFirewallRule -DisplayName $allowName -ErrorAction SilentlyContinue) {
  throw "Safety check failed: the temporary preview rule already exists."
}

$blockRule = $tcpBlocks[0]
$createdRule = $false

try {
  Disable-NetFirewallRule -Name $blockRule.Name

  New-NetFirewallRule `
    -DisplayName $allowName `
    -Description "Temporary Expo Go preview: bundled Node.js, TCP 8082, LocalSubnet, Public profile only." `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 8082 `
    -RemoteAddress LocalSubnet `
    -Profile Public `
    -Program $nodePath | Out-Null
  $createdRule = $true

  $allowRule = Get-NetFirewallRule -DisplayName $allowName
  $allowPort = $allowRule | Get-NetFirewallPortFilter
  $allowAddress = $allowRule | Get-NetFirewallAddressFilter
  $allowProgram = $allowRule | Get-NetFirewallApplicationFilter
  $blockAfter = Get-NetFirewallRule -Name $blockRule.Name

  if (
    $allowRule.Enabled -ne "True" -or
    $allowRule.Direction -ne "Inbound" -or
    $allowRule.Action -ne "Allow" -or
    $allowPort.Protocol -ne "TCP" -or
    $allowPort.LocalPort -ne "8082" -or
    $allowAddress.RemoteAddress -notcontains "LocalSubnet" -or
    $allowProgram.Program -ine $nodePath -or
    $blockAfter.Enabled -ne "False"
  ) {
    throw "Read-back verification failed."
  }

  [pscustomobject]@{
    mode = "Enable"
    success = $true
    changedAt = (Get-Date).ToString("o")
    blockRuleName = $blockRule.Name
    blockRuleDisabled = $true
    allowRuleName = $allowName
    program = $nodePath
    protocol = "TCP"
    localPort = 8082
    remoteAddress = "LocalSubnet"
    profile = "Public"
  } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
} catch {
  if ($createdRule) {
    Get-NetFirewallRule -DisplayName $allowName -ErrorAction SilentlyContinue |
      Remove-NetFirewallRule -ErrorAction SilentlyContinue
  }
  Enable-NetFirewallRule -Name $blockRule.Name -ErrorAction SilentlyContinue

  [pscustomobject]@{
    mode = "Enable"
    success = $false
    failedAt = (Get-Date).ToString("o")
    error = $_.Exception.Message
  } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
  throw
}

Add-Type -AssemblyName System.Web

$WsusContentFolder = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').WSUSContentFolder
$JWT = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').JWT
$WsusContentFolder
$JWT

$wsus = Get-WsusServer
$wsus

$headers = @{
    'Authorization' = 'Bearer ' + $JWT
}

#Get all updates
$updates = Get-WsusUpdate -Approval Approved

#Iterate every update and output some basic info about it
$CurrentFile = 0
ForEach ($update in $updates) {
  $CurrentFile += 1
  $CurrentFilePercent = 100 - ((($updates.Count - $CurrentFile) / $updates.Count) * 100)
  Write-Output "Checking $($update.Update.Title)"

  $update.Update.GetInstallableItems().Files | foreach {
    Write-Output $_
    if ($_.Type -eq [Microsoft.UpdateServices.Administration.FileType]::SelfContained -and ($_.FileUri -match '[cab|msu]$'))
    {
      $LocalName = $_.Name
      $LocalFileName = ($_.FileUri -replace '.*/Content', $WsusContentFolder) -replace '/', '\'
      Write-Output $LocalFileName

      $LocalVersion = "NA" #[System.Diagnostics.FileVersionInfo]::GetVersionInfo($LocalFileName).FileVersion
      Write-Output $LocalVersion

      $LocalHash = Get-FileHash $LocalFileName
      Write-Output $LocalHash.Hash

      $uri = "https://api.binarytransparency.net/v1/package?" +
        "packageName=" + [System.Web.HttpUtility]::UrlEncode($LocalName) +
        "&packageVersion=" + [System.Web.HttpUtility]::UrlEncode($LocalVersion) +
        "&packageArch=x86" +
        "&packageFamily=Windows" +
        "&packageHash=" + [System.Web.HttpUtility]::UrlEncode($LocalHash.Hash)
      Write-Output $uri
      $api = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -UserAgent "Bintra 0.0.1 (Windows)"
      Write-Output $api
    }
    #Write-Verbose ('Adding "{0}" to the list of available patches.' -f $update.Update.Title)
  }
  #break
}

Write-Output 'Ende'

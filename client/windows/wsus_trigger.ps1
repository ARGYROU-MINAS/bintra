Add-Type -AssemblyName System.Web

$log = "D:\Logs\Approved_Updates.txt"

$WsusContentFolder = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').WSUSContentFolder
$JWT = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').JWT
$GroupName = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').GroupName
$WsusContentFolder | Out-File $log -append 
$JWT

$wsus = Get-WsusServer
$wsus | Out-File $log -append 

$headers = @{
    'Authorization' = 'Bearer ' + $JWT
}

$wgroup = $wsus.GetComputerTargetGroups() | where {$_.Name -eq $GroupName}
$wgroup

#Get all updates
# filter perhaps this: -and ($_.ProductFamilyTitles -eq "Windows" -or $_.ProductFamilyTitles -eq "Office")
$updates = Get-WsusUpdate -Approval Unapproved | ? {( $_.PublicationState -ne "Expired" ) }


#Iterate every update and output some basic info about it
$CurrentFile = 0
ForEach ($update in $updates) {
  $CurrentFile += 1
  $CurrentFilePercent = 100 - ((($updates.Count - $CurrentFile) / $updates.Count) * 100)
  "Checking $($update.Update.Title)" | Out-File $log -append 

  $doApprove = false
  $update.Update.GetInstallableItems().Files | foreach {
    $_ | Out-File $log -append 
    if ($_.Type -eq [Microsoft.UpdateServices.Administration.FileType]::SelfContained -and ($_.FileUri -match '[cab|msu]$'))
    {
      $LocalName = $_.Name
      $LocalFileName = ($_.FileUri -replace '.*/Content', $WsusContentFolder) -replace '/', '\'
      $LocalFileName | Out-File $log -append 

      $LocalVersion = "NA" #[System.Diagnostics.FileVersionInfo]::GetVersionInfo($LocalFileName).FileVersion
      $LocalVersion | Out-File $log -append 

      $LocalHash = Get-FileHash $LocalFileName
      $LocalHash.Hash | Out-File $log -append 

      $LocalArch = "x86"
      if ($LocalFileName.Contains("x64.cab") -or $LocalFileName.Contains("x64-NDP48.cab"))
	  {
		  $LocalArch = "x64"
	  }
      if ($LocalFileName.Contains("arm64.cab") -or $LocalFileName.Contains("arm64-NDP48.cab"))
	  {
		  $LocalArch = "arm64"
	  }

      $uri = "https://api.binarytransparency.net/v1/package?" +
        "packageName=" + [System.Web.HttpUtility]::UrlEncode($LocalName) +
        "&packageVersion=" + [System.Web.HttpUtility]::UrlEncode($LocalVersion) +
        "&packageArch=" + $LocalArch +
        "&packageFamily=Windows" +
        "&packageHash=" + [System.Web.HttpUtility]::UrlEncode($LocalHash.Hash)
      $uri | Out-File $log -append 

      #$api = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -UserAgent "Bintra 0.0.1 (Windows)"
      #Write-Output $api
	  $doApprove = true
    }
  }
  if ($doApprove)
  {
	  "Will approve that update" | Out-File $log -append 
	  $update.Approve("Install", $wgroup)
  }
  #break
}

"Ende" | Out-File $log -append

Add-Type -AssemblyName System.Web

Write-Host (“Setting variables ”)
$log = "D:\Logs\newlog.txt"
$WsusServerFqdn=(Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').WSUSServerName
$WsusSourceGroup = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').SourceGroupName
$WsusTargetGroup = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').TargetGroupName
$WsusContentFolder = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').WSUSContentFolder
$JWT = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').JWT

$WsusContentFolder | Out-File $log -append 

$headers = @{
    'Authorization' = 'Bearer ' + $JWT
}

[void][reflection.assembly]::LoadWithPartialName( “Microsoft.UpdateServices.Administration”)
$wsus = [Microsoft.UpdateServices.Administration.AdminProxy]::getUpdateServer( $WsusServerFqdn, $False, ‘8530’)
$Groups = $wsus.GetComputerTargetGroups()
$WsusSourceGroupObj = $Groups | Where {$_.Name -eq $WsusSourceGroup}
$WsusTargetGroupObj = $Groups | Where {$_.Name -eq $WsusTargetGroup}

$Updates = $wsus.GetUpdates()
$i = 0
ForEach ($Update in $Updates)
{
    if ($Update.GetUpdateApprovals($WsusSourceGroupObj).Count -ne 0 -and $Update.GetUpdateApprovals($WsusTargetGroupObj).Count -eq 0)
    {
        $i ++
        Write-Host (“Validation ” + $Update.Title)

        $doApprove = $false
        $Update.GetInstallableItems().Files | foreach {
            $_ | Out-File $log -append 
            if (($_.Type -eq [Microsoft.UpdateServices.Administration.FileType]::SelfContained -or $_.Type -eq [Microsoft.UpdateServices.Administration.FileType]::None) -and ($_.FileUri -match '[cab|msu|exe]$'))
            {
                $LocalName = $_.Name
                $LocalFileName = ($_.FileUri -replace '.*/Content', $WsusContentFolder) -replace '/', '\'
                $LocalFileName | Out-File $log -append 
	            if (Test-Path $LocalFileName -PathType leaf)
	            {
                    $LocalVersion = "NA" #[System.Diagnostics.FileVersionInfo]::GetVersionInfo($LocalFileName).FileVersion
                    $LocalVersion | Out-File $log -append 

                    $LocalHash = Get-FileHash $LocalFileName
                    $LocalHash.Hash | Out-File $log -append

                    Write-Host (“Local name ” + $LocalName)
                    $LocalArch = "x86"
                    if ($LocalName.Contains("x64.") -or $LocalName.Contains("x64-NDP48."))
	                {
		                $LocalArch = "x64"
            	    }
                    if ($LocalName.Contains("arm64.") -or $LocalName.Contains("arm64-NDP48."))
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

                    $api = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -UserAgent "Bintra 0.0.2 (Windows)"
                    $api | Out-File $log -append 
	                $doApprove = $true
	            } else {
		            "File not there" | Out-File $log -append
	            } #else if
            } #if
        } # foreach inner

        if ($doApprove)
        {
            Write-Host (“Approving ” + $Update.Title)
            $Update.Approve(‘Install’, $WsusTargetGroupObj) | Out-File $log -append
        } else {
            Write-Host (“** SKIPPING ** ” + $Update.Title)
        }
    } # if
} # foreach

Write-Output (“Approved {0} updates for target group {1}” -f $i, $WsusTargetGroup)
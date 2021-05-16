Add-Type -AssemblyName System.Web

Write-Host (“Setting variables ”)
$log = "D:\Logs\newlog.txt"
$WsusServerFqdn=(Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').WSUSServerName
$WsusSourceGroup = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').SourceGroupName
$WsusTargetGroup = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').TargetGroupName
$WsusContentFolder = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').WSUSContentFolder
$JWT = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').JWT
$MailFrom = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').MailFrom
$MailTo = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').MailTo
$MailServer = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').MailServer
$MailPort = (Get-ItemProperty -path 'HKLM:\SOFTWARE\Bintra').MailPort

Get-Date | Out-File $log -append
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
$iFiles = 0
ForEach ($Update in $Updates)
{
    if ($Update.GetUpdateApprovals($WsusSourceGroupObj).Count -ne 0 -and $Update.GetUpdateApprovals($WsusTargetGroupObj).Count -eq 0)
    {
        $i ++
        Write-Host (“Validation ” + $Update.Title)
		$Update.Title | Out-File $log -append

        $LocalVersion = "NA"
        $match1 = select-string " (v[0-9]+\.[0-9]+) " -inputobject $Update.Title
        $match2 = select-string " \(Version ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\)" -inputobject $Update.Title
        $match3 = select-string " - ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)$" -inputobject $Update.Title
        if ($match1.matches.Success)
        {
            $LocalVersion = $match1.Matches.groups[1].value
        } else {
            if ($match2.matches.Success)
			{
				$LocalVersion = $match2.Matches.groups[1].value
			} else {
                if ($match3.matches.Success)
                {
    				$LocalVersion = $match3.Matches.groups[1].value
                } else {
				    "No version match found" | Out-File $log -append
                }
			}
        }
        $LocalVersion | Out-File $log -append
		Write-Host (“Version ” + $LocalVersion)

        $LocalArch = ""

        $doApprove = $false
        $hasFiles = $false
        $hashBuffer = ""
        $Update.GetInstallableItems().Files | foreach {
            $_ | Out-File $log -append 
            if (($_.Type -eq [Microsoft.UpdateServices.Administration.FileType]::SelfContained -or $_.Type -eq [Microsoft.UpdateServices.Administration.FileType]::None) -and ($_.FileUri -match '[cab|msu|exe]$'))
            {
                $LocalName = $_.Name
                $LocalFileName = ($_.FileUri -replace '.*/Content', $WsusContentFolder) -replace '/', '\'
                $LocalFileName | Out-File $log -append 
	            if (Test-Path $LocalFileName -PathType leaf)
	            {
                    $hasFiles = $true
                    $iFiles ++

                    $LocalHash = Get-FileHash $LocalFileName
                    $LocalHash.Hash | Out-File $log -append
                    $hashBuffer += $LocalHash.Hash

                    if ($LocalArch -eq "")
                    {
                        $LocalArch = "x86"
                        Write-Host (“Local name ” + $LocalName)
                        if ($LocalName.Contains("x64.") -or $LocalName.Contains("x64-NDP48."))
	                    {
		                    $LocalArch = "x64"
            	        }
                        if ($LocalName.Contains("arm64.") -or $LocalName.Contains("arm64-NDP48."))
	                    {
		                    $LocalArch = "arm64"
	                    }
                    } # if arch empty
   
	            } else {
		            "File not there" | Out-File $log -append
	            } #else if
            } #if
        } # foreach inner file of one update

        if ($hasFiles)
        {
            # get hash of concatenated hashes
            $mystream = [IO.MemoryStream]::new([byte[]][char[]]$hashBuffer)
            $LocalHash = Get-FileHash -InputStream $mystream -Algorithm SHA256
            $LocalHash.Hash | Out-File $log -append

            $LocalTitle = $Update.Title
            $LocalTitle = $LocalTitle.replace('(Version '+$LocalVersion+')', '')
            $LocalTitle = $LocalTitle.replace('v'+$LocalVersion, '')
            $LocalTitle = $LocalTitle.replace('- '+$LocalVersion, '')
            $LocalTitle = $LocalTitle -replace '[ \(\)]','_'
            $LocalTitle = $LocalTitle.Trim()
            $LocalTitle | Out-File $log -append

            $uri = "https://api.binarytransparency.net/v1/package?" +
              "packageName=" + [System.Web.HttpUtility]::UrlEncode($LocalTitle) +
              "&packageVersion=" + [System.Web.HttpUtility]::UrlEncode($LocalVersion) +
              "&packageArch=" + $LocalArch +
              "&packageFamily=Windows" +
              "&packageHash=" + [System.Web.HttpUtility]::UrlEncode($LocalHash.Hash)
            $uri | Out-File $log -append 

            $api = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -UserAgent "Bintra 0.0.3 (Windows)"
            $api | Out-File $log -append 
	        $doApprove = $true
        } # has Files

        if ($doApprove)
        {
            Write-Host (“Approving ” + $Update.Title)
            $Update.Approve(‘Install’, $WsusTargetGroupObj) | Out-File $log -append
        } else {
            Write-Host (“** SKIPPING ** ” + $Update.Title)
        } # if doApprove
    } # if not yet approved
} # foreach Update

$msg = "Approved {0} updates with {1} inner files for target group {2}" -f $i, $iFiles, $WsusTargetGroup
Write-Output ($msg)
$msg | Out-File $log -append
Get-Date | Out-File $log -append

if ($i -gt 0)
{
    Send-MailMessage -To $MailTo -From $MailFrom -Subject "Bintra WSUS script" -Body $msg -SmtpServer $MailServer -Port $MailPort
}
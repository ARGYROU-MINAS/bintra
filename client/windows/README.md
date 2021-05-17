## Configuration by registry file

Most properties are configured by adding some keys to the registry.

    Windows Registry Editor Version 5.00
    
    [HKEY_LOCAL_MACHINE\SOFTWARE\Bintra]
    "JWT"="abc..."
    "WSUSContentFolder"="D:\\WSUS\\WsusContent"
    "TargetGroupName"="TheGroup"
    "SourceGroupName"="PreBintra"
    "WSUSServerName"="TheWSUSserver"
    "MailFrom"="wsus@example.com"
    "MailTo"="wsusadmin@example.com"
    "MailServer"="mail.example.com"
    "MailPort"=dword:00000019


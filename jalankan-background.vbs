Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath

' Jalankan server Laravel di latar belakang (tanpa jendela hitam)
WshShell.Run "cmd /c php artisan serve --port=8000", 0, False

' Tunggu 3 detik agar port 8000 siap
WScript.Sleep 3000

' Buka web di browser default
WshShell.Run "http://127.0.0.1:8000"

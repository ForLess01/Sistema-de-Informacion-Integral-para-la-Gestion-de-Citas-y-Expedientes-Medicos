import subprocess

batch_files = [
    "setup_backend.bat",
    "setup_frontend_web.bat",
    "setup_frontend_desktop.bat",
    "dev.bat"
]

for bat in batch_files:
    print(f"==> Ejecutando {bat}...")
    result = subprocess.run(bat, shell=True)

    if result.returncode != 0:
        print(f"❌ Error ejecutando {bat}")
        break
    else:
        print(f"✅ {bat} ejecutado correctamente\n")

@echo off
echo Configurando Backend Django...

cd backend

echo Creando migraciones...
python manage.py makemigrations

echo Aplicando migraciones...
python manage.py migrate

echo Creando superusuario...
python manage.py createsuperuser

echo Cargando datos de prueba...
python manage.py loaddata fixtures/initial_data.json

echo Backend configurado exitosamente!
pause
# Requirements Files Documentation

Este proyecto utiliza diferentes archivos de requirements para diferentes entornos:

## Archivos disponibles

### 1. `requirements.txt`
Archivo principal con todas las dependencias necesarias para ejecutar el proyecto.

```bash
pip install -r requirements.txt
```

### 2. `requirements-dev.txt`
Incluye todas las dependencias de `requirements.txt` más herramientas adicionales para desarrollo como:
- Testing (pytest, coverage)
- Linting (flake8, black, isort)
- Debugging y profiling
- Documentación

```bash
pip install -r requirements-dev.txt
```

### 3. `requirements-prod.txt`
Versión optimizada para producción que excluye herramientas de desarrollo e incluye:
- Monitoreo (Sentry)
- Mejores prácticas de configuración (django-environ)

```bash
pip install -r requirements-prod.txt
```

## Comandos útiles

### Actualizar pip y setuptools
```bash
python -m pip install --upgrade pip setuptools wheel
```

### Generar archivo de dependencias actual
```bash
pip freeze > requirements-freeze.txt
```

### Verificar vulnerabilidades de seguridad
```bash
pip install safety
safety check -r requirements.txt
```

### Actualizar todas las dependencias
```bash
pip install pip-upgrader
pip-upgrade requirements.txt
```

## Notas importantes

1. **Versiones fijas**: Todas las dependencias tienen versiones específicas para garantizar la reproducibilidad.

2. **Python version**: Este proyecto requiere Python 3.8 o superior.

3. **PostgreSQL**: En producción se usa PostgreSQL. Asegúrate de tener las bibliotecas del sistema necesarias:
   - En Ubuntu/Debian: `sudo apt-get install libpq-dev`
   - En macOS: `brew install postgresql`
   - En Windows: Las bibliotecas vienen incluidas con psycopg2-binary

4. **Redis**: Se requiere Redis para caché y Celery:
   - En Ubuntu/Debian: `sudo apt-get install redis-server`
   - En macOS: `brew install redis`
   - En Windows: Usar WSL o Docker

5. **Pillow**: Requiere bibliotecas del sistema para procesamiento de imágenes:
   - En Ubuntu/Debian: `sudo apt-get install libjpeg-dev zlib1g-dev`
   - En macOS: `brew install libjpeg zlib`

## Entorno virtual

Se recomienda usar un entorno virtual:

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Unix/macOS:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements-dev.txt  # Para desarrollo
# o
pip install -r requirements-prod.txt  # Para producción
```

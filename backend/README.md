# Pruebas del Sistema de Información Integral

Este documento describe cómo ejecutar, escribir y documentar las pruebas para el Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos.

## Ejecución de Pruebas

Para ejecutar las pruebas, utiliza `pytest` junto con `pytest-django`, que ya está configurado para integrarse correctamente con Django y el sistema de pruebas existente.

El siguiente comando ejecuta todas las pruebas:

```bash
pytest
```

Para ejecutar un archivo de prueba específico:

```bash
pytest path/to/test_file.py
```

Para ejecutar pruebas y mostrar el reporte de cobertura:

```bash
pytest --cov=./ --cov-report=html
```

Los resultados de cobertura se generarán en el directorio `htmlcov`.

## Escribir Nuevas Pruebas

Para escribir nuevas pruebas:

1. Crea un nuevo archivo de prueba siguiendo el formato `test_*.py` dentro del directorio adecuado.
2. Usa `pytest` fixtures y `django.test` para modelar tus pruebas, asegurándote de preparar el entorno de pruebas utilizando las utilidades existentes en `tests`.
3. Las pruebas deben cubrir tanto casos exitosos como de error, asegurando una validación completa del código.
4. Documenta tus pruebas y el objetivo de cada archivo de pruebas al inicio del archivo usando un docstring claro. Ejemplo:

   ```python
   """
   Tests para validar la funcionalidad de agendamiento de citas.
   Este módulo cubre creación, edición, eliminación y validaciones.
   """
   ```

## Documentación de Fixtures y Mocks

- **Fixtures**: Se encuentran en `tests/test_fixtures.py` y proporcionan datos reutilizables para asegurar que las pruebas sean consistentes y no tengan efectos secundarios.
- **Mocks**: Utiliza `unittest.mock` para simular comportamientos externos y aislar componentes para pruebas unitarias.

## Cobertura de Pruebas

La implementación exige al menos un 80% de cobertura en todos los módulos. Utiliza `coverage` para identificar áreas sin cubrir y asegúrate de añadir las pruebas necesarias para alcanzar este objetivo. Los umbrales están configurados en el archivo `.coveragerc`.

## Mejor Práctica

- Mantén cada prueba simple y concisa, cubriendo un solo caso de prueba.
- Reutiliza fixtures y funciones auxiliares en `tests/test_utils.py` donde sea posible para minimizar el código repetitivo.

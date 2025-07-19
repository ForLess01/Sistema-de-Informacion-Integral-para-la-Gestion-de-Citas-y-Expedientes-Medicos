from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status

# Parámetros comunes
start_date_param = openapi.Parameter(
    'start_date',
    openapi.IN_QUERY,
    description="Fecha de inicio para el reporte (formato: YYYY-MM-DD)",
    type=openapi.TYPE_STRING,
    format=openapi.FORMAT_DATE,
    required=False
)

end_date_param = openapi.Parameter(
    'end_date',
    openapi.IN_QUERY,
    description="Fecha de fin para el reporte (formato: YYYY-MM-DD)",
    type=openapi.TYPE_STRING,
    format=openapi.FORMAT_DATE,
    required=False
)

report_type_param = openapi.Parameter(
    'report_type',
    openapi.IN_QUERY,
    description="Tipo de reporte a filtrar",
    type=openapi.TYPE_STRING,
    enum=['appointments', 'financial', 'emergency', 'occupancy', 'medications'],
    required=False
)

format_param = openapi.Parameter(
    'format',
    openapi.IN_QUERY,
    description="Formato del reporte",
    type=openapi.TYPE_STRING,
    enum=['pdf', 'csv', 'json', 'excel'],
    required=False,
    default='pdf'
)

# Schemas de respuesta
report_template_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
        'name': openapi.Schema(type=openapi.TYPE_STRING),
        'report_type': openapi.Schema(type=openapi.TYPE_STRING),
        'description': openapi.Schema(type=openapi.TYPE_STRING),
        'template_config': openapi.Schema(type=openapi.TYPE_OBJECT),
        'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
        'created_by': openapi.Schema(type=openapi.TYPE_INTEGER),
    }
)

generated_report_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
        'name': openapi.Schema(type=openapi.TYPE_STRING),
        'report_type': openapi.Schema(type=openapi.TYPE_STRING),
        'format': openapi.Schema(type=openapi.TYPE_STRING),
        'status': openapi.Schema(
            type=openapi.TYPE_STRING,
            enum=['pending', 'processing', 'completed', 'failed']
        ),
        'parameters': openapi.Schema(type=openapi.TYPE_OBJECT),
        'file_url': openapi.Schema(type=openapi.TYPE_STRING),
        'error_message': openapi.Schema(type=openapi.TYPE_STRING),
        'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
        'completed_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
        'generated_by': openapi.Schema(type=openapi.TYPE_INTEGER),
    }
)

# Documentación para ReportTemplateViewSet
report_template_list_docs = swagger_auto_schema(
    operation_summary="Listar plantillas de reportes",
    operation_description="Obtiene la lista de plantillas de reportes disponibles",
    manual_parameters=[
        report_type_param,
        openapi.Parameter(
            'is_active',
            openapi.IN_QUERY,
            description="Filtrar por plantillas activas/inactivas",
            type=openapi.TYPE_BOOLEAN,
            required=False
        )
    ],
    responses={
        200: openapi.Response(
            description="Lista de plantillas obtenida exitosamente",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'count': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'results': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=report_template_schema
                    )
                }
            )
        )
    },
    tags=['Reports - Templates']
)

# Documentación para GeneratedReportViewSet
generate_report_docs = swagger_auto_schema(
    operation_summary="Generar nuevo reporte",
    operation_description="Genera un nuevo reporte basado en los parámetros proporcionados",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['report_type', 'format'],
        properties={
            'report_type': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['appointments', 'financial', 'emergency', 'occupancy', 'medications']
            ),
            'format': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['pdf', 'csv', 'json', 'excel']
            ),
            'parameters': openapi.Schema(
                type=openapi.TYPE_OBJECT,
                description="Parámetros específicos del reporte"
            ),
            'start_date': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE
            ),
            'end_date': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE
            ),
            'name': openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Nombre personalizado para el reporte"
            )
        }
    ),
    responses={
        201: openapi.Response(
            description="Reporte generado exitosamente",
            schema=generated_report_schema
        ),
        400: "Datos inválidos",
        401: "No autenticado",
        403: "Sin permisos"
    },
    tags=['Reports - Generation']
)

download_report_docs = swagger_auto_schema(
    operation_summary="Descargar reporte generado",
    operation_description="Descarga un reporte previamente generado",
    responses={
        200: openapi.Response(
            description="Archivo del reporte",
            schema=openapi.Schema(type=openapi.TYPE_FILE)
        ),
        404: "Reporte no encontrado o no disponible"
    },
    tags=['Reports - Generation']
)

# Documentación para reportes financieros
financial_revenue_summary_docs = swagger_auto_schema(
    operation_summary="Resumen de ingresos",
    operation_description="Obtiene un resumen de ingresos por diferentes conceptos (consultas, farmacia, exámenes)",
    manual_parameters=[start_date_param, end_date_param],
    responses={
        200: openapi.Response(
            description="Resumen de ingresos",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'period': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'start_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                            'end_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE)
                        }
                    ),
                    'appointments': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'total': openapi.Schema(type=openapi.TYPE_NUMBER),
                            'count': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'average': openapi.Schema(type=openapi.TYPE_NUMBER)
                        }
                    ),
                    'pharmacy': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'total': openapi.Schema(type=openapi.TYPE_NUMBER),
                            'count': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'average': openapi.Schema(type=openapi.TYPE_NUMBER)
                        }
                    ),
                    'exams': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'total': openapi.Schema(type=openapi.TYPE_NUMBER),
                            'count': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'average': openapi.Schema(type=openapi.TYPE_NUMBER)
                        }
                    ),
                    'total_revenue': openapi.Schema(type=openapi.TYPE_NUMBER)
                }
            )
        )
    },
    tags=['Reports - Financial']
)

financial_revenue_by_specialty_docs = swagger_auto_schema(
    operation_summary="Ingresos por especialidad",
    operation_description="Obtiene los ingresos agrupados por especialidad médica",
    manual_parameters=[start_date_param, end_date_param],
    responses={
        200: openapi.Response(
            description="Ingresos por especialidad",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'period': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'specialties': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'doctor__specialties__name': openapi.Schema(type=openapi.TYPE_STRING),
                                'total_revenue': openapi.Schema(type=openapi.TYPE_NUMBER),
                                'appointment_count': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'average_fee': openapi.Schema(type=openapi.TYPE_NUMBER)
                            }
                        )
                    )
                }
            )
        )
    },
    tags=['Reports - Financial']
)

financial_pharmacy_analysis_docs = swagger_auto_schema(
    operation_summary="Análisis de ventas de farmacia",
    operation_description="Análisis detallado de ventas de farmacia por categorías y medicamentos",
    manual_parameters=[start_date_param, end_date_param],
    responses={
        200: openapi.Response(
            description="Análisis de farmacia",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'sales_by_category': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'category': openapi.Schema(type=openapi.TYPE_STRING),
                                'total_revenue': openapi.Schema(type=openapi.TYPE_NUMBER)
                            }
                        )
                    ),
                    'top_medications': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'name': openapi.Schema(type=openapi.TYPE_STRING),
                                'units_sold': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'total_revenue': openapi.Schema(type=openapi.TYPE_NUMBER)
                            }
                        )
                    )
                }
            )
        )
    },
    tags=['Reports - Financial']
)

# Documentación para reportes de emergencias
emergency_case_summary_docs = swagger_auto_schema(
    operation_summary="Resumen de casos de emergencia",
    operation_description="Obtiene un resumen general de casos de emergencia por estado y prioridad",
    manual_parameters=[start_date_param, end_date_param],
    responses={
        200: openapi.Response(
            description="Resumen de casos",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'period': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'cases_by_status': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'status': openapi.Schema(type=openapi.TYPE_STRING),
                                'count': openapi.Schema(type=openapi.TYPE_INTEGER)
                            }
                        )
                    ),
                    'cases_by_priority': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'priority': openapi.Schema(type=openapi.TYPE_STRING),
                                'count': openapi.Schema(type=openapi.TYPE_INTEGER)
                            }
                        )
                    ),
                    'statistics': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'total_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'critical_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'urgent_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'standard_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'completed_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'admitted_cases': openapi.Schema(type=openapi.TYPE_INTEGER)
                        }
                    )
                }
            )
        )
    },
    tags=['Reports - Emergency']
)

emergency_triage_analysis_docs = swagger_auto_schema(
    operation_summary="Análisis de triaje",
    operation_description="Análisis del proceso de triaje incluyendo distribución y eficiencia",
    manual_parameters=[start_date_param, end_date_param],
    responses={
        200: openapi.Response(
            description="Análisis de triaje",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'triage_distribution': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'level': openapi.Schema(type=openapi.TYPE_STRING),
                                'count': openapi.Schema(type=openapi.TYPE_INTEGER)
                            }
                        )
                    ),
                    'triage_times': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'duration': openapi.Schema(type=openapi.TYPE_NUMBER),
                                'occurrences': openapi.Schema(type=openapi.TYPE_INTEGER)
                            }
                        )
                    ),
                    'nurse_efficiency': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'nurse': openapi.Schema(type=openapi.TYPE_STRING),
                                'efficiency_score': openapi.Schema(type=openapi.TYPE_NUMBER)
                            }
                        )
                    ),
                }
            )
        )
    },
    tags=['Reports - Emergency']
)

emergency_response_times_docs = swagger_auto_schema(
    operation_summary="Análisis de tiempos de respuesta",
    operation_description="Análisis de tiempos de respuesta y cumplimiento de estándares",
    manual_parameters=[start_date_param, end_date_param],
    responses={
        200: openapi.Response(
            description="Tiempos de respuesta",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'response_metrics': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'response_by_priority': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'priority': openapi.Schema(type=openapi.TYPE_STRING),
                                'average_time': openapi.Schema(type=openapi.TYPE_NUMBER)
                            }
                        )
                    ),
                    'standards_compliance': openapi.Schema(type=openapi.TYPE_OBJECT)
                }
            )
        )
    },
    tags=['Reports - Emergency']
)

# Documentación para dashboard
dashboard_summary_docs = swagger_auto_schema(
    operation_summary="Resumen del dashboard",
    operation_description="Obtiene estadísticas generales para el dashboard principal",
    responses={
        200: openapi.Response(
            description="Estadísticas del dashboard",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'appointments': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'today': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'pending': openapi.Schema(type=openapi.TYPE_INTEGER)
                        }
                    ),
                    'patients': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'total': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'new_this_month': openapi.Schema(type=openapi.TYPE_INTEGER)
                        }
                    ),
                    'emergency': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'active_cases': openapi.Schema(type=openapi.TYPE_INTEGER)
                        }
                    ),
                    'prescriptions': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'active': openapi.Schema(type=openapi.TYPE_INTEGER)
                        }
                    )
                }
            )
        )
    },
    tags=['Reports - Dashboard']
)

import os
import io
import csv
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q, F
from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class BaseReportGenerator:
    """Clase base para generadores de reportes"""
    
    def __init__(self, report):
        self.report = report
        self.data = []
        self.title = f"Reporte {report.report_type}"
        self.generated_at = timezone.now()
    
    def generate(self):
        """Método principal para generar el reporte"""
        try:
            # Marcar como procesando
            self.report.status = 'processing'
            self.report.save()
            
            start_time = timezone.now()
            
            # Recolectar datos
            self.collect_data()
            
            # Generar archivo según formato
            if self.report.format == 'pdf':
                file_content = self.generate_pdf()
            elif self.report.format == 'excel':
                file_content = self.generate_excel()
            elif self.report.format == 'csv':
                file_content = self.generate_csv()
            else:  # json
                file_content = self.generate_json()
            
            # Guardar archivo
            filename = f"{self.report.report_type}_{self.report.report_id}.{self.report.format}"
            self.report.file.save(filename, ContentFile(file_content))
            
            # Actualizar metadatos
            generation_time = (timezone.now() - start_time).total_seconds()
            self.report.generation_time = generation_time
            self.report.file_size = self.report.file.size
            self.report.row_count = len(self.data)
            self.report.status = 'completed'
            self.report.completed_at = timezone.now()
            
            # Establecer expiración (30 días por defecto)
            self.report.expires_at = timezone.now() + timedelta(days=30)
            
            self.report.save()
            
            logger.info(f"Reporte {self.report.report_id} generado exitosamente")
            
        except Exception as e:
            logger.error(f"Error generando reporte {self.report.report_id}: {str(e)}")
            self.report.status = 'failed'
            self.report.error_message = str(e)
            self.report.save()
            raise
    
    def collect_data(self):
        """Método para recolectar datos - debe ser implementado por subclases"""
        raise NotImplementedError
    
    def generate_pdf(self):
        """Generar reporte en formato PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Título
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
            alignment=1  # Center
        )
        elements.append(Paragraph(self.title, title_style))
        elements.append(Spacer(1, 20))
        
        # Información del reporte
        info_text = f"""
        <b>Generado por:</b> {self.report.generated_by.get_full_name()}<br/>
        <b>Fecha de generación:</b> {self.generated_at.strftime('%d/%m/%Y %H:%M')}<br/>
        """
        if self.report.start_date:
            info_text += f"<b>Período:</b> {self.report.start_date.strftime('%d/%m/%Y')} - {self.report.end_date.strftime('%d/%m/%Y')}<br/>"
        
        elements.append(Paragraph(info_text, styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Tabla de datos
        if self.data:
            # Convertir datos a formato de tabla
            headers = list(self.data[0].keys()) if isinstance(self.data[0], dict) else []
            table_data = [headers]
            
            for row in self.data:
                if isinstance(row, dict):
                    table_data.append([str(row.get(h, '')) for h in headers])
            
            # Crear tabla
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(table)
        
        # Generar PDF
        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        
        return pdf
    
    def generate_excel(self):
        """Generar reporte en formato Excel"""
        buffer = io.BytesIO()
        
        # Convertir datos a DataFrame
        df = pd.DataFrame(self.data)
        
        # Crear archivo Excel con formato
        with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Reporte', index=False)
            
            # Obtener workbook y worksheet
            workbook = writer.book
            worksheet = writer.sheets['Reporte']
            
            # Formato para encabezados
            header_format = workbook.add_format({
                'bold': True,
                'text_wrap': True,
                'valign': 'top',
                'fg_color': '#D7E4BD',
                'border': 1
            })
            
            # Aplicar formato a encabezados
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
            
            # Ajustar ancho de columnas
            for i, col in enumerate(df.columns):
                column_width = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.set_column(i, i, column_width)
        
        excel_data = buffer.getvalue()
        buffer.close()
        
        return excel_data
    
    def generate_csv(self):
        """Generar reporte en formato CSV"""
        buffer = io.StringIO()
        
        if self.data:
            fieldnames = list(self.data[0].keys()) if isinstance(self.data[0], dict) else []
            writer = csv.DictWriter(buffer, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.data)
        
        csv_data = buffer.getvalue().encode('utf-8')
        buffer.close()
        
        return csv_data
    
    def generate_json(self):
        """Generar reporte en formato JSON"""
        json_data = {
            'report_info': {
                'title': self.title,
                'generated_at': self.generated_at.isoformat(),
                'generated_by': self.report.generated_by.get_full_name(),
                'parameters': self.report.parameters,
                'row_count': len(self.data)
            },
            'data': self.data
        }
        
        return json.dumps(json_data, indent=2, default=str).encode('utf-8')


class AppointmentReportGenerator(BaseReportGenerator):
    """Generador de reportes de citas"""
    
    def __init__(self, report):
        super().__init__(report)
        self.title = "Reporte de Citas Médicas"
    
    def collect_data(self):
        from appointments.models import Appointment
        
        # Filtros base
        queryset = Appointment.objects.select_related(
            'patient', 'doctor', 'specialty'
        )
        
        # Aplicar filtros de fecha
        if self.report.start_date:
            queryset = queryset.filter(appointment_date__gte=self.report.start_date)
        if self.report.end_date:
            queryset = queryset.filter(appointment_date__lte=self.report.end_date)
        
        # Aplicar filtros adicionales desde parameters
        params = self.report.parameters
        if params.get('status'):
            queryset = queryset.filter(status=params['status'])
        if params.get('doctor_id'):
            queryset = queryset.filter(doctor_id=params['doctor_id'])
        if params.get('specialty_id'):
            queryset = queryset.filter(specialty_id=params['specialty_id'])
        
        # Recolectar datos
        self.data = []
        for appointment in queryset:
            self.data.append({
                'Fecha': appointment.appointment_date.strftime('%d/%m/%Y'),
                'Hora': appointment.appointment_time.strftime('%H:%M'),
                'Paciente': appointment.patient.get_full_name(),
                'DNI Paciente': appointment.patient.dni,
                'Doctor': appointment.doctor.get_full_name(),
                'Especialidad': appointment.specialty.name if appointment.specialty else 'N/A',
                'Estado': appointment.get_status_display(),
                'Duración (min)': appointment.duration,
                'Motivo': appointment.reason,
                'Notas': appointment.notes
            })


class MedicationReportGenerator(BaseReportGenerator):
    """Generador de reportes de medicamentos"""
    
    def __init__(self, report):
        super().__init__(report)
        self.title = "Reporte de Dispensación de Medicamentos"
    
    def collect_data(self):
        from pharmacy.models import Dispensation
        
        queryset = Dispensation.objects.select_related(
            'medication', 'patient', 'pharmacist'
        )
        
        # Filtros de fecha
        if self.report.start_date:
            queryset = queryset.filter(dispensed_at__date__gte=self.report.start_date)
        if self.report.end_date:
            queryset = queryset.filter(dispensed_at__date__lte=self.report.end_date)
        
        # Filtros adicionales
        params = self.report.parameters
        if params.get('medication_id'):
            queryset = queryset.filter(medication_id=params['medication_id'])
        if params.get('patient_id'):
            queryset = queryset.filter(patient_id=params['patient_id'])
        
        # Recolectar datos
        self.data = []
        for dispensation in queryset:
            self.data.append({
                'Fecha': dispensation.dispensed_at.strftime('%d/%m/%Y %H:%M'),
                'Medicamento': dispensation.medication.name,
                'Forma': dispensation.medication.dosage_form,
                'Concentración': dispensation.medication.strength,
                'Cantidad': dispensation.quantity,
                'Paciente': dispensation.patient.get_full_name(),
                'DNI Paciente': dispensation.patient.dni,
                'Farmacéutico': dispensation.pharmacist.get_full_name() if dispensation.pharmacist else 'N/A',
                'Notas': dispensation.notes
            })


class EmergencyReportGenerator(BaseReportGenerator):
    """Generador de reportes de emergencias"""
    
    def __init__(self, report):
        super().__init__(report)
        self.title = "Reporte de Casos de Emergencia"
    
    def collect_data(self):
        from emergency.models import EmergencyCase
        
        queryset = EmergencyCase.objects.select_related(
            'patient', 'triage_nurse', 'attending_doctor'
        )
        
        # Filtros de fecha
        if self.report.start_date:
            queryset = queryset.filter(arrival_time__date__gte=self.report.start_date)
        if self.report.end_date:
            queryset = queryset.filter(arrival_time__date__lte=self.report.end_date)
        
        # Filtros adicionales
        params = self.report.parameters
        if params.get('triage_level'):
            queryset = queryset.filter(triage_level=params['triage_level'])
        if params.get('status'):
            queryset = queryset.filter(status=params['status'])
        
        # Recolectar datos
        self.data = []
        for case in queryset:
            self.data.append({
                'ID Caso': str(case.case_id),
                'Paciente': case.patient.get_full_name(),
                'DNI': case.patient.dni,
                'Llegada': case.arrival_time.strftime('%d/%m/%Y %H:%M'),
                'Nivel Triaje': case.get_triage_level_display() if case.triage_level else 'Pendiente',
                'Motivo': case.chief_complaint,
                'Doctor': case.attending_doctor.get_full_name() if case.attending_doctor else 'N/A',
                'Estado': case.get_status_display(),
                'Tiempo Espera (min)': case.waiting_time or 0,
                'Tiempo Total (min)': case.total_time,
                'Diagnóstico Alta': case.discharge_diagnosis
            })


class FinancialReportGenerator(BaseReportGenerator):
    """Generador de reportes financieros"""
    
    def __init__(self, report):
        super().__init__(report)
        self.title = "Reporte Financiero"
    
    def collect_data(self):
        from appointments.models import Appointment
        from authentication.models import DoctorProfile
        
        # Reporte de ingresos por consultas
        self.data = []
        
        # Obtener citas completadas en el período
        queryset = Appointment.objects.filter(
            status='completed'
        ).select_related('doctor', 'specialty')
        
        if self.report.start_date:
            queryset = queryset.filter(appointment_date__gte=self.report.start_date)
        if self.report.end_date:
            queryset = queryset.filter(appointment_date__lte=self.report.end_date)
        
        # Agrupar por doctor y calcular ingresos
        doctor_stats = {}
        for appointment in queryset:
            doctor_id = appointment.doctor.id
            if doctor_id not in doctor_stats:
                try:
                    doctor_profile = DoctorProfile.objects.get(user=appointment.doctor)
                    fee = doctor_profile.consultation_fee
                except DoctorProfile.DoesNotExist:
                    fee = 0
                
                doctor_stats[doctor_id] = {
                    'Doctor': appointment.doctor.get_full_name(),
                    'Especialidad': appointment.specialty.name if appointment.specialty else 'N/A',
                    'Total Consultas': 0,
                    'Tarifa por Consulta': float(fee),
                    'Ingreso Total': 0
                }
            
            doctor_stats[doctor_id]['Total Consultas'] += 1
            doctor_stats[doctor_id]['Ingreso Total'] += float(doctor_stats[doctor_id]['Tarifa por Consulta'])
        
        self.data = list(doctor_stats.values())


class OccupancyReportGenerator(BaseReportGenerator):
    """Generador de reportes de ocupación"""
    
    def __init__(self, report):
        super().__init__(report)
        self.title = "Reporte de Ocupación Hospitalaria"
    
    def collect_data(self):
        from appointments.models import Appointment, MedicalSchedule
        from emergency.models import EmergencyCase
        
        # Estadísticas de ocupación por día
        self.data = []
        
        # Determinar rango de fechas
        start_date = self.report.start_date or timezone.now().date() - timedelta(days=30)
        end_date = self.report.end_date or timezone.now().date()
        
        current_date = start_date
        while current_date <= end_date:
            # Citas del día
            appointments = Appointment.objects.filter(
                appointment_date=current_date
            ).exclude(status='cancelled')
            
            # Casos de emergencia del día
            emergency_cases = EmergencyCase.objects.filter(
                arrival_time__date=current_date
            )
            
            # Calcular ocupación
            total_appointments = appointments.count()
            completed_appointments = appointments.filter(status='completed').count()
            emergency_count = emergency_cases.count()
            emergency_active = emergency_cases.filter(
                status__in=['waiting', 'in_triage', 'in_treatment']
            ).count()
            
            self.data.append({
                'Fecha': current_date.strftime('%d/%m/%Y'),
                'Día Semana': current_date.strftime('%A'),
                'Total Citas': total_appointments,
                'Citas Completadas': completed_appointments,
                'Tasa Completación (%)': round((completed_appointments / total_appointments * 100) if total_appointments > 0 else 0, 2),
                'Casos Emergencia': emergency_count,
                'Emergencias Activas': emergency_active,
                'Ocupación Total': total_appointments + emergency_count
            })
            
            current_date += timedelta(days=1)

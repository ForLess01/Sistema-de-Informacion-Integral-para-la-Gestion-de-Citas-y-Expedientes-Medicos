from django.core.management.base import BaseCommand
from django.db import transaction
from authentication.models import User, DoctorProfile
from appointments.models import Specialty
from colorama import Fore, Style, init


class Command(BaseCommand):
    help = 'Configura perfiles de doctor y especialidades'
    
    def __init__(self):
        super().__init__()
        init(autoreset=True)
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--setup-doctors',
            action='store_true',
            help='Configurar perfiles para usuarios con rol doctor'
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='ID del usuario doctor específico para configurar'
        )
    
    def handle(self, *args, **options):
        if options['setup_doctors']:
            self.setup_all_doctors()
        elif options['user_id']:
            self.setup_single_doctor(options['user_id'])
        else:
            self.print_usage()
    
    def print_usage(self):
        """Mostrar información de uso"""
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"{Fore.CYAN}    CONFIGURACIÓN DE DOCTORES - Sistema Médico Integral")
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"\n{Fore.YELLOW}Uso:")
        self.stdout.write(f"  {Fore.GREEN}python manage.py setup_doctors --setup-doctors{Style.RESET_ALL}  -> Configurar todos los doctores")
        self.stdout.write(f"  {Fore.GREEN}python manage.py setup_doctors --user-id 17{Style.RESET_ALL}       -> Configurar doctor específico")
        
        self.stdout.write(f"\n{Fore.YELLOW}Especialidades disponibles:")
        specialties = Specialty.objects.all()
        for spec in specialties:
            self.stdout.write(f"  📚 {spec.name}")
    
    def setup_all_doctors(self):
        """Configurar perfiles para todos los usuarios con rol doctor"""
        doctors = User.objects.filter(role='doctor')
        
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"{Fore.CYAN}    CONFIGURANDO PERFILES DE DOCTORES")
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        
        if not doctors.exists():
            self.stdout.write(f"{Fore.YELLOW}No se encontraron usuarios con rol 'doctor'")
            return
        
        self.stdout.write(f"{Fore.GREEN}Encontrados {doctors.count()} doctores:")
        for doctor in doctors:
            self.stdout.write(f"  👨‍⚕️ {doctor.get_full_name()} ({doctor.email})")
        
        self.stdout.write(f"\n{Fore.YELLOW}¿Proceder con la configuración? (s/N):")
        confirm = input().strip().lower()
        
        if confirm in ['s', 'si', 'sí', 'y', 'yes']:
            for doctor in doctors:
                self.setup_doctor_profile(doctor)
        else:
            self.stdout.write(f"{Fore.YELLOW}Operación cancelada")
    
    def setup_single_doctor(self, user_id):
        """Configurar perfil para un doctor específico"""
        try:
            user = User.objects.get(id=user_id)
            if user.role != 'doctor':
                self.stdout.write(f"{Fore.RED}❌ El usuario {user.get_full_name()} no tiene rol de doctor")
                return
            
            self.setup_doctor_profile(user)
            
        except User.DoesNotExist:
            self.stdout.write(f"{Fore.RED}❌ Usuario con ID {user_id} no encontrado")
    
    def setup_doctor_profile(self, user):
        """Configurar perfil de un doctor específico"""
        self.stdout.write(f"\n{Fore.CYAN}═══ CONFIGURANDO DOCTOR ═══")
        self.stdout.write(f"👨‍⚕️ Doctor: {user.get_full_name()}")
        self.stdout.write(f"📧 Email: {user.email}")
        
        # Verificar si ya tiene perfil
        try:
            doctor_profile = DoctorProfile.objects.get(user=user)
            self.stdout.write(f"ℹ️ {Fore.YELLOW}Ya tiene perfil de doctor existente")
            
            specialties = list(doctor_profile.specialties.all())
            if specialties:
                spec_names = ", ".join([s.name for s in specialties])
                self.stdout.write(f"📚 Especialidades actuales: {spec_names}")
                
                update = input(f"{Fore.CYAN}¿Actualizar especialidades? (s/N): {Style.RESET_ALL}").strip().lower()
                if update not in ['s', 'si', 'sí', 'y', 'yes']:
                    self.stdout.write(f"{Fore.YELLOW}Manteniendo configuración actual")
                    return
            else:
                self.stdout.write(f"📚 {Fore.YELLOW}Sin especialidades asignadas")
                
        except DoctorProfile.DoesNotExist:
            self.stdout.write(f"ℹ️ {Fore.BLUE}Creando nuevo perfil de doctor")
            doctor_profile = None
        
        # Obtener número de colegiatura
        while True:
            license_number = input(f"{Fore.CYAN}Número de colegiatura/licencia: {Style.RESET_ALL}").strip()
            if license_number:
                # Verificar que no exista
                existing = DoctorProfile.objects.filter(license_number=license_number).exclude(user=user).first()
                if existing:
                    self.stdout.write(f"{Fore.RED}❌ Número de colegiatura ya existe para {existing.user.get_full_name()}")
                    continue
                break
            else:
                self.stdout.write(f"{Fore.RED}❌ El número de colegiatura es obligatorio")
        
        # Seleccionar especialidades
        specialties = self.select_specialties()
        if not specialties:
            self.stdout.write(f"{Fore.RED}❌ Debe seleccionar al menos una especialidad")
            return
        
        # Información adicional
        years_experience = input(f"{Fore.CYAN}Años de experiencia (opcional, presione Enter para omitir): {Style.RESET_ALL}").strip()
        years_experience = int(years_experience) if years_experience.isdigit() else 0
        
        consultation_fee = input(f"{Fore.CYAN}Costo de consulta en soles (opcional, presione Enter para 0): {Style.RESET_ALL}").strip()
        consultation_fee = float(consultation_fee) if consultation_fee else 0.0
        
        bio = input(f"{Fore.CYAN}Biografía profesional (opcional, presione Enter para omitir): {Style.RESET_ALL}").strip()
        
        # Confirmar y crear/actualizar perfil
        self.confirm_and_create_profile(user, license_number, specialties, years_experience, consultation_fee, bio)
    
    def select_specialties(self):
        """Seleccionar especialidades para el doctor"""
        available_specialties = list(Specialty.objects.all())
        
        if not available_specialties:
            self.stdout.write(f"{Fore.RED}❌ No hay especialidades disponibles en el sistema")
            return []
        
        self.stdout.write(f"\n{Fore.YELLOW}Especialidades disponibles:")
        for i, spec in enumerate(available_specialties, 1):
            self.stdout.write(f"  {i}. {spec.name}")
        
        self.stdout.write(f"\n{Fore.CYAN}Seleccione especialidades (ej: 1,3,5 o separadas por comas):")
        
        while True:
            selection = input(f"{Fore.CYAN}Especialidades: {Style.RESET_ALL}").strip()
            
            if not selection:
                self.stdout.write(f"{Fore.RED}❌ Debe seleccionar al menos una especialidad")
                continue
            
            try:
                indices = [int(x.strip()) - 1 for x in selection.split(',')]
                selected_specialties = []
                
                for idx in indices:
                    if 0 <= idx < len(available_specialties):
                        selected_specialties.append(available_specialties[idx])
                    else:
                        self.stdout.write(f"{Fore.RED}❌ Índice {idx + 1} fuera de rango")
                        raise ValueError()
                
                if selected_specialties:
                    # Mostrar selección
                    self.stdout.write(f"\n{Fore.GREEN}Especialidades seleccionadas:")
                    for spec in selected_specialties:
                        self.stdout.write(f"  ✅ {spec.name}")
                    
                    return selected_specialties
                else:
                    self.stdout.write(f"{Fore.RED}❌ Selección vacía")
                    
            except (ValueError, IndexError):
                self.stdout.write(f"{Fore.RED}❌ Formato inválido. Use números separados por comas (ej: 1,2,3)")
                continue
    
    def confirm_and_create_profile(self, user, license_number, specialties, years_experience, consultation_fee, bio):
        """Confirmar y crear el perfil del doctor"""
        self.stdout.write(f"\n{Fore.YELLOW}Confirmar datos del doctor:")
        self.stdout.write(f"  👨‍⚕️ Doctor: {user.get_full_name()}")
        self.stdout.write(f"  📜 Colegiatura: {license_number}")
        self.stdout.write(f"  📚 Especialidades: {', '.join([s.name for s in specialties])}")
        self.stdout.write(f"  ⏰ Experiencia: {years_experience} años")
        self.stdout.write(f"  💰 Costo consulta: S/. {consultation_fee}")
        if bio:
            self.stdout.write(f"  📝 Bio: {bio[:50]}{'...' if len(bio) > 50 else ''}")
        
        confirm = input(f"\n{Fore.CYAN}¿Confirmar creación del perfil? (s/N): {Style.RESET_ALL}").strip().lower()
        
        if confirm in ['s', 'si', 'sí', 'y', 'yes']:
            try:
                with transaction.atomic():
                    # Crear o actualizar perfil
                    doctor_profile, created = DoctorProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'license_number': license_number,
                            'consultation_fee': consultation_fee,
                            'bio': bio,
                            'years_of_experience': years_experience
                        }
                    )
                    
                    if not created:
                        # Actualizar perfil existente
                        doctor_profile.license_number = license_number
                        doctor_profile.consultation_fee = consultation_fee
                        doctor_profile.bio = bio
                        doctor_profile.years_of_experience = years_experience
                        doctor_profile.save()
                    
                    # Asignar especialidades
                    doctor_profile.specialties.clear()
                    doctor_profile.specialties.add(*specialties)
                    
                    action = "creado" if created else "actualizado"
                    self.stdout.write(f"{Fore.GREEN}✅ Perfil de doctor {action} exitosamente!")
                    self.stdout.write(f"   Dr. {user.get_full_name()} - Colegiatura: {license_number}")
                    
                    # Mostrar especialidades asignadas
                    self.stdout.write(f"   📚 Especialidades:")
                    for spec in specialties:
                        self.stdout.write(f"      - {spec.name}")
                    
            except Exception as e:
                self.stdout.write(f"{Fore.RED}❌ Error al crear perfil: {e}")
        else:
            self.stdout.write(f"{Fore.YELLOW}Creación de perfil cancelada")

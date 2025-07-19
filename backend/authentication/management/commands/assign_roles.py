from django.core.management.base import BaseCommand
from django.db import transaction
from authentication.models import User, DoctorProfile
from appointments.models import Specialty
from colorama import Fore, Style, init
import sys


class Command(BaseCommand):
    help = 'Asigna roles a usuarios del sistema con validación de coherencia'
    
    def __init__(self):
        super().__init__()
        init(autoreset=True)  # Inicializar colorama
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--list',
            action='store_true',
            help='Listar todos los usuarios con sus roles y especialidades actuales'
        )
        parser.add_argument(
            '--assign',
            action='store_true',
            help='Modo interactivo para asignar roles con validación'
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='ID del usuario para asignar rol específico'
        )
        parser.add_argument(
            '--role',
            choices=['patient', 'doctor', 'nurse', 'receptionist', 'admin', 'pharmacist', 'emergency', 'obstetriz', 'odontologo'],
            help='Rol a asignar al usuario'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forzar asignación sin validación de coherencia'
        )
    
    def handle(self, *args, **options):
        if options['list']:
            self.list_users_detailed()
        elif options['assign']:
            self.interactive_assign()
        elif options['user_id'] and options['role']:
            self.assign_single_role(options['user_id'], options['role'], options.get('force', False))
        else:
            self.print_usage()
    
    def print_usage(self):
        """Mostrar información de uso del comando"""
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"{Fore.CYAN}    GESTIÓN INTELIGENTE DE ROLES - Sistema Médico Integral")
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"\n{Fore.YELLOW}Uso:")
        self.stdout.write(f"  {Fore.GREEN}python manage.py assign_roles --list{Style.RESET_ALL}  -> Listar usuarios detallado")
        self.stdout.write(f"  {Fore.GREEN}python manage.py assign_roles --assign{Style.RESET_ALL} -> Modo interactivo")
        self.stdout.write(f"  {Fore.GREEN}python manage.py assign_roles --user-id 1 --role doctor{Style.RESET_ALL} -> Asignar rol específico")
        
        self.stdout.write(f"\n{Fore.YELLOW}Reglas de Coherencia:")
        self.stdout.write(f"  {Fore.BLUE}👨‍⚕️ Doctor{Style.RESET_ALL} -> Solo usuarios con especialidades médicas")
        self.stdout.write(f"     ✅ Especialidades válidas: Medicina General, Cardiología, Dermatología, Obstetricia, Odontología")
        self.stdout.write(f"  {Fore.BLUE}👩‍⚕️ Nurse{Style.RESET_ALL} -> Personal de enfermería (sin especialidades médicas)")
        self.stdout.write(f"  {Fore.BLUE}💊 Pharmacist{Style.RESET_ALL} -> Personal de farmacia (sin especialidades médicas)")
        self.stdout.write(f"  {Fore.BLUE}📋 Receptionist{Style.RESET_ALL} -> Personal administrativo")
        self.stdout.write(f"  {Fore.BLUE}🚑 Emergency{Style.RESET_ALL} -> Personal de emergencias")
        self.stdout.write(f"  {Fore.BLUE}⚙️ Admin{Style.RESET_ALL} -> Administradores del sistema")
        self.stdout.write(f"  {Fore.BLUE}🧍 Patient{Style.RESET_ALL} -> Usuarios sin especialidades médicas ni roles administrativos")
    
    def get_user_specialty_info(self, user):
        """Obtener información de especialidades de un usuario"""
        try:
            doctor_profile = DoctorProfile.objects.get(user=user)
            specialties = list(doctor_profile.specialties.all())
            return specialties
        except DoctorProfile.DoesNotExist:
            return []
    
    def list_users_detailed(self):
        """Listar todos los usuarios con información detallada"""
        users = User.objects.all().order_by('id')
        
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"{Fore.CYAN}    USUARIOS CON ROLES Y ESPECIALIDADES")
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        
        role_colors = {
            'patient': Fore.WHITE,
            'doctor': Fore.GREEN,
            'nurse': Fore.LIGHTGREEN_EX,
            'receptionist': Fore.YELLOW,
            'admin': Fore.RED,
            'pharmacist': Fore.MAGENTA,
            'emergency': Fore.LIGHTRED_EX,
            'obstetriz': Fore.LIGHTCYAN_EX,
            'odontologo': Fore.BLUE
        }
        
        role_emojis = {
            'patient': '🧍',
            'doctor': '👨‍⚕️',
            'nurse': '👩‍⚕️',
            'receptionist': '📋',
            'admin': '⚙️',
            'pharmacist': '💊',
            'emergency': '🚑',
            'obstetriz': '🤱',
            'odontologo': '🦷'
        }
        
        for user in users:
            color = role_colors.get(user.role, Fore.WHITE)
            emoji = role_emojis.get(user.role, '👤')
            specialties = self.get_user_specialty_info(user)
            
            # Validar coherencia
            is_coherent = self.validate_role_specialty_coherence(user.role, specialties)
            coherence_indicator = "✅" if is_coherent else "⚠️"
            
            self.stdout.write(
                f"{Fore.BLUE}ID: {user.id:2d}{Style.RESET_ALL} | "
                f"{emoji} {color}{user.role:<15}{Style.RESET_ALL} | "
                f"{coherence_indicator} | "
                f"{Fore.CYAN}{user.email:<30}{Style.RESET_ALL} | "
                f"{user.get_full_name()}"
            )
            
            if specialties:
                spec_names = ", ".join([s.name for s in specialties])
                self.stdout.write(f"      📚 Especialidades: {Fore.LIGHTBLUE_EX}{spec_names}{Style.RESET_ALL}")
            
            if not is_coherent:
                self.stdout.write(f"      {Fore.YELLOW}⚠️  INCONSISTENCIA: Revisar rol vs especialidades{Style.RESET_ALL}")
            
            self.stdout.write("")  # Línea en blanco
        
        self.stdout.write(f"{Fore.GREEN}Total de usuarios: {users.count()}")
        
        # Resumen de inconsistencias
        inconsistent_users = []
        for user in users:
            specialties = self.get_user_specialty_info(user)
            if not self.validate_role_specialty_coherence(user.role, specialties):
                inconsistent_users.append(user)
        
        if inconsistent_users:
            self.stdout.write(f"\n{Fore.YELLOW}⚠️ USUARIOS CON INCONSISTENCIAS ({len(inconsistent_users)}):")
            for user in inconsistent_users:
                self.stdout.write(f"  - {user.get_full_name()} (ID: {user.id}) - Rol: {user.role}")
    
    def validate_role_specialty_coherence(self, role, specialties):
        """Validar coherencia entre rol y especialidades"""
        medical_specialties = ['Medicina General', 'Cardiología', 'Dermatología', 'Obstetricia', 'Odontología']
        user_has_medical_specialties = any(spec.name in medical_specialties for spec in specialties)
        
        coherence_rules = {
            'doctor': user_has_medical_specialties,  # Doctor debe tener especialidades médicas
            'nurse': not user_has_medical_specialties,  # Enfermero NO debe tener especialidades médicas  
            'pharmacist': not user_has_medical_specialties,  # Farmacéutico NO debe tener especialidades médicas
            'receptionist': not user_has_medical_specialties,  # Administrativo NO debe tener especialidades médicas
            'emergency': not user_has_medical_specialties,  # Personal emergencias NO debe tener especialidades médicas
            'admin': True,  # Admin puede tener cualquier configuración
            'patient': not user_has_medical_specialties,  # Paciente NO debe tener especialidades médicas
        }
        
        return coherence_rules.get(role, True)
    
    def get_valid_roles_for_user(self, user):
        """Obtener roles válidos para un usuario basado en sus especialidades"""
        specialties = self.get_user_specialty_info(user)
        medical_specialties = ['Medicina General', 'Cardiología', 'Dermatología', 'Obstetricia', 'Odontología']
        user_has_medical_specialties = any(spec.name in medical_specialties for spec in specialties)
        
        if user_has_medical_specialties:
            # Usuario con especialidades médicas puede ser:
            return ['doctor', 'admin']
        else:
            # Usuario sin especialidades médicas puede ser:
            return ['patient', 'nurse', 'pharmacist', 'receptionist', 'emergency', 'admin']
    
    def interactive_assign(self):
        """Modo interactivo para asignar roles con validación"""
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        self.stdout.write(f"{Fore.CYAN}    ASIGNACIÓN INTELIGENTE DE ROLES")
        self.stdout.write(f"{Fore.CYAN}═══════════════════════════════════════════════════════════════")
        
        while True:
            self.list_users_detailed()
            self.stdout.write(f"\n{Fore.YELLOW}Opciones:")
            self.stdout.write(f"  {Fore.GREEN}[número]{Style.RESET_ALL} -> Seleccionar usuario por ID")
            self.stdout.write(f"  {Fore.GREEN}q{Style.RESET_ALL} -> Salir")
            
            choice = input(f"\n{Fore.CYAN}Seleccione opción: {Style.RESET_ALL}").strip()
            
            if choice.lower() == 'q':
                self.stdout.write(f"{Fore.GREEN}¡Hasta luego!")
                break
            
            try:
                user_id = int(choice)
                try:
                    user = User.objects.get(id=user_id)
                    self.assign_role_to_user_interactive(user)
                except User.DoesNotExist:
                    self.stdout.write(f"{Fore.RED}❌ Usuario con ID {user_id} no encontrado")
            except ValueError:
                self.stdout.write(f"{Fore.RED}❌ Opción inválida")
    
    def assign_role_to_user_interactive(self, user):
        """Asignar rol a un usuario específico con validación"""
        specialties = self.get_user_specialty_info(user)
        valid_roles = self.get_valid_roles_for_user(user)
        
        self.stdout.write(f"\n{Fore.CYAN}═══ USUARIO SELECCIONADO ═══")
        self.stdout.write(f"📧 Email: {user.email}")
        self.stdout.write(f"👤 Nombre: {user.get_full_name()}")
        self.stdout.write(f"🏷️  Rol actual: {Fore.YELLOW}{user.role}{Style.RESET_ALL}")
        
        if specialties:
            spec_names = ", ".join([s.name for s in specialties])
            self.stdout.write(f"📚 Especialidades: {Fore.LIGHTBLUE_EX}{spec_names}{Style.RESET_ALL}")
        else:
            self.stdout.write(f"📚 Especialidades: {Fore.LIGHTBLACK_EX}Ninguna{Style.RESET_ALL}")
        
        # Mostrar coherencia actual
        is_coherent = self.validate_role_specialty_coherence(user.role, specialties)
        if is_coherent:
            self.stdout.write(f"✅ {Fore.GREEN}Rol actual es coherente{Style.RESET_ALL}")
        else:
            self.stdout.write(f"⚠️ {Fore.YELLOW}Rol actual NO es coherente con especialidades{Style.RESET_ALL}")
        
        role_options = [
            ("1", "patient", "Paciente", "🧍"),
            ("2", "doctor", "Doctor/Médico", "👨‍⚕️"),
            ("3", "nurse", "Enfermero/a", "👩‍⚕️"),
            ("4", "receptionist", "Administrativo/Recepcionista", "📋"),
            ("5", "admin", "Administrador", "⚙️"),
            ("6", "pharmacist", "Farmacéutico", "💊"),
            ("7", "emergency", "Personal de Emergencias", "🚑")
        ]
        
        self.stdout.write(f"\n{Fore.YELLOW}Seleccione nuevo rol:")
        for num, role, name, emoji in role_options:
            if role in valid_roles:
                color = Fore.GREEN if role != user.role else Fore.LIGHTBLACK_EX
                status = "✅"
            else:
                color = Fore.RED
                status = "❌"
            
            self.stdout.write(f"  {color}{num}. {status} {emoji} {name} ({role}){Style.RESET_ALL}")
        
        self.stdout.write(f"  {Fore.BLUE}8. 🔧 Forzar cualquier rol (ignorar coherencia){Style.RESET_ALL}")
        self.stdout.write(f"  {Fore.RED}0. Cancelar{Style.RESET_ALL}")
        
        choice = input(f"\n{Fore.CYAN}Opción: {Style.RESET_ALL}").strip()
        
        role_map = {
            "1": "patient",
            "2": "doctor", 
            "3": "nurse",
            "4": "receptionist",
            "5": "admin",
            "6": "pharmacist",
            "7": "emergency"
        }
        
        if choice == "0":
            self.stdout.write(f"{Fore.YELLOW}Operación cancelada")
            return
        elif choice == "8":
            self.force_assign_role(user, role_options)
        elif choice in role_map:
            new_role = role_map[choice]
            if new_role in valid_roles:
                self.confirm_and_assign(user, new_role)
            else:
                self.stdout.write(f"{Fore.RED}❌ Rol no coherente con las especialidades del usuario")
                self.stdout.write(f"💡 Use la opción 8 para forzar la asignación")
        else:
            self.stdout.write(f"{Fore.RED}❌ Opción inválida")
    
    def force_assign_role(self, user, role_options):
        """Forzar asignación de cualquier rol"""
        self.stdout.write(f"\n{Fore.YELLOW}⚠️ MODO FORZADO - Ignorando coherencia de especialidades")
        self.stdout.write(f"{Fore.YELLOW}Seleccione rol a forzar:")
        
        for num, role, name, emoji in role_options:
            color = Fore.YELLOW if role != user.role else Fore.LIGHTBLACK_EX
            self.stdout.write(f"  {color}{num}. {emoji} {name} ({role}){Style.RESET_ALL}")
        
        choice = input(f"\n{Fore.CYAN}Opción: {Style.RESET_ALL}").strip()
        
        role_map = {
            "1": "patient", "2": "doctor", "3": "nurse",
            "4": "receptionist", "5": "admin", "6": "pharmacist", "7": "emergency"
        }
        
        if choice in role_map:
            new_role = role_map[choice]
            self.stdout.write(f"{Fore.RED}⚠️ ADVERTENCIA: Asignando rol sin validar coherencia")
            self.confirm_and_assign(user, new_role, forced=True)
        else:
            self.stdout.write(f"{Fore.RED}❌ Opción inválida")
    
    def confirm_and_assign(self, user, new_role, forced=False):
        """Confirmar y asignar el rol"""
        role_names = {
            'patient': 'Paciente 🧍',
            'doctor': 'Doctor/Médico 👨‍⚕️',
            'nurse': 'Enfermero/a 👩‍⚕️',
            'receptionist': 'Administrativo/Recepcionista 📋',
            'admin': 'Administrador ⚙️',
            'pharmacist': 'Farmacéutico 💊',
            'emergency': 'Personal de Emergencias 🚑'
        }
        
        self.stdout.write(f"\n{Fore.YELLOW}Confirmar cambio:")
        self.stdout.write(f"  Usuario: {user.get_full_name()} ({user.email})")
        self.stdout.write(f"  Rol anterior: {Fore.RED}{user.role}{Style.RESET_ALL}")
        self.stdout.write(f"  Rol nuevo: {Fore.GREEN}{role_names[new_role]}{Style.RESET_ALL}")
        
        if forced:
            self.stdout.write(f"  {Fore.RED}⚠️ ASIGNACIÓN FORZADA (sin validación de coherencia){Style.RESET_ALL}")
        
        confirm = input(f"\n{Fore.CYAN}¿Confirmar cambio? (s/N): {Style.RESET_ALL}").strip().lower()
        
        if confirm in ['s', 'si', 'sí', 'y', 'yes']:
            try:
                with transaction.atomic():
                    old_role = user.role
                    user.role = new_role
                    user.save()
                    
                    self.stdout.write(f"{Fore.GREEN}✅ Rol actualizado exitosamente!")
                    self.stdout.write(f"   {user.get_full_name()} ahora es: {role_names[new_role]}")
                    
                    # Validar coherencia post-cambio
                    specialties = self.get_user_specialty_info(user)
                    is_coherent = self.validate_role_specialty_coherence(new_role, specialties)
                    
                    if is_coherent:
                        self.stdout.write(f"   ✅ {Fore.GREEN}Asignación coherente{Style.RESET_ALL}")
                    else:
                        self.stdout.write(f"   ⚠️ {Fore.YELLOW}NOTA: Asignación no coherente con especialidades{Style.RESET_ALL}")
                    
            except Exception as e:
                self.stdout.write(f"{Fore.RED}❌ Error al actualizar rol: {e}")
        else:
            self.stdout.write(f"{Fore.YELLOW}Cambio cancelado")
    
    def assign_single_role(self, user_id, role, force=False):
        """Asignar rol específico a un usuario"""
        try:
            user = User.objects.get(id=user_id)
            
            if not force:
                specialties = self.get_user_specialty_info(user)
                valid_roles = self.get_valid_roles_for_user(user)
                
                if role not in valid_roles:
                    self.stdout.write(f"{Fore.RED}❌ Rol '{role}' no es coherente para este usuario")
                    self.stdout.write(f"   Roles válidos: {', '.join(valid_roles)}")
                    self.stdout.write(f"   Use --force para ignorar la validación")
                    return
            
            with transaction.atomic():
                old_role = user.role
                user.role = role
                user.save()
                
                self.stdout.write(f"{Fore.GREEN}✅ Rol actualizado:")
                self.stdout.write(f"   Usuario: {user.get_full_name()} ({user.email})")
                self.stdout.write(f"   {old_role} → {role}")
                
                if force:
                    self.stdout.write(f"   {Fore.YELLOW}⚠️ Asignación forzada{Style.RESET_ALL}")
                
        except User.DoesNotExist:
            self.stdout.write(f"{Fore.RED}❌ Usuario con ID {user_id} no encontrado")
        except Exception as e:
            self.stdout.write(f"{Fore.RED}❌ Error: {e}")

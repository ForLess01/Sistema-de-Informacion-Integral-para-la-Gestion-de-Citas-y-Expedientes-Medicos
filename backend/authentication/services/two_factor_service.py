import pyotp
import qrcode
import io
import base64
import secrets
from typing import List, Tuple, Optional
from django.conf import settings


class TwoFactorService:
    """Servicio para manejar la autenticación de dos factores"""
    
    @staticmethod
    def generate_secret() -> str:
        """Genera un secreto único para 2FA"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(user_email: str, secret: str) -> str:
        """
        Genera un código QR para configurar 2FA
        Retorna la imagen QR en formato base64
        """
        # Nombre del emisor (nombre del hospital/sistema)
        issuer_name = getattr(settings, 'TWO_FACTOR_ISSUER_NAME', 'Sistema Médico')
        
        # Generar URI para el autenticador
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=issuer_name
        )
        
        # Generar código QR
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Convertir a imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_str = base64.b64encode(buffer.read()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    @staticmethod
    def verify_token(secret: str, token: str) -> bool:
        """
        Verifica si el token proporcionado es válido
        """
        if not secret or not token:
            return False
        
        totp = pyotp.TOTP(secret)
        # Permitir un margen de tiempo de 30 segundos (1 ventana)
        return totp.verify(token, valid_window=1)
    
    @staticmethod
    def generate_backup_tokens(count: int = 10) -> List[str]:
        """
        Genera tokens de respaldo para recuperación
        """
        tokens = []
        for _ in range(count):
            # Generar token de 8 caracteres
            token = secrets.token_hex(4).upper()
            # Formatear como XXXX-XXXX
            formatted_token = f"{token[:4]}-{token[4:]}"
            tokens.append(formatted_token)
        return tokens
    
    @staticmethod
    def format_backup_token(token: str) -> str:
        """
        Formatea un token de respaldo eliminando guiones y espacios
        """
        return token.replace('-', '').replace(' ', '').upper()
    
    @staticmethod
    def verify_backup_token(stored_tokens: List[str], provided_token: str) -> Tuple[bool, Optional[str]]:
        """
        Verifica si un token de respaldo es válido
        Retorna (es_valido, token_usado)
        """
        formatted_token = TwoFactorService.format_backup_token(provided_token)
        
        for stored_token in stored_tokens:
            formatted_stored = TwoFactorService.format_backup_token(stored_token)
            if formatted_stored == formatted_token:
                return True, stored_token
        
        return False, None
    
    @staticmethod
    def enable_two_factor(user) -> Tuple[str, List[str], str]:
        """
        Habilita 2FA para un usuario
        Retorna (secret, backup_tokens, qr_code_base64)
        """
        # Generar secreto
        secret = TwoFactorService.generate_secret()
        
        # Generar tokens de respaldo
        backup_tokens = TwoFactorService.generate_backup_tokens()
        
        # Generar código QR
        qr_code = TwoFactorService.generate_qr_code(user.email, secret)
        
        # Actualizar usuario
        user.two_factor_secret = secret
        user.backup_tokens = backup_tokens
        user.two_factor_enabled = False  # Se habilitará después de verificar
        user.save()
        
        return secret, backup_tokens, qr_code
    
    @staticmethod
    def confirm_two_factor(user, token: str) -> bool:
        """
        Confirma la activación de 2FA verificando el primer token
        """
        if TwoFactorService.verify_token(user.two_factor_secret, token):
            user.two_factor_enabled = True
            user.save()
            return True
        return False
    
    @staticmethod
    def disable_two_factor(user) -> None:
        """
        Desactiva 2FA para un usuario
        """
        user.two_factor_enabled = False
        user.two_factor_secret = ''
        user.backup_tokens = []
        user.save()
    
    @staticmethod
    def regenerate_backup_tokens(user) -> List[str]:
        """
        Regenera los tokens de respaldo para un usuario
        """
        new_tokens = TwoFactorService.generate_backup_tokens()
        user.backup_tokens = new_tokens
        user.save()
        return new_tokens

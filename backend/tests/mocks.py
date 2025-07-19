"""
Mocks comunes para tests
"""
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
import json


class MockEmailBackend:
    """Mock para el backend de email"""
    def __init__(self):
        self.sent_emails = []
    
    def send_messages(self, messages):
        self.sent_emails.extend(messages)
        return len(messages)
    
    def reset(self):
        self.sent_emails = []


class MockSMSService:
    """Mock para servicio de SMS"""
    def __init__(self):
        self.sent_messages = []
        self.fail_next = False
    
    def send(self, phone, message):
        if self.fail_next:
            self.fail_next = False
            return False
        
        self.sent_messages.append({
            'phone': phone,
            'message': message,
            'sent_at': timezone.now()
        })
        return True
    
    def reset(self):
        self.sent_messages = []
        self.fail_next = False


class MockCeleryTask:
    """Mock para tareas de Celery"""
    def __init__(self, task_name):
        self.task_name = task_name
        self.call_count = 0
        self.call_args = []
        self.results = []
    
    def delay(self, *args, **kwargs):
        self.call_count += 1
        self.call_args.append((args, kwargs))
        result = Mock()
        result.id = f'mock-task-{self.call_count}'
        self.results.append(result)
        return result
    
    def apply_async(self, args=None, kwargs=None, **options):
        self.call_count += 1
        self.call_args.append((args, kwargs, options))
        result = Mock()
        result.id = f'mock-task-async-{self.call_count}'
        self.results.append(result)
        return result
    
    def reset(self):
        self.call_count = 0
        self.call_args = []
        self.results = []


class MockStorageBackend:
    """Mock para almacenamiento de archivos"""
    def __init__(self):
        self.files = {}
    
    def save(self, name, content):
        self.files[name] = content
        return name
    
    def delete(self, name):
        if name in self.files:
            del self.files[name]
    
    def exists(self, name):
        return name in self.files
    
    def url(self, name):
        return f'/media/{name}'
    
    def reset(self):
        self.files = {}


class MockCache:
    """Mock para cache de Django"""
    def __init__(self):
        self.data = {}
    
    def get(self, key, default=None):
        return self.data.get(key, default)
    
    def set(self, key, value, timeout=None):
        self.data[key] = value
    
    def delete(self, key):
        if key in self.data:
            del self.data[key]
    
    def clear(self):
        self.data = {}
    
    def get_many(self, keys):
        return {k: self.data.get(k) for k in keys if k in self.data}
    
    def set_many(self, data, timeout=None):
        self.data.update(data)


class MockAPIResponse:
    """Mock para respuestas de API externas"""
    def __init__(self, status_code=200, json_data=None, text='', headers=None):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text
        self.headers = headers or {}
        self.ok = 200 <= status_code < 300
    
    def json(self):
        return self._json_data
    
    def raise_for_status(self):
        if not self.ok:
            raise Exception(f'HTTP {self.status_code} Error')


class MockPaymentGateway:
    """Mock para pasarela de pagos"""
    def __init__(self):
        self.transactions = []
        self.next_transaction_id = 1000
        self.fail_next = False
    
    def process_payment(self, amount, currency='PEN', **kwargs):
        if self.fail_next:
            self.fail_next = False
            return {
                'success': False,
                'error': 'Payment declined',
                'transaction_id': None
            }
        
        transaction_id = f'TXN{self.next_transaction_id}'
        self.next_transaction_id += 1
        
        transaction = {
            'transaction_id': transaction_id,
            'amount': amount,
            'currency': currency,
            'status': 'completed',
            'timestamp': timezone.now(),
            **kwargs
        }
        
        self.transactions.append(transaction)
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'status': 'completed'
        }
    
    def refund(self, transaction_id, amount=None):
        for transaction in self.transactions:
            if transaction['transaction_id'] == transaction_id:
                refund_amount = amount or transaction['amount']
                transaction['refunds'] = transaction.get('refunds', [])
                transaction['refunds'].append({
                    'amount': refund_amount,
                    'timestamp': timezone.now()
                })
                return {
                    'success': True,
                    'refund_id': f'REF{self.next_transaction_id}'
                }
        
        return {
            'success': False,
            'error': 'Transaction not found'
        }
    
    def reset(self):
        self.transactions = []
        self.next_transaction_id = 1000
        self.fail_next = False


# Funciones de utilidad para mocking
def mock_datetime_now(target_datetime):
    """
    Crea un mock para datetime.now() que retorna una fecha específica
    
    Uso:
    with mock_datetime_now(datetime(2024, 1, 1, 10, 0)):
        # datetime.now() retornará 2024-01-01 10:00:00
    """
    return patch('django.utils.timezone.now', return_value=target_datetime)


def mock_external_api(responses):
    """
    Mock para APIs externas con respuestas predefinidas
    
    Uso:
    responses = {
        'https://api.example.com/users': {'users': [...]},
        'https://api.example.com/data': {'data': {...}}
    }
    with mock_external_api(responses):
        # Las llamadas a estas URLs retornarán los datos especificados
    """
    def side_effect(url, *args, **kwargs):
        if url in responses:
            return MockAPIResponse(200, responses[url])
        return MockAPIResponse(404, {'error': 'Not found'})
    
    return patch('requests.get', side_effect=side_effect)


def mock_file_upload(filename='test.pdf', content=b'Test content', size=1024):
    """
    Crea un mock de archivo para upload
    """
    from django.core.files.uploadedfile import SimpleUploadedFile
    return SimpleUploadedFile(filename, content, content_type='application/pdf', size=size)


# Decoradores útiles para tests
def with_mock_email(test_func):
    """Decorador para tests que envían emails"""
    def wrapper(*args, **kwargs):
        with patch('django.core.mail.send_mail') as mock_send:
            mock_send.return_value = 1
            return test_func(*args, mock_send=mock_send, **kwargs)
    return wrapper


def with_mock_celery(test_func):
    """Decorador para tests que usan Celery"""
    def wrapper(*args, **kwargs):
        with patch('celery.current_app.send_task') as mock_task:
            return test_func(*args, mock_task=mock_task, **kwargs)
    return wrapper


# Contexto managers para tests
class MockTimeContext:
    """Context manager para mockear el tiempo"""
    def __init__(self, target_time):
        self.target_time = target_time
        self.patcher = None
    
    def __enter__(self):
        self.patcher = patch('django.utils.timezone.now')
        mock_now = self.patcher.start()
        mock_now.return_value = self.target_time
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.patcher:
            self.patcher.stop()


class MockSettingsContext:
    """Context manager para cambiar settings temporalmente"""
    def __init__(self, **settings):
        self.settings = settings
        self.original_settings = {}
    
    def __enter__(self):
        from django.conf import settings as django_settings
        for key, value in self.settings.items():
            if hasattr(django_settings, key):
                self.original_settings[key] = getattr(django_settings, key)
            setattr(django_settings, key, value)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        from django.conf import settings as django_settings
        for key, value in self.original_settings.items():
            setattr(django_settings, key, value)


# Datos de prueba comunes
TEST_DATA = {
    'valid_phone': '+51999888777',
    'valid_email': 'test@example.com',
    'valid_dni': '12345678',
    'valid_password': 'TestPass123!',
    'invalid_emails': [
        'notanemail',
        '@example.com',
        'test@',
        'test..user@example.com'
    ],
    'invalid_phones': [
        '123',
        'abcdefgh',
        '+999',
        '12345678901234567890'
    ],
    'blood_types': ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    'genders': ['M', 'F', 'O'],
    'appointment_statuses': ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    'triage_levels': [1, 2, 3, 4, 5],
    'payment_methods': ['cash', 'card', 'insurance', 'transfer']
}
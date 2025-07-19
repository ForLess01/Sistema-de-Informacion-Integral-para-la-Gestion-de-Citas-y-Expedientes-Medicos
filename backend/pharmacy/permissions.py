from rest_framework import permissions


class IsPharmacistOrAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que permite:
    - Lectura a cualquier usuario autenticado
    - Modificación solo a farmacéuticos y administradores
    """
    
    def has_permission(self, request, view):
        # Permitir lectura a usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Permitir modificación solo a farmacéuticos y administradores
        return request.user and request.user.is_authenticated and (
            request.user.role in ['pharmacist', 'admin'] or 
            request.user.is_superuser
        )


class IsPharmacistOrAdmin(permissions.BasePermission):
    """
    Permiso que solo permite acceso a farmacéuticos y administradores
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in ['pharmacist', 'admin'] or 
            request.user.is_superuser
        )


class IsOwnerOrPharmacist(permissions.BasePermission):
    """
    Permiso que permite acceso al propietario del recurso o a farmacéuticos
    """
    
    def has_object_permission(self, request, view, obj):
        # Permitir lectura si es el propietario o un farmacéutico
        if request.method in permissions.SAFE_METHODS:
            if hasattr(obj, 'patient'):
                return obj.patient == request.user or request.user.role in ['pharmacist', 'admin']
            return True
        
        # Permitir modificación solo a farmacéuticos y administradores
        return request.user.role in ['pharmacist', 'admin'] or request.user.is_superuser

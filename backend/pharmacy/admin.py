from django.contrib import admin
from .models import (
    Medication, MedicationCategory, MedicationBatch,
    StockMovement, Dispensation
)

@admin.register(MedicationCategory)
class MedicationCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ['name', 'dosage_form', 'strength', 'quantity_in_stock', 'needs_reorder']
    list_filter = ['dosage_form']
    search_fields = ['name', 'description']

@admin.register(MedicationBatch)
class MedicationBatchAdmin(admin.ModelAdmin):
    list_display = ['batch_number', 'medication', 'quantity', 'expiry_date', 'supplier']
    list_filter = ['expiry_date', 'supplier']
    search_fields = ['medication__name', 'batch_number']
    date_hierarchy = 'expiry_date'

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['medication', 'movement_type', 'quantity', 'performed_at', 'performed_by']
    list_filter = ['movement_type', 'performed_at']
    date_hierarchy = 'performed_at'
    readonly_fields = ['performed_at', 'stock_before', 'stock_after']

@admin.register(Dispensation)
class DispensationAdmin(admin.ModelAdmin):
    list_display = ['medication', 'patient', 'quantity', 'pharmacist', 'dispensed_at']
    list_filter = ['dispensed_at']
    search_fields = ['patient__first_name', 'patient__last_name', 'medication__name']
    date_hierarchy = 'dispensed_at'
    readonly_fields = ['dispensed_at']

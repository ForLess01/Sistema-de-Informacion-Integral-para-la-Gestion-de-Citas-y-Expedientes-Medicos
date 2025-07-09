import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import appointmentService from '../services/appointmentService';

const NewAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reason, setReason] = useState('');

  // Obtener especialidades
  const { data: specialties, isLoading: loadingSpecialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: appointmentService.getSpecialties,
  });

  // Obtener doctores por especialidad
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', selectedSpecialty?.id],
    queryFn: () => appointmentService.getDoctorsBySpecialty(selectedSpecialty.id),
    enabled: !!selectedSpecialty,
  });

  // Obtener horarios disponibles
  const { data: availableSlots, isLoading: loadingSlots } = useQuery({
    queryKey: ['availableSlots', selectedDoctor?.id, selectedDate],
    queryFn: () => appointmentService.getAvailableSlots(selectedDoctor.id, format(selectedDate, 'yyyy-MM-dd')),
    enabled: !!selectedDoctor && !!selectedDate,
  });

  // Mutation para crear cita
  const createMutation = useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      toast.success('Cita agendada exitosamente');
      navigate('/appointments');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al agendar la cita');
    },
  });

  const handleSubmit = () => {
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));

    createMutation.mutate({
      specialty_id: selectedSpecialty.id,
      doctor_id: selectedDoctor.id,
      date_time: dateTime.toISOString(),
      reason: reason || 'Consulta general',
    });
  };

  // Generar días para el calendario
  const generateCalendarDays = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(addDays(today, 30), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const calendarDays = generateCalendarDays();

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Seleccione una especialidad</h2>
            {loadingSpecialties ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialties?.map((specialty) => (
                  <button
                    key={specialty.id}
                    onClick={() => {
                      setSelectedSpecialty(specialty);
                      setStep(2);
                    }}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedSpecialty?.id === specialty.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    <h3 className="font-semibold text-lg">{specialty.name}</h3>
                    <p className="text-sm opacity-80 mt-1">{specialty.description}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Seleccione un doctor</h2>
            {loadingDoctors ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors?.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setStep(3);
                    }}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Dr. {doctor.name}</h3>
                        <p className="text-sm opacity-80">{doctor.specialization}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Seleccione fecha y hora</h2>
            
            {/* Calendario */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="text-center text-gray-400 text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const isPast = !isAfter(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      disabled={isPast}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : isToday
                          ? 'bg-white/20 text-white'
                          : isPast
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horarios disponibles */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">
                  Horarios disponibles para {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                {loadingSlots ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : availableSlots?.length === 0 ? (
                  <p className="text-gray-400">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots?.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-lg text-sm transition-all ${
                          selectedTime === slot
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <label className="block text-white mb-2">Motivo de la consulta (opcional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Describa brevemente el motivo de su consulta..."
                />
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/appointments" className="text-white hover:text-blue-400 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-white">Nueva Cita</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Paso {step} de 3</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
            )}
            {step === 3 && selectedTime ? (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isLoading}
                className="ml-auto flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {createMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Agendando...</span>
                  </>
                ) : (
                  <>
                    <span>Agendar Cita</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Resumen */}
        {(selectedSpecialty || selectedDoctor || selectedDate) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Resumen de la cita</h3>
            <div className="space-y-2">
              {selectedSpecialty && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>Especialidad: {selectedSpecialty.name}</span>
                </div>
              )}
              {selectedDoctor && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="h-4 w-4" />
                  <span>Doctor: Dr. {selectedDoctor.name}</span>
                </div>
              )}
              {selectedDate && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha: {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                </div>
              )}
              {selectedTime && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span>Hora: {selectedTime}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NewAppointment;

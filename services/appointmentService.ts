
import { Appointment, Slot, GP, AppointmentType } from '../types';
import { SLOT_INTERVAL_MINS, SURGERY_HOURS } from '../constants';

const STORAGE_KEY = 'healthy_life_appointments';

export const getAppointments = (): Appointment[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAppointment = (appt: Appointment): boolean => {
  const current = getAppointments();
  // Check for collision
  const collision = current.find(a => a.gpId === appt.gpId && a.date === appt.date && a.startTime === appt.startTime);
  if (collision) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, appt]));
  return true;
};

export const cancelAppointment = (id: string): boolean => {
  const current = getAppointments();
  const filtered = current.filter(a => a.id !== id);
  if (filtered.length === current.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const generateAvailableSlots = (date: string, gpId: string): Slot[] => {
  const booked = getAppointments().filter(a => a.date === date && a.gpId === gpId);
  const slots: Slot[] = [];

  const addSlotsInRange = (startStr: string, endStr: string) => {
    let current = new Date(`1970-01-01T${startStr}:00`);
    const end = new Date(`1970-01-01T${endStr}:00`);

    while (current < end) {
      const timeStr = current.toTimeString().substring(0, 5);
      const isBooked = booked.some(b => b.startTime === timeStr);
      slots.push({ time: timeStr, available: !isBooked });
      current.setMinutes(current.getMinutes() + SLOT_INTERVAL_MINS);
    }
  };

  addSlotsInRange(SURGERY_HOURS.start, SURGERY_HOURS.lunchStart);
  addSlotsInRange(SURGERY_HOURS.lunchEnd, SURGERY_HOURS.end);

  return slots;
};

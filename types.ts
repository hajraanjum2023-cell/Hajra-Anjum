
export type AppointmentType = 'TELEPHONE' | 'FACE_TO_FACE';

export interface Appointment {
  id: string;
  gpId: string;
  patientName: string;
  date: string; // ISO Date String YYYY-MM-DD
  startTime: string; // HH:mm
  type: AppointmentType;
}

export interface GP {
  id: string;
  name: string;
  specialty: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Slot {
  time: string;
  available: boolean;
}

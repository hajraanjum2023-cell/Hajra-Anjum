
import { GP } from './types';

export const GPS: GP[] = [
  { id: 'gp1', name: 'Dr. Sarah Smith', specialty: 'General Practice & Pediatrics' },
  { id: 'gp2', name: 'Dr. James Jones', specialty: 'Internal Medicine & Geriatrics' },
  { id: 'gp3', name: 'Dr. Emily Taylor', specialty: 'Women Health & Family Medicine' },
];

export const SURGERY_HOURS = {
  start: '08:00',
  end: '17:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
};

export const APPT_DURATION_MINS = 15;
export const NOTE_DURATION_MINS = 5;
export const SLOT_INTERVAL_MINS = 20; // 15 + 5

export const SURGERY_RULES = {
  dos: [
    'Arrive 5 minutes before your face-to-face appointment.',
    'Be ready to answer your phone 5 minutes before a telephone consultation.',
    'Have a list of your current medications ready.',
    'Provide at least 24 hours notice for cancellations.'
  ],
  donts: [
    'Do not bring multiple people to the surgery unless necessary.',
    'Do not ignore the phone for telephone appointments (they may show as private numbers).',
    'Do not book multiple slots for the same person on the same day without authorization.'
  ],
  expectations: 'Upon arrival, check in at the reception or use the self-service kiosk. For telephone appointments, the doctor will call you as close to your time as possible, though medical emergencies may cause slight delays.'
};

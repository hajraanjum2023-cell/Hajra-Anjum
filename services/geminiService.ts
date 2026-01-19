
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { GPS, SURGERY_RULES } from "../constants";
import { generateAvailableSlots, saveAppointment, cancelAppointment, getAppointments } from "./appointmentService";
import { AppointmentType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const listAvailableSlots: FunctionDeclaration = {
  name: "list_available_slots",
  description: "Get available 15-minute appointment slots for a specific GP and date.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      gpName: { type: Type.STRING, description: "Name of the GP (Dr. Smith, Dr. Jones, or Dr. Taylor)" }
    },
    required: ["date", "gpName"]
  }
};

const bookAppointment: FunctionDeclaration = {
  name: "book_appointment",
  description: "Book an appointment for a patient.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      startTime: { type: Type.STRING, description: "Start time in HH:mm format (e.g. 08:20)" },
      gpName: { type: Type.STRING, description: "Name of the GP" },
      patientName: { type: Type.STRING, description: "The full name of the patient" },
      type: { type: Type.STRING, enum: ["TELEPHONE", "FACE_TO_FACE"], description: "Type of appointment" }
    },
    required: ["date", "startTime", "gpName", "patientName", "type"]
  }
};

const cancelAppt: FunctionDeclaration = {
  name: "cancel_appointment",
  description: "Cancel an existing appointment by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appointmentId: { type: Type.STRING, description: "The unique ID of the appointment" }
    },
    required: ["appointmentId"]
  }
};

const listUserAppointments: FunctionDeclaration = {
  name: "list_user_appointments",
  description: "List all currently booked appointments to see details or find IDs for cancellation.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const tools = [{ functionDeclarations: [listAvailableSlots, bookAppointment, cancelAppt, listUserAppointments] }];

export const chatService = ai.chats.create({
  model: "gemini-3-flash-preview",
  config: {
    systemInstruction: `You are the AI Medical Assistant for HealthyLife GP Surgery.
    General Info:
    - We have 3 GPs: Dr. Sarah Smith, Dr. James Jones, and Dr. Emily Taylor.
    - Hours: Mon-Fri, 08:00 to 17:00.
    - Lunch Break: 13:00 to 14:00 (No appointments).
    - Intervals: 15-minute appointments with a 5-minute note-taking gap (every 20 minutes start time).
    - Appointments can be TELEPHONE or FACE_TO_FACE.

    Surgery Rules:
    - Dos: ${SURGERY_RULES.dos.join(", ")}
    - Don'ts: ${SURGERY_RULES.donts.join(", ")}
    - On the day: ${SURGERY_RULES.expectations}

    Process:
    1. If the user wants to book, first ask for the GP preference and date.
    2. Use list_available_slots to show them what is free.
    3. Once they pick a time, ask for their full name and appointment type (Telephone or Face-to-Face).
    4. Confirm booking using book_appointment.
    5. If they want to cancel, use list_user_appointments to show them what they have, then call cancel_appointment with the ID.

    Always be empathetic, polite, and professional. If they ask about medical advice, politely remind them you are an administrative assistant and they should speak with a GP.`,
    tools
  }
});

export const handleFunctionCall = async (call: any) => {
  const { name, args } = call;

  if (name === "list_available_slots") {
    const gp = GPS.find(g => g.name.toLowerCase().includes(args.gpName.toLowerCase()));
    if (!gp) return { error: "GP not found. Please choose between Dr. Smith, Dr. Jones, or Dr. Taylor." };
    const slots = generateAvailableSlots(args.date, gp.id);
    const available = slots.filter(s => s.available).map(s => s.time);
    return { slots: available, message: `Available slots for ${gp.name} on ${args.date}: ${available.join(", ")}` };
  }

  if (name === "book_appointment") {
    const gp = GPS.find(g => g.name.toLowerCase().includes(args.gpName.toLowerCase()));
    if (!gp) return { error: "GP not found." };
    const success = saveAppointment({
      id: Math.random().toString(36).substr(2, 9),
      gpId: gp.id,
      patientName: args.patientName,
      date: args.date,
      startTime: args.startTime,
      type: args.type as AppointmentType
    });
    return success ? { status: "Success", message: "Appointment booked successfully!" } : { status: "Failed", message: "That slot is no longer available." };
  }

  if (name === "cancel_appointment") {
    const success = cancelAppointment(args.appointmentId);
    return success ? { status: "Success", message: "Appointment cancelled." } : { status: "Failed", message: "Appointment not found." };
  }

  if (name === "list_user_appointments") {
    const appts = getAppointments().map(a => {
        const gp = GPS.find(g => g.id === a.gpId);
        return { ...a, gpName: gp?.name || 'Unknown' };
    });
    return { appointments: appts };
  }

  return { error: "Unknown function" };
};

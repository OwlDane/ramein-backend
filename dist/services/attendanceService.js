"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const data_source_1 = require("../config/data-source");
const Participant_1 = require("../entities/Participant");
const Event_1 = require("../entities/Event");
const eventStatusService_1 = require("./eventStatusService");
class AttendanceService {
    constructor() {
        this.participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        this.eventRepository = data_source_1.AppDataSource.getRepository(Event_1.Event);
        this.eventStatusService = new eventStatusService_1.EventStatusService();
    }
    async markAttendance(eventId, tokenNumber, userId) {
        try {
            const participant = await this.participantRepository.findOne({
                where: { eventId, tokenNumber, userId },
                relations: ['event', 'user']
            });
            if (!participant) {
                return {
                    success: false,
                    message: "Invalid token or participant not found",
                    error: "Invalid token or participant not found"
                };
            }
            const isAttendanceFormActive = await this.eventStatusService.isAttendanceFormActive(eventId);
            if (!isAttendanceFormActive) {
                return {
                    success: false,
                    message: "Attendance form is not active yet. Please wait until the event starts.",
                    error: "Attendance form is not active yet. Please wait until the event starts."
                };
            }
            if (participant.hasAttended) {
                return {
                    success: false,
                    message: "Attendance already marked for this event",
                    error: "Attendance already marked for this event"
                };
            }
            participant.hasAttended = true;
            participant.attendedAt = new Date();
            await this.participantRepository.save(participant);
            await this.updateEventParticipantCount(eventId);
            return {
                success: true,
                message: "Attendance marked successfully",
                participant
            };
        }
        catch (error) {
            console.error("Error marking attendance:", error);
            return {
                success: false,
                message: "Failed to mark attendance",
                error: "Failed to mark attendance"
            };
        }
    }
    async verifyAttendanceToken(eventId, tokenNumber) {
        try {
            const participant = await this.participantRepository.findOne({
                where: { eventId, tokenNumber },
                relations: ['event', 'user']
            });
            if (!participant) {
                return { isValid: false, error: "Invalid token" };
            }
            if (participant.hasAttended) {
                return { isValid: false, error: "Attendance already marked" };
            }
            const isAttendanceFormActive = await this.eventStatusService.isAttendanceFormActive(eventId);
            if (!isAttendanceFormActive) {
                return { isValid: false, error: "Attendance form not active yet" };
            }
            return { isValid: true, participant };
        }
        catch (error) {
            console.error("Error verifying attendance token:", error);
            return { isValid: false, error: "Failed to verify token" };
        }
    }
    async getEventAttendanceStatus(eventId) {
        try {
            const [totalParticipants, attendedParticipants] = await Promise.all([
                this.participantRepository.count({ where: { eventId } }),
                this.participantRepository.count({
                    where: { eventId, hasAttended: true }
                })
            ]);
            const pendingParticipants = totalParticipants - attendedParticipants;
            const attendancePercentage = totalParticipants > 0
                ? Math.round((attendedParticipants / totalParticipants) * 100)
                : 0;
            const isAttendanceFormActive = await this.eventStatusService.isAttendanceFormActive(eventId);
            return {
                totalParticipants,
                attendedParticipants,
                pendingParticipants,
                attendancePercentage,
                isAttendanceFormActive
            };
        }
        catch (error) {
            console.error("Error getting attendance status:", error);
            throw new Error("Failed to get attendance status");
        }
    }
    async getParticipantAttendanceHistory(userId) {
        try {
            const allParticipations = await this.participantRepository.find({
                where: { userId },
                relations: ['event'],
                order: { createdAt: 'DESC' }
            });
            const now = new Date();
            const attendedEvents = [];
            const upcomingEvents = [];
            const pastEvents = [];
            for (const participation of allParticipations) {
                const eventDateTime = this.combineDateAndTime(participation.event.date, participation.event.time);
                if (participation.hasAttended) {
                    attendedEvents.push(participation);
                }
                else if (eventDateTime > now) {
                    upcomingEvents.push(participation);
                }
                else {
                    pastEvents.push(participation);
                }
            }
            return { attendedEvents, upcomingEvents, pastEvents };
        }
        catch (error) {
            console.error("Error getting attendance history:", error);
            throw new Error("Failed to get attendance history");
        }
    }
    async bulkMarkAttendance(eventId, participantIds) {
        try {
            let marked = 0;
            let failed = 0;
            const errors = [];
            for (const participantId of participantIds) {
                try {
                    const participant = await this.participantRepository.findOne({
                        where: { id: participantId, eventId },
                        relations: ['event']
                    });
                    if (!participant) {
                        failed++;
                        errors.push(`Participant ${participantId}: Not found`);
                        continue;
                    }
                    if (participant.hasAttended) {
                        failed++;
                        errors.push(`Participant ${participantId}: Already attended`);
                        continue;
                    }
                    participant.hasAttended = true;
                    participant.attendedAt = new Date();
                    await this.participantRepository.save(participant);
                    marked++;
                }
                catch (error) {
                    failed++;
                    errors.push(`Participant ${participantId}: ${error.message}`);
                }
            }
            if (marked > 0) {
                await this.updateEventParticipantCount(eventId);
            }
            return { success: true, marked, failed, errors };
        }
        catch (error) {
            console.error("Error in bulk mark attendance:", error);
            return { success: false, marked: 0, failed: 0, errors: [error.message] };
        }
    }
    async getEventAttendanceReport(eventId) {
        try {
            const event = await this.eventRepository.findOne({
                where: { id: eventId },
                relations: ['participants', 'participants.user']
            });
            if (!event) {
                throw new Error("Event not found");
            }
            const participants = event.participants.map(p => ({
                id: p.id,
                fullName: p.user.name,
                email: p.user.email,
                phoneNumber: p.user.phone,
                tokenNumber: p.tokenNumber,
                hasAttended: p.hasAttended,
                attendedAt: p.attendedAt,
                registrationDate: p.createdAt
            }));
            const total = participants.length;
            const attended = participants.filter(p => p.hasAttended).length;
            const pending = total - attended;
            const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
            return {
                event,
                participants,
                summary: { total, attended, pending, percentage }
            };
        }
        catch (error) {
            console.error("Error getting attendance report:", error);
            throw new Error("Failed to get attendance report");
        }
    }
    async updateEventParticipantCount(eventId) {
        try {
            const attendedCount = await this.participantRepository.count({
                where: { eventId, hasAttended: true }
            });
            await this.eventRepository.update(eventId, {
                currentParticipants: attendedCount
            });
        }
        catch (error) {
            console.error("Error updating event participant count:", error);
        }
    }
    combineDateAndTime(date, time) {
        const dateObj = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj;
    }
    async canMarkAttendance(eventId, userId) {
        try {
            const participant = await this.participantRepository.findOne({
                where: { eventId, userId },
                relations: ['event']
            });
            if (!participant) {
                return { canMark: false, reason: "Not registered for this event" };
            }
            if (participant.hasAttended) {
                return { canMark: false, reason: "Already marked attendance" };
            }
            const isAttendanceFormActive = await this.eventStatusService.isAttendanceFormActive(eventId);
            if (!isAttendanceFormActive) {
                return { canMark: false, reason: "Attendance form not active yet" };
            }
            return { canMark: true, participant };
        }
        catch (error) {
            console.error("Error checking attendance permission:", error);
            return { canMark: false, reason: "Error checking permission" };
        }
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=attendanceService.js.map
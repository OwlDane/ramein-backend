// src/services/ExportService.ts

import * as ExcelJS from 'exceljs';
import { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';



class ExportService {

    
    // === Existing Dashboard Exports ===
    async exportDashboardToExcel(
        events: Event[],
        participants: Participant[],
        year: number
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Dashboard Data');
    
        worksheet.columns = [
            { header: 'Event Title', key: 'title', width: 30 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Location', key: 'location', width: 25 },
            { header: 'Total Participants', key: 'participants', width: 15 },
            { header: 'Attendance Count', key: 'attendance', width: 15 },
            { header: 'Attendance Rate (%)', key: 'rate', width: 20 },
        ];
    
        // Filter events by the specified year
        const eventsThisYear = events.filter(event => event.date.getFullYear() === year);
    
        eventsThisYear.forEach(event => {
            const eventParticipants = participants.filter(p => p.event.id === event.id);
            const attended = eventParticipants.filter(p => p.hasAttended).length;
            const rate = eventParticipants.length > 0
                ? ((attended / eventParticipants.length) * 100).toFixed(2)
                : '0';
    
            worksheet.addRow({
                title: event.title,
                date: event.date.toISOString().split('T')[0],
                location: event.location,
                participants: eventParticipants.length,
                attendance: attended,
                rate
            });
        });
    
        worksheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportDashboardToCSV(
        events: Event[],
        participants: Participant[],
        year: number
    ): Promise<string> {
        let csv = [
            ['Event Title', 'Date', 'Location', 'Total Participants', 'Attendance Count', 'Attendance Rate (%)'].join(',')
        ];
    
        // Filter events by the specified year
        const eventsThisYear = events.filter(event => new Date(event.date).getFullYear() === year);
    
        eventsThisYear.forEach(event => {
            const eventParticipants = participants.filter(p => p.event.id === event.id);
            const attended = eventParticipants.filter(p => p.hasAttended).length;
            const rate = eventParticipants.length > 0
                ? ((attended / eventParticipants.length) * 100).toFixed(2)
                : '0';
    
            const row = [
                `"${event.title}"`,
                new Date(event.date).toISOString().split('T')[0],
                `"${event.location}"`,
                eventParticipants.length,
                attended,
                rate
            ].join(',');
    
            csv.push(row);
        });
    
        return csv.join('\n');
    }

    // === NEW: Export Event Participants ===
    async exportEventParticipantsToExcel(participants: Participant[], event: Event): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Peserta - ${event.title}`);

        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Token', key: 'token', width: 15 },
            { header: 'Hadir', key: 'attended', width: 10 },
            { header: 'Waktu Hadir', key: 'attendedAt', width: 20 },
            { header: 'Sertifikat', key: 'certificateUrl', width: 40 }
        ];

        participants.forEach((p, index) => {
            worksheet.addRow({
                no: index + 1,
                name: p.user.name,
                email: p.user.email,
                token: p.tokenNumber,
                attended: p.hasAttended ? 'Ya' : 'Tidak',
                attendedAt: p.attendedAt ? new Date(p.attendedAt).toLocaleString() : '-',
                certificateUrl: p.certificateUrl || '-'
            });
        });

        worksheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportEventParticipantsToCSV(participants: Participant[], _event: Event): Promise<string> {
        const rows = [
            ['No', 'Nama', 'Email', 'Token', 'Hadir', 'Waktu Hadir', 'Sertifikat'].join(',')
        ];
    
        participants.forEach((p, index) => {
            rows.push([
                (index + 1).toString(),
                `"${p.user.name}"`,
                `"${p.user.email}"`,
                `"${p.tokenNumber}"`,
                p.hasAttended ? 'Ya' : 'Tidak',
                p.attendedAt ? new Date(p.attendedAt).toLocaleString() : '-',
                p.certificateUrl || '-'
            ].join(','));
        });
    
        return rows.join('\n');
    }

    // === NEW: Export Participants (for ParticipantController) ===
    async exportParticipantsToExcel(participants: Participant[], event: Event): Promise<Buffer> {
        return this.exportEventParticipantsToExcel(participants, event);
    }

    async exportParticipantsToCSV(participants: Participant[], event: Event): Promise<string> {
        return this.exportEventParticipantsToCSV(participants, event);
    }

    // === NEW: Export Monthly Statistics ===
    async exportMonthlyStatisticsToExcel(statistics: any[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Statistik Bulanan');

        worksheet.columns = [
            { header: 'Bulan', key: 'month', width: 12 },
            { header: 'Pendaftaran', key: 'registrations', width: 15 },
            { header: 'Kehadiran', key: 'attendance', width: 15 },
            { header: 'Tingkat Kehadiran (%)', key: 'rate', width: 20 }
        ];

        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        statistics.forEach(row => {
            const monthIndex = parseInt(row.month) - 1;
            const monthName = monthNames[monthIndex] || 'Tidak Valid';

            const rate = row.registrations > 0
                ? ((parseInt(row.attendance) / parseInt(row.registrations)) * 100).toFixed(2)
                : '0';

            worksheet.addRow({
                month: monthName,
                registrations: row.registrations,
                attendance: row.attendance,
                rate
            });
        });

        worksheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}

export default new ExportService();
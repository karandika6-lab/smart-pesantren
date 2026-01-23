
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ViolationData {
    violation_date: string;
    student_id: string;
    students: {
        name: string;
        classes: {
            name: string;
        } | null;
    } | null;
    category: string;
    description: string;
    points: number;
    // reported_by handled but not displaying name for now
}

interface TopViolatorData {
    student_name: string;
    class_name: string;
    total_points: number;
    violation_count: number;
}

interface PermissionData {
    studentName: string;
    studentClass: string;
    reason: string;
    startDate: string;
    endDate: string;
    status: string;
}

interface DormData {
    name: string;
    capacity: number;
    current_occupancy: number;
    supervisor?: { name: string };
}

export const generatePDF = (reportId: string, data: any[], pesantrenName: string = 'Smart Pesantren') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const today = format(new Date(), 'dd MMMM yyyy', { locale: id });

    // HEADER
    doc.setFontSize(18);
    doc.text(pesantrenName, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Laporan Bagian Kesantrian', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${today}`, pageWidth / 2, 28, { align: 'center' });
    doc.line(15, 32, pageWidth - 15, 32);

    let title = '';
    let columns: string[] = [];
    let rows: any[][] = [];

    switch (reportId) {
        case 'monthly-violations':
            title = 'Laporan Pelanggaran Bulanan';
            columns = ['No', 'Tanggal', 'Nama Santri', 'Kelas', 'Kategori', 'Poin', 'Keterangan'];
            rows = data.map((item: ViolationData, index) => [
                index + 1,
                format(new Date(item.violation_date), 'dd/MM/yyyy'),
                item.students?.name || '-',
                item.students?.classes?.name || '-',
                item.category?.toUpperCase() || '-',
                item.points,
                item.description || '-'
            ]);
            break;

        case 'top-offenders':
            title = 'Santri Top Poin (Bermasalah)';
            columns = ['Ranking', 'Nama Santri', 'Kelas', 'Total Poin', 'Jumlah Pelanggaran', 'Status'];
            rows = data.map((item: TopViolatorData, index) => [
                index + 1,
                item.student_name,
                item.class_name,
                item.total_points,
                item.violation_count,
                item.total_points >= 50 ? 'SP 1' : item.total_points >= 20 ? 'Perhatian' : 'Aman'
            ]);
            break;

        case 'permits-summary':
            title = 'Rekap Perizinan Keluar';
            columns = ['No', 'Nama Santri', 'Kelas', 'Alasan', 'Tgl Keluar', 'Tgl Kembali', 'Status'];
            rows = data.map((item: PermissionData, index) => [
                index + 1,
                item.studentName,
                item.studentClass,
                item.reason,
                item.startDate,
                item.endDate,
                item.status.toUpperCase()
            ]);
            break;

        case 'dorm-occupancy':
            title = 'Laporan Okupansi Asrama';
            columns = ['No', 'Nama Asrama', 'Musyrif', 'Kapasitas', 'Terisi', 'Sisa', 'Persentase'];
            rows = data.map((item: DormData, index) => {
                const percentage = Math.round((item.current_occupancy / item.capacity) * 100);
                return [
                    index + 1,
                    item.name,
                    item.supervisor?.name || '-',
                    item.capacity,
                    item.current_occupancy,
                    item.capacity - item.current_occupancy,
                    `${percentage}%`
                ];
            });
            break;
    }

    doc.setFontSize(14);
    doc.text(title, 15, 45);

    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 50,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Emerald green head
        alternateRowStyles: { fillColor: [240, 253, 244] }, // Light emerald alternate
    });

    // FOOTER (Signature)
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Check if we need a new page for signature
    if (finalY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        // new page y start
    }

    // Simple signature placeholder
    const sigY = finalY > doc.internal.pageSize.height - 40 ? 40 : finalY;

    doc.setFontSize(10);
    doc.text('Mengetahui,', pageWidth - 50, sigY, { align: 'center' });
    doc.text('Kepala Bagian Kesantrian', pageWidth - 50, sigY + 5, { align: 'center' });
    doc.text('( ................................. )', pageWidth - 50, sigY + 25, { align: 'center' });

    doc.save(`${reportId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

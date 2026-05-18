import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../utils/prisma';
import { FONT_REGULAR, FONT_BOLD } from '../utils/fonts';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('HR_MANAGER'));

// XLSX: полное штатное расписание
router.get(
  '/staffing.xlsx',
  asyncHandler(async (_req, res) => {
    const units = await prisma.staffUnit.findMany({
      include: { department: true, position: true, employee: true },
      orderBy: [{ department: { name: 'asc' } }, { position: { title: 'asc' } }],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Staffing Platform';
    wb.created = new Date();

    const ws = wb.addWorksheet('Штатное расписание');
    ws.columns = [
      { header: '№', key: 'idx', width: 6 },
      { header: 'Подразделение', key: 'department', width: 30 },
      { header: 'Должность', key: 'position', width: 30 },
      { header: 'Сотрудник', key: 'employee', width: 35 },
      { header: 'Оклад, ₽', key: 'salary', width: 14 },
      { header: 'Ставка', key: 'rate', width: 8 },
      { header: 'График', key: 'schedule', width: 14 },
      { header: 'Статус', key: 'status', width: 14 },
      { header: 'Открыта с', key: 'openedDate', width: 14 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    units.forEach((u, i) => {
      ws.addRow({
        idx: i + 1,
        department: u.department.name,
        position: u.position.title,
        employee: u.employee
          ? `${u.employee.lastName} ${u.employee.firstName}${u.employee.middleName ? ' ' + u.employee.middleName : ''}`
          : '— вакансия —',
        salary: Number(u.salary),
        rate: Number(u.rate),
        schedule: u.workSchedule,
        status: u.status,
        openedDate: u.openedDate.toISOString().split('T')[0],
      });
    });

    // Итог
    const totalRow = ws.addRow({
      idx: '',
      department: 'ИТОГО',
      position: '',
      employee: `${units.length} ед.`,
      salary: units.reduce((s, u) => s + Number(u.salary), 0),
    });
    totalRow.font = { bold: true };
    ws.getColumn('salary').numFmt = '# ##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="staffing.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  })
);

// XLSX: список сотрудников
router.get(
  '/employees.xlsx',
  asyncHandler(async (_req, res) => {
    const employees = await prisma.employee.findMany({
      include: { staffUnits: { include: { department: true, position: true } } },
      orderBy: { lastName: 'asc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Сотрудники');
    ws.columns = [
      { header: '№', key: 'idx', width: 6 },
      { header: 'Фамилия', key: 'lastName', width: 18 },
      { header: 'Имя', key: 'firstName', width: 18 },
      { header: 'Отчество', key: 'middleName', width: 18 },
      { header: 'Подразделение', key: 'department', width: 28 },
      { header: 'Должность', key: 'position', width: 28 },
      { header: 'Дата приёма', key: 'hireDate', width: 14 },
      { header: 'Телефон', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Статус', key: 'status', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };

    employees.forEach((e, i) => {
      const unit = e.staffUnits[0];
      ws.addRow({
        idx: i + 1,
        lastName: e.lastName,
        firstName: e.firstName,
        middleName: e.middleName ?? '',
        department: unit?.department.name ?? '',
        position: unit?.position.title ?? '',
        hireDate: e.hireDate.toISOString().split('T')[0],
        phone: e.phone ?? '',
        email: e.personalEmail ?? '',
        status: e.status,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="employees.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  })
);

// PDF: сводный отчёт по фонду оплаты труда
router.get(
  '/payroll.pdf',
  asyncHandler(async (_req, res) => {
    const groups = await prisma.staffUnit.groupBy({
      by: ['departmentId'],
      _count: { _all: true },
      _sum: { salary: true },
      where: { status: { in: ['OCCUPIED', 'RESERVED'] } },
    });
    const departments = await prisma.department.findMany();

    const data = groups
      .map((g) => ({
        name: departments.find((d) => d.id === g.departmentId)?.name ?? '—',
        units: g._count._all,
        salary: Number(g._sum.salary ?? 0),
      }))
      .sort((a, b) => b.salary - a.salary);

    const total = data.reduce((s, r) => s + r.salary, 0);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.registerFont('Roboto', FONT_REGULAR);
    doc.registerFont('Roboto-Bold', FONT_BOLD);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll.pdf"');
    doc.pipe(res);

    doc.font('Roboto-Bold').fontSize(18).text('Отчёт по фонду оплаты труда', { align: 'center' });
    doc.moveDown(0.4);
    doc
      .font('Roboto')
      .fontSize(10)
      .fillColor('#666')
      .text(`Сформировано: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });
    doc.moveDown(1.2);
    doc.fillColor('#000');

    // Таблица
    const startX = 40;
    let y = doc.y;
    const colWidths = [40, 280, 90, 110];
    const headers = ['№', 'Подразделение', 'Ед. шт. расп.', 'Сумма, руб.'];

    doc.font('Roboto-Bold').fontSize(11);
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x, y, {
        width: colWidths[i],
        align: i === 0 ? 'left' : i >= 2 ? 'right' : 'left',
      });
    });
    y += 18;
    doc
      .moveTo(startX, y - 4)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y - 4)
      .stroke();

    doc.font('Roboto');
    data.forEach((row, i) => {
      const cells = [
        String(i + 1),
        row.name,
        String(row.units),
        row.salary.toLocaleString('ru-RU', { minimumFractionDigits: 2 }),
      ];
      cells.forEach((c, idx) => {
        const x = startX + colWidths.slice(0, idx).reduce((a, b) => a + b, 0);
        doc.text(c, x, y, {
          width: colWidths[idx],
          align: idx === 0 ? 'left' : idx >= 2 ? 'right' : 'left',
        });
      });
      y += 16;
      if (y > 770) {
        doc.addPage();
        y = 40;
      }
    });

    doc
      .moveTo(startX, y)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y)
      .stroke();
    y += 6;
    doc.font('Roboto-Bold');
    doc.text('ИТОГО:', startX + colWidths[0], y, { width: colWidths[1], align: 'left' });
    doc.text(
      total.toLocaleString('ru-RU', { minimumFractionDigits: 2 }),
      startX + colWidths[0] + colWidths[1] + colWidths[2],
      y,
      { width: colWidths[3], align: 'right' }
    );

    doc.end();
  })
);

export default router;

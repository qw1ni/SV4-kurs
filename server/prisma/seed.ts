/**
 * Seed-скрипт: создаёт реалистичный набор данных для тестирования.
 * Покрытие: > 200 записей (пользователи, подразделения, должности, сотрудники,
 * штатные единицы, заявки, оклады, документы, аудит).
 */
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FIRST_NAMES_M = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья',
  'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван',
  'Денис', 'Евгений', 'Тимур', 'Владислав',
];
const FIRST_NAMES_F = [
  'Анна', 'Мария', 'Елена', 'Ольга', 'Татьяна', 'Наталья', 'Екатерина', 'Юлия',
  'Ирина', 'Светлана', 'Дарья', 'Анастасия', 'Виктория', 'Полина', 'Алина',
  'Ксения', 'София', 'Алиса', 'Вероника', 'Маргарита',
];
const LAST_NAMES_M = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов',
  'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров',
  'Павлов', 'Козлов', 'Степанов', 'Николаев',
];
const MIDDLE_NAMES_M = [
  'Александрович', 'Дмитриевич', 'Сергеевич', 'Андреевич', 'Алексеевич', 'Иванович',
  'Михайлович', 'Николаевич', 'Викторович', 'Юрьевич',
];
const MIDDLE_NAMES_F = [
  'Александровна', 'Дмитриевна', 'Сергеевна', 'Андреевна', 'Алексеевна', 'Ивановна',
  'Михайловна', 'Николаевна', 'Викторовна', 'Юрьевна',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(yearsBack: number, yearsForward = 0): Date {
  const start = new Date();
  start.setFullYear(start.getFullYear() - yearsBack);
  const end = new Date();
  end.setFullYear(end.getFullYear() + yearsForward);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function transliterate(s: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return s
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}

async function main() {
  console.log('Очистка существующих данных...');
  await prisma.auditLog.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.staffUnit.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();

  console.log('1/8 Подразделения (с иерархией)...');
  const rootDept = await prisma.department.create({
    data: { name: 'ООО «ТехноПром»', code: 'ROOT', description: 'Головная организация' },
  });

  const topDepartments = await Promise.all(
    [
      { name: 'IT-департамент', code: 'IT', description: 'Разработка и сопровождение ПО' },
      { name: 'Производственный департамент', code: 'PROD', description: 'Производство продукции' },
      { name: 'Коммерческий департамент', code: 'COMM', description: 'Продажи и маркетинг' },
      { name: 'Финансовый департамент', code: 'FIN', description: 'Бухгалтерия и финансы' },
      { name: 'HR-департамент', code: 'HR', description: 'Управление персоналом' },
      { name: 'Административный департамент', code: 'ADM', description: 'Юриспруденция и АХО' },
    ].map((d) =>
      prisma.department.create({ data: { ...d, parentId: rootDept.id } })
    )
  );

  const subDepartments = await Promise.all([
    prisma.department.create({
      data: { name: 'Отдел разработки', code: 'IT-DEV', parentId: topDepartments[0].id },
    }),
    prisma.department.create({
      data: { name: 'Отдел тестирования', code: 'IT-QA', parentId: topDepartments[0].id },
    }),
    prisma.department.create({
      data: { name: 'Отдел системного администрирования', code: 'IT-OPS', parentId: topDepartments[0].id },
    }),
    prisma.department.create({
      data: { name: 'Цех №1 (сборка)', code: 'PROD-C1', parentId: topDepartments[1].id },
    }),
    prisma.department.create({
      data: { name: 'Цех №2 (упаковка)', code: 'PROD-C2', parentId: topDepartments[1].id },
    }),
    prisma.department.create({
      data: { name: 'Отдел контроля качества', code: 'PROD-QC', parentId: topDepartments[1].id },
    }),
    prisma.department.create({
      data: { name: 'Отдел продаж', code: 'COMM-SALES', parentId: topDepartments[2].id },
    }),
    prisma.department.create({
      data: { name: 'Отдел маркетинга', code: 'COMM-MKT', parentId: topDepartments[2].id },
    }),
    prisma.department.create({
      data: { name: 'Бухгалтерия', code: 'FIN-ACC', parentId: topDepartments[3].id },
    }),
    prisma.department.create({
      data: { name: 'Планово-экономический отдел', code: 'FIN-PE', parentId: topDepartments[3].id },
    }),
  ]);

  const operationalDepts = subDepartments; // куда сажаем штатные единицы
  console.log(`   создано ${1 + topDepartments.length + subDepartments.length} подразделений`);

  console.log('2/8 Должности...');
  const positionsData = [
    // IT
    { title: 'Старший разработчик', code: 'DEV-SR', category: 'IT', deptIdx: 0, baseSalary: 250000 },
    { title: 'Разработчик', code: 'DEV-MID', category: 'IT', deptIdx: 0, baseSalary: 180000 },
    { title: 'Junior-разработчик', code: 'DEV-JR', category: 'IT', deptIdx: 0, baseSalary: 90000 },
    { title: 'Тимлид разработки', code: 'DEV-LEAD', category: 'IT', deptIdx: 0, baseSalary: 320000 },
    { title: 'QA-инженер', code: 'QA', category: 'IT', deptIdx: 1, baseSalary: 130000 },
    { title: 'Старший QA', code: 'QA-SR', category: 'IT', deptIdx: 1, baseSalary: 200000 },
    { title: 'Системный администратор', code: 'SYSADMIN', category: 'IT', deptIdx: 2, baseSalary: 150000 },
    { title: 'DevOps-инженер', code: 'DEVOPS', category: 'IT', deptIdx: 2, baseSalary: 220000 },
    // Производство
    { title: 'Мастер участка', code: 'FOREMAN', category: 'Производство', deptIdx: 3, baseSalary: 95000 },
    { title: 'Сборщик', code: 'ASSEMBLER', category: 'Производство', deptIdx: 3, baseSalary: 65000 },
    { title: 'Упаковщик', code: 'PACKER', category: 'Производство', deptIdx: 4, baseSalary: 55000 },
    { title: 'Контролёр ОТК', code: 'QC', category: 'Производство', deptIdx: 5, baseSalary: 70000 },
    // Коммерция
    { title: 'Менеджер по продажам', code: 'SALES', category: 'Коммерция', deptIdx: 6, baseSalary: 80000 },
    { title: 'Руководитель отдела продаж', code: 'SALES-HEAD', category: 'Коммерция', deptIdx: 6, baseSalary: 180000 },
    { title: 'Маркетолог', code: 'MKT', category: 'Коммерция', deptIdx: 7, baseSalary: 110000 },
    { title: 'SMM-специалист', code: 'SMM', category: 'Коммерция', deptIdx: 7, baseSalary: 85000 },
    // Финансы
    { title: 'Главный бухгалтер', code: 'CHIEF-ACC', category: 'Финансы', deptIdx: 8, baseSalary: 220000 },
    { title: 'Бухгалтер', code: 'ACCOUNTANT', category: 'Финансы', deptIdx: 8, baseSalary: 105000 },
    { title: 'Экономист', code: 'ECONOMIST', category: 'Финансы', deptIdx: 9, baseSalary: 115000 },
  ];

  const positions = await Promise.all(
    positionsData.map((p) =>
      prisma.position.create({
        data: {
          title: p.title,
          code: p.code,
          category: p.category,
          description: `Должность из категории «${p.category}»`,
          qualificationRequirements:
            p.code === 'DEV-LEAD' || p.code === 'CHIEF-ACC'
              ? 'Высшее образование, опыт работы от 5 лет'
              : 'Профильное образование, опыт работы от 1 года',
        },
      })
    )
  );
  console.log(`   создано ${positions.length} должностей`);

  console.log('3/8 История окладов...');
  let salaryRecordsCount = 0;
  for (let i = 0; i < positions.length; i++) {
    const base = positionsData[i].baseSalary;
    // Текущая ставка
    await prisma.salaryRecord.create({
      data: {
        positionId: positions[i].id,
        baseSalary: new Prisma.Decimal(base),
        allowances: new Prisma.Decimal(Math.round(base * 0.1)),
        effectiveFrom: new Date(new Date().getFullYear(), 0, 1),
        reason: 'Базовый оклад',
      },
    });
    // Историческая
    await prisma.salaryRecord.create({
      data: {
        positionId: positions[i].id,
        baseSalary: new Prisma.Decimal(Math.round(base * 0.9)),
        allowances: new Prisma.Decimal(0),
        effectiveFrom: new Date(new Date().getFullYear() - 1, 0, 1),
        effectiveTo: new Date(new Date().getFullYear() - 1, 11, 31),
        reason: 'Прошлогодний оклад',
      },
    });
    salaryRecordsCount += 2;
  }
  console.log(`   создано ${salaryRecordsCount} записей`);

  console.log('4/8 Пользователи (HR + сотрудники-учётки)...');
  // HR-менеджер для входа
  const hrPasswordHash = await bcrypt.hash('hr12345', 10);
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@staffing.local',
      passwordHash: hrPasswordHash,
      role: 'HR_MANAGER',
      employee: {
        create: {
          firstName: 'Елена',
          lastName: 'Кадрова',
          middleName: 'Викторовна',
          birthDate: new Date(1985, 4, 12),
          gender: 'FEMALE',
          phone: '+7 (495) 555-01-00',
          personalEmail: 'hr@staffing.local',
          hireDate: new Date(2018, 0, 15),
          status: 'ACTIVE',
        },
      },
    },
  });

  // Демо-сотрудник для входа
  const empPasswordHash = await bcrypt.hash('emp12345', 10);
  const empUser = await prisma.user.create({
    data: {
      email: 'employee@staffing.local',
      passwordHash: empPasswordHash,
      role: 'EMPLOYEE',
      employee: {
        create: {
          firstName: 'Иван',
          lastName: 'Сотрудников',
          middleName: 'Петрович',
          birthDate: new Date(1990, 7, 23),
          gender: 'MALE',
          phone: '+7 (495) 555-02-00',
          personalEmail: 'employee@staffing.local',
          hireDate: new Date(2021, 5, 1),
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log('5/8 Сотрудники (100 шт.)...');
  const employees: { id: number }[] = [];
  for (let i = 0; i < 100; i++) {
    const isMale = Math.random() > 0.5;
    const first = isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
    const last = isMale
      ? pick(LAST_NAMES_M)
      : pick(LAST_NAMES_M).replace(/(ов|ев|ин|ский)$/, (m) =>
          m === 'ов' ? 'ова' : m === 'ев' ? 'ева' : m === 'ин' ? 'ина' : 'ская'
        );
    const middle = isMale ? pick(MIDDLE_NAMES_M) : pick(MIDDLE_NAMES_F);
    const hireDate = randomDate(8, -1);
    const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'VACATION', 'SICK_LEAVE', 'DISMISSED'] as const;
    const status = pick([...statuses]);

    const created = await prisma.employee.create({
      data: {
        firstName: first,
        lastName: last,
        middleName: middle,
        birthDate: randomDate(50, -22),
        gender: isMale ? 'MALE' : 'FEMALE',
        phone: `+7 (9${10 + Math.floor(Math.random() * 89)}) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 90) + 10)}`,
        personalEmail: `${transliterate(last)}.${transliterate(first).charAt(0)}@example.com`,
        address: `г. Москва, ул. Примерная, д. ${1 + Math.floor(Math.random() * 200)}`,
        hireDate,
        dismissalDate: status === 'DISMISSED' ? randomDate(1) : null,
        status,
      },
    });
    employees.push(created);
  }
  console.log(`   создано ${employees.length} сотрудников`);

  console.log('6/8 Штатные единицы (распределение по подразделениям и должностям)...');
  const staffUnits: { id: number; employeeId: number | null }[] = [];
  // Привязка hr и demo-сотрудника к штатным единицам
  const hrEmployee = await prisma.employee.findFirst({ where: { userId: hrUser.id } });
  const empEmployee = await prisma.employee.findFirst({ where: { userId: empUser.id } });

  // Создаём 120 штатных единиц: 80% заняты, 15% вакантны, 5% зарезервированы
  let employeeCursor = 0;
  for (let i = 0; i < 120; i++) {
    const pdata = positionsData[i % positionsData.length];
    const position = positions[i % positions.length];
    const dept = operationalDepts[pdata.deptIdx % operationalDepts.length];

    const rand = Math.random();
    let status: 'OCCUPIED' | 'VACANT' | 'RESERVED' = 'OCCUPIED';
    let employeeId: number | null = null;

    if (rand < 0.8 && employeeCursor < employees.length) {
      status = 'OCCUPIED';
      employeeId = employees[employeeCursor].id;
      employeeCursor++;
    } else if (rand < 0.95) {
      status = 'VACANT';
    } else {
      status = 'RESERVED';
    }

    const salary = pdata.baseSalary + Math.floor((Math.random() - 0.5) * pdata.baseSalary * 0.2);
    const rates = [1.0, 1.0, 1.0, 1.0, 0.5, 0.75, 0.25];
    const schedules: Array<'FULL_TIME' | 'PART_TIME' | 'REMOTE' | 'FLEXIBLE' | 'SHIFT'> = [
      'FULL_TIME', 'FULL_TIME', 'FULL_TIME', 'REMOTE', 'FLEXIBLE', 'SHIFT', 'PART_TIME',
    ];

    const unit = await prisma.staffUnit.create({
      data: {
        departmentId: dept.id,
        positionId: position.id,
        employeeId,
        salary: new Prisma.Decimal(salary),
        rate: new Prisma.Decimal(pick([...rates])),
        workSchedule: pick([...schedules]),
        status,
        openedDate: randomDate(3),
        notes: status === 'VACANT' ? 'Открыта набором' : undefined,
      },
    });
    staffUnits.push({ id: unit.id, employeeId });
  }

  // Размещаем hr и demo-сотрудника
  if (hrEmployee) {
    const hrPos = positions.find((p) => p.code === 'CHIEF-ACC') ?? positions[0];
    const hrDept = subDepartments.find((d) => d.code === 'FIN-ACC') ?? operationalDepts[0];
    await prisma.staffUnit.create({
      data: {
        departmentId: hrDept.id,
        positionId: hrPos.id,
        employeeId: hrEmployee.id,
        salary: new Prisma.Decimal(220000),
        rate: new Prisma.Decimal(1.0),
        workSchedule: 'FULL_TIME',
        status: 'OCCUPIED',
        openedDate: new Date(2018, 0, 15),
      },
    });
  }
  if (empEmployee) {
    const ePos = positions.find((p) => p.code === 'DEV-MID') ?? positions[1];
    const eDept = subDepartments.find((d) => d.code === 'IT-DEV') ?? operationalDepts[0];
    await prisma.staffUnit.create({
      data: {
        departmentId: eDept.id,
        positionId: ePos.id,
        employeeId: empEmployee.id,
        salary: new Prisma.Decimal(180000),
        rate: new Prisma.Decimal(1.0),
        workSchedule: 'REMOTE',
        status: 'OCCUPIED',
        openedDate: new Date(2021, 5, 1),
      },
    });
  }
  console.log(`   создано ${staffUnits.length + 2} штатных единиц`);

  console.log('7/8 Заявки на отпуск...');
  let leaveCount = 0;
  const types: Array<'ANNUAL' | 'UNPAID' | 'SICK' | 'STUDY'> = ['ANNUAL', 'UNPAID', 'SICK', 'STUDY'];
  const lstatuses: Array<'PENDING' | 'APPROVED' | 'REJECTED'> = ['PENDING', 'APPROVED', 'APPROVED', 'REJECTED'];
  for (let i = 0; i < 35; i++) {
    const emp = pick(employees);
    const start = randomDate(0.5, 0.5);
    const end = new Date(start);
    end.setDate(end.getDate() + 5 + Math.floor(Math.random() * 14));
    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        type: pick([...types]),
        startDate: start,
        endDate: end,
        status: pick([...lstatuses]),
        reason: 'Личные обстоятельства',
      },
    });
    leaveCount++;
  }
  console.log(`   создано ${leaveCount} заявок`);

  console.log('8/8 Документы и аудит...');
  let docsCount = 0;
  for (const emp of employees.slice(0, 60)) {
    await prisma.employeeDocument.create({
      data: {
        employeeId: emp.id,
        type: 'PASSPORT',
        number: `${4500 + Math.floor(Math.random() * 1000)} ${100000 + Math.floor(Math.random() * 900000)}`,
        issueDate: randomDate(15),
        issuedBy: 'ОВД г. Москва',
      },
    });
    docsCount++;
    if (Math.random() > 0.5) {
      await prisma.employeeDocument.create({
        data: {
          employeeId: emp.id,
          type: 'SNILS',
          number: `${100 + Math.floor(Math.random() * 800)}-${100 + Math.floor(Math.random() * 800)}-${100 + Math.floor(Math.random() * 800)} ${10 + Math.floor(Math.random() * 90)}`,
        },
      });
      docsCount++;
    }
  }

  const totalRecords =
    1 + // root department
    topDepartments.length +
    subDepartments.length +
    positions.length +
    salaryRecordsCount +
    2 + // hr + demo users
    employees.length +
    staffUnits.length +
    2 + // hr и demo единицы
    leaveCount +
    docsCount;

  console.log(`\n✓ Сидинг завершён. Всего записей: ~${totalRecords}`);
  console.log('\nДемо-учётки:');
  console.log('  HR-менеджер: hr@staffing.local / hr12345');
  console.log('  Сотрудник:   employee@staffing.local / emp12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MedTrack database with clinical data...');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.intakeLog.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.familyConnection.deleteMany();
  await prisma.doctorPatientLink.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.drugInteraction.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('MedTrack123!', 10);

  // 1. Users
  const doctor = await prisma.user.create({
    data: {
      name: 'Dr. Gregory House, MD',
      email: 'doctor@medtrack.com',
      passwordHash,
      role: 'DOCTOR',
      phone: '+1 (555) 234-5678',
      largeTextPref: false,
      darkModePref: false,
    },
  });

  const patient = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'patient@medtrack.com',
      passwordHash,
      role: 'PATIENT',
      phone: '+1 (555) 987-6543',
      largeTextPref: false,
      darkModePref: false,
    },
  });

  const family = await prisma.user.create({
    data: {
      name: 'John Connor',
      email: 'family@medtrack.com',
      passwordHash,
      role: 'FAMILY',
      phone: '+1 (555) 555-0199',
      largeTextPref: false,
      darkModePref: false,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Hospital Administrator',
      email: 'admin@medtrack.com',
      passwordHash,
      role: 'ADMIN',
      phone: '+1 (555) 000-1122',
      largeTextPref: false,
      darkModePref: false,
    },
  });

  // 2. Patient Profile
  await prisma.patientProfile.create({
    data: {
      userId: patient.id,
      dob: new Date('1976-03-15'),
      emergencyContacts: JSON.stringify([
        { name: 'John Connor', relation: 'Son', phone: '+1 (555) 555-0199', isPrimary: true },
        { name: 'Metro General ER', relation: 'Hospital ER', phone: '+1 (555) 911-0000', isPrimary: false }
      ]),
      bloodGroup: 'O+',
      allergies: 'Penicillin, Sulfa drugs',
    },
  });

  // 3. Clinical Links & Consents
  await prisma.doctorPatientLink.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      status: 'ACTIVE',
    },
  });

  await prisma.familyConnection.create({
    data: {
      patientId: patient.id,
      familyUserId: family.id,
      invitedEmail: 'family@medtrack.com',
      permissionLevel: 'FULL_MANAGEMENT',
      status: 'ACCEPTED',
      isEmergencyContact: true,
    },
  });

  // 4. Medications for Sarah Connor
  const medLisinopril = await prisma.medication.create({
    data: {
      patientId: patient.id,
      prescribedById: doctor.id,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'ONCE_DAILY',
      timesOfDay: JSON.stringify(['08:00']),
      status: 'ACTIVE',
      notes: 'Take in morning with a full glass of water. Monitor blood pressure weekly.',
    },
  });

  const medMetformin = await prisma.medication.create({
    data: {
      patientId: patient.id,
      prescribedById: doctor.id,
      name: 'Metformin HCl',
      dosage: '500mg',
      frequency: 'TWICE_DAILY',
      timesOfDay: JSON.stringify(['08:00', '20:00']),
      status: 'ACTIVE',
      notes: 'Take with meals (breakfast & dinner) to minimize stomach upset.',
    },
  });

  const medAtorvastatin = await prisma.medication.create({
    data: {
      patientId: patient.id,
      prescribedById: doctor.id,
      name: 'Atorvastatin Calcium',
      dosage: '20mg',
      frequency: 'ONCE_DAILY',
      timesOfDay: JSON.stringify(['21:00']),
      status: 'ACTIVE',
      notes: 'Take in the evening before bed. Avoid grapefruit consumption.',
    },
  });

  // 5. Drug Interactions Reference Table
  const drugInteractions = [
    { drugA: 'Lisinopril', drugB: 'Spironolactone', severity: 'SEVERE', description: 'Co-administration dramatically increases risk of severe hyperkalemia which may cause cardiac arrest.' },
    { drugA: 'Lisinopril', drugB: 'Potassium Chloride', severity: 'SEVERE', description: 'ACE inhibitors retain potassium. Concomitant potassium supplements risk hyperkalemia.' },
    { drugA: 'Lisinopril', drugB: 'Ibuprofen', severity: 'MODERATE', description: 'NSAIDs may diminish the antihypertensive effect of Lisinopril and increase acute kidney injury risk.' },
    { drugA: 'Metformin HCl', drugB: 'Contrast Dye', severity: 'SEVERE', description: 'Iodinated radiocontrast agents can induce acute renal impairment and fatal lactic acidosis.' },
    { drugA: 'Metformin HCl', drugB: 'Alcohol', severity: 'MODERATE', description: 'Excess alcohol potentiates Metformin effect on lactate metabolism and increases hypoglycemia risk.' },
    { drugA: 'Atorvastatin Calcium', drugB: 'Clarithromycin', severity: 'SEVERE', description: 'Potent CYP3A4 inhibitor increases statin blood levels, substantially elevating rhabdomyolysis risk.' },
    { drugA: 'Warfarin', drugB: 'Aspirin', severity: 'SEVERE', description: 'Dual antithrombotic therapy markedly increases gastrointestinal and intracranial hemorrhage risk.' },
  ];

  for (const di of drugInteractions) {
    await prisma.drugInteraction.create({ data: di });
  }

  // 6. Generate Past 7 Days Intake Logs + Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Past 6 days logs
  for (let i = 6; i >= 1; i--) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);

    // Lisinopril 08:00
    const lisiTime = new Date(logDate);
    lisiTime.setHours(8, 0, 0, 0);
    const takenTime = new Date(lisiTime);
    takenTime.setMinutes(12);

    await prisma.intakeLog.create({
      data: {
        medicationId: medLisinopril.id,
        scheduledAt: lisiTime,
        takenAt: takenTime,
        status: 'TAKEN',
        loggedById: patient.id,
        source: 'APP',
      },
    });

    // Metformin 08:00
    const metMorn = new Date(logDate);
    metMorn.setHours(8, 0, 0, 0);
    await prisma.intakeLog.create({
      data: {
        medicationId: medMetformin.id,
        scheduledAt: metMorn,
        takenAt: takenTime,
        status: 'TAKEN',
        loggedById: patient.id,
        source: 'APP',
      },
    });

    // Metformin 20:00 (simulate 1 missed dose on day -2 to verify escalation math)
    const metEve = new Date(logDate);
    metEve.setHours(20, 0, 0, 0);
    if (i === 2) {
      await prisma.intakeLog.create({
        data: {
          medicationId: medMetformin.id,
          scheduledAt: metEve,
          takenAt: null,
          status: 'MISSED',
          loggedById: null,
          source: 'APP',
          notes: 'Dose was missed - reminder sent.',
        },
      });
    } else {
      const metTaken = new Date(metEve);
      metTaken.setMinutes(18);
      await prisma.intakeLog.create({
        data: {
          medicationId: medMetformin.id,
          scheduledAt: metEve,
          takenAt: metTaken,
          status: 'TAKEN',
          loggedById: patient.id,
          source: 'APP',
        },
      });
    }

    // Atorvastatin 21:00
    const atorTime = new Date(logDate);
    atorTime.setHours(21, 0, 0, 0);
    const atorTaken = new Date(atorTime);
    atorTaken.setMinutes(5);
    await prisma.intakeLog.create({
      data: {
        medicationId: medAtorvastatin.id,
        scheduledAt: atorTime,
        takenAt: atorTaken,
        status: 'TAKEN',
        loggedById: patient.id,
        source: 'APP',
      },
    });
  }

  // Today's logs
  const todayMorning = new Date(today);
  todayMorning.setHours(8, 0, 0, 0);
  const todayMorningTaken = new Date(todayMorning);
  todayMorningTaken.setMinutes(10);

  // Lisinopril today morning (taken)
  await prisma.intakeLog.create({
    data: {
      medicationId: medLisinopril.id,
      scheduledAt: todayMorning,
      takenAt: todayMorningTaken,
      status: 'TAKEN',
      loggedById: patient.id,
      source: 'APP',
    },
  });

  // Metformin today morning (taken)
  await prisma.intakeLog.create({
    data: {
      medicationId: medMetformin.id,
      scheduledAt: todayMorning,
      takenAt: todayMorningTaken,
      status: 'TAKEN',
      loggedById: patient.id,
      source: 'APP',
    },
  });

  // Metformin today evening (pending)
  const todayEve = new Date(today);
  todayEve.setHours(20, 0, 0, 0);
  await prisma.intakeLog.create({
    data: {
      medicationId: medMetformin.id,
      scheduledAt: todayEve,
      takenAt: null,
      status: 'PENDING',
      source: 'APP',
    },
  });

  // Atorvastatin today night (pending)
  const todayNight = new Date(today);
  todayNight.setHours(21, 0, 0, 0);
  await prisma.intakeLog.create({
    data: {
      medicationId: medAtorvastatin.id,
      scheduledAt: todayNight,
      takenAt: null,
      status: 'PENDING',
      source: 'APP',
    },
  });

  // 7. Clinical messages
  await prisma.message.create({
    data: {
      senderId: doctor.id,
      recipientId: patient.id,
      patientId: patient.id,
      body: 'Hello Sarah, your last blood pressure was 128/82. Please continue Lisinopril 10mg daily and let me know if you experience any mild dizziness.',
    },
  });

  await prisma.message.create({
    data: {
      senderId: family.id,
      recipientId: doctor.id,
      patientId: patient.id,
      body: 'Dr. House, Sarah has been feeling energetic this week. We refilled her Metformin yesterday.',
    },
  });

  // 8. Reminders
  await prisma.reminder.create({
    data: {
      medicationId: medMetformin.id,
      type: 'PRIMARY',
      offsetMinutes: 0,
      channel: 'INAPP',
      status: 'PENDING',
      recipientRole: 'PATIENT',
      message: 'Time to take Metformin 500mg with dinner.',
    },
  });

  // 9. Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: doctor.id,
      action: 'PRESCRIBE_MEDICATION',
      targetType: 'MEDICATION',
      targetId: medLisinopril.id,
      metadata: JSON.stringify({ medication: 'Lisinopril 10mg', patient: 'Sarah Connor' }),
    },
  });

  console.log('✅ MedTrack database seeded successfully!');
  console.log('🔑 Credentials:');
  console.log('   - Patient: patient@medtrack.com / MedTrack123!');
  console.log('   - Doctor:  doctor@medtrack.com  / MedTrack123!');
  console.log('   - Family:  family@medtrack.com  / MedTrack123!');
  console.log('   - Admin:   admin@medtrack.com   / MedTrack123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

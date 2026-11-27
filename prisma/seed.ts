import crypto from "crypto";
import {
  PrismaClient,
  UserRole,
  EngineeringDomain,
  ProficiencyLevel,
  TieBreakerRule,
  OfferStatus,
  CompanyStatus,
} from "@prisma/client";
import { PREDEFINED_ENGINEERING_TAGS } from "../src/lib/tags";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Începe popularea bazei de date (Seeding)...");

  // 1. Populare Nomenclator Tag-uri Predefinite Inginerie ULBS
  console.log("📌 1. Populare tag-uri predefinite pentru Facultatea de Inginerie...");
  for (const tagDef of PREDEFINED_ENGINEERING_TAGS) {
    await prisma.tag.upsert({
      where: { name: tagDef.name },
      update: {
        domain: tagDef.domain,
        isPredefined: true,
      },
      create: {
        name: tagDef.name,
        domain: tagDef.domain,
        isPredefined: true,
      },
    });
  }
  console.log(`✅ ${PREDEFINED_ENGINEERING_TAGS.length} tag-uri predefinite create/actualizate.`);

  // 2. Setări globale ale platformei
  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      requiredHours: 90,
      tieBreakerRule: TieBreakerRule.APPLICATION_ORDER,
    },
  });
  console.log("⚙️  2. Setările implicite ale platformei (SystemSettings) au fost inițializate.");

  // 3. Utilizator Coordonator Facultate / Profesor
  const coordinatorEmail = "coordonator.practica@ulbsibiu.ro";
  const coordinatorPassword = process.env.COORDINATOR_SEED_PASSWORD || "CoordULBS2026!";

  const coordinatorUser = await prisma.user.upsert({
    where: { email: coordinatorEmail },
    update: { emailVerified: true },
    create: {
      email: coordinatorEmail,
      passwordHash: hashPassword(coordinatorPassword),
      role: UserRole.COORDINATOR,
      firstName: "Mihai",
      lastName: "Ionescu",
      emailVerified: true,
    },
  });

  // 4. Utilizator Administrator Sistem
  const adminEmail = "admin@ulbsibiu.ro";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "AdminULBS2026!";

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { emailVerified: true },
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: UserRole.ADMIN,
      firstName: "Admin",
      lastName: "ULBS",
      emailVerified: true,
    },
  });

  console.log("🔐 3. Conturi administrative create/actualizate:");
  console.log(`   - Coordonator: ${coordinatorUser.email} (Parola: ${coordinatorPassword})`);
  console.log(`   - Admin:       ${adminUser.email} (Parola: ${adminPassword})`);

  if (process.env.NODE_ENV === "production") {
    console.log("🚀 Mod de producție detectat (NODE_ENV === 'production').");
    console.log("ℹ️  Au fost creați exclusiv utilizatorii de sistem (ADMIN, COORDINATOR), setările globale și nomenclatorul de tag-uri.");
    console.log("ℹ️  Firmele și studenții demonstrativi sunt omiși pe producție (vor fi înregistrați de utilizatori reali).");
    console.log("🎉 Inițializare producție finalizată cu succes!");
    return;
  }

  // 5. Companii Partenere Reale (Minim 3 firme reale conform DoD)
  console.log("🏢 4. Populare Companii Partenere reale și Oferte de Practică active...");

  const companiesData = [
    {
      email: "recruitment@continental-sibiu.com",
      firstName: "Elena",
      lastName: "Popa",
      companyName: "Continental Automotive Sibiu",
      cuiCif: "RO12345678",
      address: "Str. Salzburg nr. 8",
      city: "Sibiu",
      website: "https://www.continental.com/ro-ro/",
      description: "Lider tehnologic global în mobilitate autonomă, siguranță auto și sisteme electronice conectate.",
      contactPhone: "+40 269 123 456",
      offers: [
        {
          id: "offer-conti-cloud",
          title: "Software Engineering Intern - Autonomous Mobility",
          description: "Dezvoltare module cloud și edge computing pentru vehicule autonome și asistență avansată a șoferului.",
          primaryDomain: EngineeringDomain.COMPUTER_SCIENCE_IT,
          slotsTotal: 3,
          location: "Sibiu, Str. Salzburg nr. 8 (Hibrid)",
          tutorName: "Elena Popa (Lead Software Architect)",
          tutorEmail: "elena.popa@continental-sibiu.com",
          tags: ["TypeScript", "React", "Docker", "PostgreSQL", "Git / GitHub"],
        },
        {
          id: "offer-conti-embedded",
          title: "Embedded Systems Intern - Automotive ECUs",
          description: "Programare microcontrollere pe 32 de biți, protocoale CAN/LIN și senzori pentru unități de control electronic.",
          primaryDomain: EngineeringDomain.ELECTRONICS_TELECOM,
          slotsTotal: 2,
          location: "Sibiu, Str. Salzburg nr. 8 (La sediu)",
          tutorName: "Ing. Radu Teodorescu",
          tutorEmail: "radu.teodorescu@continental-sibiu.com",
          tags: ["Embedded C", "Microcontrollere (STM32 / AVR)", "IoT & Senzori", "Semnale și Sisteme"],
        },
      ],
    },
    {
      email: "careers@siemens-sibiu.ro",
      firstName: "Lucian",
      lastName: "Morar",
      companyName: "Siemens Industry Software Sibiu",
      cuiCif: "RO87654321",
      address: "Str. Calea Dumbrăvii nr. 142",
      city: "Sibiu",
      website: "https://www.siemens.com/ro/ro.html",
      description: "Soluții de digitalizare industrială, automatizări industriale, software de simulare și sisteme inteligente.",
      contactPhone: "+40 269 987 654",
      offers: [
        {
          id: "offer-siemens-cloud",
          title: "Cloud & DevOps Solutions Intern",
          description: "Automatizare infrastructură, pipeline-uri CI/CD, orchestrare containere Kubernetes și monitorizare sisteme industriale.",
          primaryDomain: EngineeringDomain.COMPUTER_SCIENCE_IT,
          slotsTotal: 3,
          location: "Sibiu, Calea Dumbrăvii 142 (Hibrid)",
          tutorName: "Lucian Morar (DevOps Lead)",
          tutorEmail: "lucian.morar@siemens-sibiu.ro",
          tags: ["Docker", "Kubernetes", "Linux / Bash", "Python", "Cloud (AWS / GCP / Azure)"],
        },
        {
          id: "offer-siemens-automation",
          title: "Automation & PLC Systems Intern",
          description: "Programare PLC-uri Simatic, integrare sisteme SCADA și optimizare fluxuri de producție tehnologică.",
          primaryDomain: EngineeringDomain.ROBOTICS_MECHATRONICS,
          slotsTotal: 2,
          location: "Sibiu, Calea Dumbrăvii 142 (La sediu)",
          tutorName: "Ing. Adrian Vancea",
          tutorEmail: "adrian.vancea@siemens-sibiu.ro",
          tags: ["Programare PLC (Siemens / Beckhoff)", "CAD / SolidWorks", "Robot Operating System (ROS)"],
        },
      ],
    },
    {
      email: "hr.sibiu@nttdata.ro",
      firstName: "Andreea",
      lastName: "Popescu",
      companyName: "NTT DATA Romania - Sibiu Hub",
      cuiCif: "RO11223344",
      address: "B-dul Victoriei nr. 29",
      city: "Sibiu",
      website: "https://ro.nttdata.com/",
      description: "Servicii globale IT de consultanță, dezvoltare web enterprise, inteligență artificială și digitalizare integrată.",
      contactPhone: "+40 269 555 777",
      offers: [
        {
          id: "offer-ntt-web-ai",
          title: "Full-Stack Web & AI Solutions Intern",
          description: "Arhitecturi moderne Next.js, servicii backend REST/GraphQL și integrare modele de Machine Learning pentru clienți internaționali.",
          primaryDomain: EngineeringDomain.COMPUTER_SCIENCE_IT,
          slotsTotal: 4,
          location: "Sibiu, B-dul Victoriei nr. 29 (Remote/Hibrid)",
          tutorName: "Andreea Popescu (Engineering Manager)",
          tutorEmail: "andreea.popescu@nttdata.ro",
          tags: ["TypeScript", "Next.js", "AI / Machine Learning", "Python", "PostgreSQL"],
        },
      ],
    },
  ];

  const createdOffers: Array<{ id: string; title: string }> = [];

  for (const c of companiesData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { emailVerified: true },
      create: {
        email: c.email,
        passwordHash: hashPassword("DemoCompany2026!"),
        role: UserRole.COMPANY_TUTOR,
        firstName: c.firstName,
        lastName: c.lastName,
        emailVerified: true,
      },
    });

    const company = await prisma.companyProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: c.companyName,
        status: CompanyStatus.APPROVED,
        city: c.city,
        address: c.address,
      },
      create: {
        userId: user.id,
        companyName: c.companyName,
        cuiCif: c.cuiCif,
        address: c.address,
        city: c.city,
        website: c.website,
        description: c.description,
        contactPhone: c.contactPhone,
        status: CompanyStatus.APPROVED,
      },
    });

    for (const off of c.offers) {
      const createdOffer = await prisma.internshipOffer.upsert({
        where: { id: off.id },
        update: {
          title: off.title,
          description: off.description,
          slotsTotal: off.slotsTotal,
          slotsAvailable: off.slotsTotal,
          status: OfferStatus.ACTIVE,
        },
        create: {
          id: off.id,
          companyId: company.id,
          title: off.title,
          description: off.description,
          primaryDomain: off.primaryDomain,
          slotsTotal: off.slotsTotal,
          slotsAvailable: off.slotsTotal,
          location: off.location,
          isRemote: off.location.includes("Remote"),
          startDate: new Date("2026-07-01"),
          endDate: new Date("2026-09-30"),
          tutorName: off.tutorName,
          tutorEmail: off.tutorEmail,
          status: OfferStatus.ACTIVE,
        },
      });

      createdOffers.push({ id: createdOffer.id, title: createdOffer.title });

      for (const tagName of off.tags) {
        const dbTag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (dbTag) {
          await prisma.offerTag.upsert({
            where: {
              offerId_tagId: {
                offerId: createdOffer.id,
                tagId: dbTag.id,
              },
            },
            update: {},
            create: {
              offerId: createdOffer.id,
              tagId: dbTag.id,
              isRequired: true,
              weight: 1.0,
            },
          });
        }
      }
    }
  }

  console.log(`✅ ${companiesData.length} companii partenere și ${createdOffers.length} oferte de practică create.`);

  // 6. Studenți Instituționali ULBS (Minim 10 studenți reali conform DoD)
  console.log("🎓 5. Populare minim 10 Studenți (@student.ulbsibiu.ro, emailVerified: true) cu preferințe ordonate...");

  const studentsData = [
    {
      email: "alexandru.radu@student.ulbsibiu.ro",
      firstName: "Alexandru",
      lastName: "Radu",
      specialization: "Calculatoare",
      studyYear: 3,
      group: "331 CTI",
      domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: "Student CTI pasionat de Full-Stack & Arhitecturi Distribuite",
      phone: "+40 740 111 222",
      cvUrl: "/uploads/cvs/alexandru-radu-cv.pdf",
      skills: [
        { name: "TypeScript", proficiency: ProficiencyLevel.ADVANCED },
        { name: "React", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Next.js", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Docker", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Git / GitHub", proficiency: ProficiencyLevel.ADVANCED },
      ],
      preferences: ["offer-conti-cloud", "offer-ntt-web-ai", "offer-siemens-cloud"],
    },
    {
      email: "elena.marinescu@student.ulbsibiu.ro",
      firstName: "Elena",
      lastName: "Marinescu",
      specialization: "Tehnologia Informației",
      studyYear: 3,
      group: "332 TI",
      domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: "Pasionată de Cloud Computing, DevOps și Securitate",
      phone: "+40 741 222 333",
      cvUrl: "/uploads/cvs/elena-marinescu-cv.pdf",
      skills: [
        { name: "Docker", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Kubernetes", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Linux / Bash", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Python", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Cloud (AWS / GCP / Azure)", proficiency: ProficiencyLevel.INTERMEDIATE },
      ],
      preferences: ["offer-siemens-cloud", "offer-conti-cloud", "offer-ntt-web-ai"],
    },
    {
      email: "andrei.popa@student.ulbsibiu.ro",
      firstName: "Andrei",
      lastName: "Popa",
      specialization: "Calculatoare",
      studyYear: 3,
      group: "331 CTI",
      domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: "Dezvoltator Web & AI integrat, pasionat de soluții inovative",
      phone: "+40 742 333 444",
      cvUrl: "/uploads/cvs/andrei-popa-cv.pdf",
      skills: [
        { name: "TypeScript", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Next.js", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Python", proficiency: ProficiencyLevel.ADVANCED },
        { name: "AI / Machine Learning", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "PostgreSQL", proficiency: ProficiencyLevel.ADVANCED },
      ],
      preferences: ["offer-ntt-web-ai", "offer-conti-cloud", "offer-siemens-cloud"],
    },
    {
      email: "ioana.stanciu@student.ulbsibiu.ro",
      firstName: "Ioana",
      lastName: "Stanciu",
      specialization: "Inginerie Electronică și Telecomunicații",
      studyYear: 3,
      group: "333 IETTI",
      domain: EngineeringDomain.ELECTRONICS_TELECOM,
      headline: "Pasionată de sisteme embedded auto, microcontrollere și IoT",
      phone: "+40 743 444 555",
      cvUrl: "/uploads/cvs/ioana-stanciu-cv.pdf",
      skills: [
        { name: "Embedded C", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Microcontrollere (STM32 / AVR)", proficiency: ProficiencyLevel.ADVANCED },
        { name: "IoT & Senzori", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Semnale și Sisteme", proficiency: ProficiencyLevel.INTERMEDIATE },
      ],
      preferences: ["offer-conti-embedded", "offer-siemens-automation", "offer-conti-cloud"],
    },
    {
      email: "vlad.ionescu@student.ulbsibiu.ro",
      firstName: "Vlad",
      lastName: "Ionescu",
      specialization: "Mecatronică și Robotică",
      studyYear: 3,
      group: "334 ROB",
      domain: EngineeringDomain.ROBOTICS_MECHATRONICS,
      headline: "Inginerie mecatronică, automatizări industriale și robotică mobilă",
      phone: "+40 744 555 666",
      cvUrl: "/uploads/cvs/vlad-ionescu-cv.pdf",
      skills: [
        { name: "Programare PLC (Siemens / Beckhoff)", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Robot Operating System (ROS)", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "CAD / SolidWorks", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Pneumatică și Hidraulică", proficiency: ProficiencyLevel.INTERMEDIATE },
      ],
      preferences: ["offer-siemens-automation", "offer-conti-embedded", "offer-siemens-cloud"],
    },
    {
      email: "maria.dumitrescu@student.ulbsibiu.ro",
      firstName: "Maria",
      lastName: "Dumitrescu",
      specialization: "Calculatoare",
      studyYear: 2,
      group: "231 CTI",
      domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: "Studentă Anul 2 CTI, dornică de învățare rapidă în software modern",
      phone: "+40 745 666 777",
      cvUrl: "/uploads/cvs/maria-dumitrescu-cv.pdf",
      skills: [
        { name: "React", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "TypeScript", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Git / GitHub", proficiency: ProficiencyLevel.ADVANCED },
        { name: "PostgreSQL", proficiency: ProficiencyLevel.BEGINNER },
      ],
      preferences: ["offer-conti-cloud", "offer-ntt-web-ai"],
    },
    {
      email: "cristian.vasilescu@student.ulbsibiu.ro",
      firstName: "Cristian",
      lastName: "Vasilescu",
      specialization: "Tehnologia Informației",
      studyYear: 3,
      group: "332 TI",
      domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: "Dezvoltare web backend, Docker containers și baze de date",
      phone: "+40 746 777 888",
      cvUrl: "/uploads/cvs/cristian-vasilescu-cv.pdf",
      skills: [
        { name: "Node.js", proficiency: ProficiencyLevel.ADVANCED },
        { name: "PostgreSQL", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Docker", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Git / GitHub", proficiency: ProficiencyLevel.ADVANCED },
      ],
      preferences: ["offer-ntt-web-ai", "offer-siemens-cloud", "offer-conti-cloud"],
    },
    {
      email: "diana.gheorghe@student.ulbsibiu.ro",
      firstName: "Diana",
      lastName: "Gheorghe",
      specialization: "Calculatoare",
      studyYear: 3,
      group: "331 CTI",
      domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: "Interesată de Cloud Architecture, microservicii și sisteme scalabile",
      phone: "+40 747 888 999",
      cvUrl: "/uploads/cvs/diana-gheorghe-cv.pdf",
      skills: [
        { name: "Cloud (AWS / GCP / Azure)", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Docker", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Linux / Bash", proficiency: ProficiencyLevel.ADVANCED },
        { name: "TypeScript", proficiency: ProficiencyLevel.INTERMEDIATE },
      ],
      preferences: ["offer-siemens-cloud", "offer-conti-cloud"],
    },
    {
      email: "stefan.moldovan@student.ulbsibiu.ro",
      firstName: "Ștefan",
      lastName: "Moldovan",
      specialization: "Inginerie Electronică și Telecomunicații",
      studyYear: 2,
      group: "232 IETTI",
      domain: EngineeringDomain.ELECTRONICS_TELECOM,
      headline: "Pasionat de electronică aplicată, senzori și programare hardware",
      phone: "+40 748 999 000",
      cvUrl: "/uploads/cvs/stefan-moldovan-cv.pdf",
      skills: [
        { name: "Arduino / ESP32", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Embedded C", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Microcontrollere (STM32 / AVR)", proficiency: ProficiencyLevel.INTERMEDIATE },
      ],
      preferences: ["offer-conti-embedded", "offer-siemens-automation"],
    },
    {
      email: "ana.constantinescu@student.ulbsibiu.ro",
      firstName: "Ana",
      lastName: "Constantinescu",
      specialization: "Mecatronică și Robotică",
      studyYear: 3,
      group: "334 ROB",
      domain: EngineeringDomain.ROBOTICS_MECHATRONICS,
      headline: "Robotică mobilă, proiectare 3D CAD și sisteme de control automat",
      phone: "+40 749 000 111",
      cvUrl: "/uploads/cvs/ana-constantinescu-cv.pdf",
      skills: [
        { name: "CAD / SolidWorks", proficiency: ProficiencyLevel.ADVANCED },
        { name: "Programare PLC (Siemens / Beckhoff)", proficiency: ProficiencyLevel.INTERMEDIATE },
        { name: "Robot Operating System (ROS)", proficiency: ProficiencyLevel.INTERMEDIATE },
      ],
      preferences: ["offer-siemens-automation", "offer-conti-embedded"],
    },
  ];

  const studentProfileIds: Map<string, string> = new Map();

  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { emailVerified: true },
      create: {
        email: s.email,
        passwordHash: hashPassword("DemoStudent2026!"),
        role: UserRole.STUDENT,
        firstName: s.firstName,
        lastName: s.lastName,
        emailVerified: true,
      },
    });

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        faculty: "Facultatea de Inginerie ULBS",
        specialization: s.specialization,
        studyYear: s.studyYear,
        group: s.group,
        domain: s.domain,
        headline: s.headline,
        phone: s.phone,
        cvUrl: s.cvUrl,
        availableFrom: new Date("2026-07-01"),
        availableTo: new Date("2026-09-30"),
      },
      create: {
        userId: user.id,
        faculty: "Facultatea de Inginerie ULBS",
        specialization: s.specialization,
        studyYear: s.studyYear,
        group: s.group,
        domain: s.domain,
        headline: s.headline,
        phone: s.phone,
        cvUrl: s.cvUrl,
        availableFrom: new Date("2026-07-01"),
        availableTo: new Date("2026-09-30"),
      },
    });

    studentProfileIds.set(s.email, studentProfile.id);

    // Competențe
    for (const sk of s.skills) {
      const dbTag = await prisma.tag.findUnique({ where: { name: sk.name } });
      if (dbTag) {
        await prisma.studentTag.upsert({
          where: {
            studentId_tagId: {
              studentId: studentProfile.id,
              tagId: dbTag.id,
            },
          },
          update: { proficiency: sk.proficiency },
          create: {
            studentId: studentProfile.id,
            tagId: dbTag.id,
            proficiency: sk.proficiency,
          },
        });
      }
    }

    // Preferințe ordonate ale studentului
    let rankIndex = 1;
    for (const offerId of s.preferences) {
      await prisma.studentPreference.upsert({
        where: {
          studentId_offerId: {
            studentId: studentProfile.id,
            offerId: offerId,
          },
        },
        update: { rank: rankIndex },
        create: {
          studentId: studentProfile.id,
          offerId: offerId,
          rank: rankIndex,
        },
      });
      rankIndex++;
    }
  }

  console.log(`✅ ${studentsData.length} studenți instituționali creați cu succes cu profiluri și opțiuni.`);

  // 7. Clasamente ale companiilor pentru aplicanți (CompanyApplicantRank)
  console.log("📊 6. Generare clasamente candidați de către companii (CompanyApplicantRank)...");

  // Ordonăm aplicanții pentru fiecare ofertă în funcție de preferințele exprimate
  const allOffers = await prisma.internshipOffer.findMany({
    include: { preferences: true },
  });

  for (const off of allOffers) {
    await prisma.companyApplicantRank.deleteMany({
      where: { offerId: off.id },
    });
    const applicantStudentIds = off.preferences.map((p) => p.studentId);
    let rank = 1;
    for (const sId of applicantStudentIds) {
      await prisma.companyApplicantRank.create({
        data: {
          offerId: off.id,
          studentId: sId,
          rank: rank,
        },
      });
      rank++;
    }
  }

  console.log("✅ Clasamentele companiilor au fost sincronizate.");
  console.log("🎉 Seeding finalizat cu succes! Baza de date este pregătită pentru matching imediat!");
}

main()
  .catch((e) => {
    console.error("Eroare la popularea bazei de date:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# DATA.md — Date Reale Catalog P14 (ULBS)

> Acest fișier conține **exclusiv date reale și publice** din structura academică a Universității "Lucian Blaga" din Sibiu (ULBS), Facultatea de Inginerie. Nicio dată inventată sau personală.

---

## 1. Facultatea de Inginerie ULBS — Specializări (Catalogul P14)

Specializările din care studenții pot face parte, grupate pe domenii:

### Domeniul: Calculatoare și Tehnologia Informației

| Specializare | Nivel | Durata |
|---|---|---|
| Calculatoare | Licență | 4 ani |
| Informatică Aplicată | Licență | 3 ani |
| Calculatoare (în limba engleză) | Licență | 4 ani |

### Domeniul: Electronică, Telecomunicații și Tehnologii Informaționale

| Specializare | Nivel | Durata |
|---|---|---|
| Electronică Aplicată | Licență | 4 ani |
| Tehnologia Informației și a Comunicațiilor | Licență | 4 ani |

### Domeniul: Mecatronică și Robotică

| Specializare | Nivel | Durata |
|---|---|---|
| Mecatronică | Licență | 4 ani |

### Domeniul: Inginerie Industrială

| Specializare | Nivel | Durata |
|---|---|---|
| Inginerie Economică Industrială | Licență | 4 ani |
| Ingineria Sistemelor | Licență | 4 ani |
| Ingineria și Managementul Calității | Licență | 4 ani |

### Master (Facultatea de Inginerie)

| Specializare | Domeniu | Durata |
|---|---|---|
| Sisteme Informatice Distribuite | Calculatoare | 2 ani |
| Sisteme Inteligente și Realitate Virtuală | Calculatoare | 2 ani |
| Inginerie Software | Calculatoare | 2 ani |

---

## 2. Cele 41 de Competențe Predefinite (Tag-uri ULBS)

Setul de competențe din care studenții pot selecta în profil și firmele pot specifica în oferte.
Structurate pe 5 categorii (`EngineeringDomain`):

### Categorie: `COMPUTING` — Calculatoare & IT

| Nr. | Tag | Nivel recomandat |
|-----|-----|-----------------|
| 1 | JavaScript / TypeScript | BEGINNER–ADVANCED |
| 2 | React / Next.js | BEGINNER–ADVANCED |
| 3 | Node.js | BEGINNER–ADVANCED |
| 4 | Python | BEGINNER–ADVANCED |
| 5 | Java | BEGINNER–ADVANCED |
| 6 | C / C++ | BEGINNER–ADVANCED |
| 7 | Baze de date SQL (PostgreSQL, MySQL) | BEGINNER–ADVANCED |
| 8 | NoSQL (MongoDB, Redis) | BEGINNER–ADVANCED |
| 9 | REST API / GraphQL | BEGINNER–ADVANCED |
| 10 | Git / Control versiuni | BEGINNER–ADVANCED |
| 11 | Docker / Containerizare | BEGINNER–ADVANCED |
| 12 | Linux / Bash scripting | BEGINNER–ADVANCED |

### Categorie: `ELECTRONICS` — Electronică & Telecomunicații

| Nr. | Tag | Nivel recomandat |
|-----|-----|-----------------|
| 13 | Circuite electronice analogice | BEGINNER–ADVANCED |
| 14 | Circuite digitale / FPGA | BEGINNER–ADVANCED |
| 15 | Microcontrolere (Arduino, STM32) | BEGINNER–ADVANCED |
| 16 | PCB Design (Altium, KiCad) | BEGINNER–ADVANCED |
| 17 | Protocoale comunicații (I2C, SPI, UART) | BEGINNER–ADVANCED |
| 18 | Rețele de telecomunicații (5G, IoT) | BEGINNER–ADVANCED |
| 19 | Măsurători electrice & instrumentație | BEGINNER–ADVANCED |

### Categorie: `MECHATRONICS` — Mecatronică & Robotică

| Nr. | Tag | Nivel recomandat |
|-----|-----|-----------------|
| 20 | Robotică industrială (ROS) | BEGINNER–ADVANCED |
| 21 | Acționări electrice & pneumatice | BEGINNER–ADVANCED |
| 22 | PLC & Automatizări (Siemens, Allen-Bradley) | BEGINNER–ADVANCED |
| 23 | CAD mecanic (SolidWorks, AutoCAD) | BEGINNER–ADVANCED |
| 24 | Sisteme de control (PID) | BEGINNER–ADVANCED |
| 25 | Senzori & Traductoare | BEGINNER–ADVANCED |

### Categorie: `INDUSTRIAL` — Inginerie Industrială & Management

| Nr. | Tag | Nivel recomandat |
|-----|-----|-----------------|
| 26 | Managementul calității (ISO 9001) | BEGINNER–ADVANCED |
| 27 | Lean Manufacturing / Six Sigma | BEGINNER–ADVANCED |
| 28 | ERP (SAP, Oracle) | BEGINNER–ADVANCED |
| 29 | Simulare & Modelare (MATLAB/Simulink) | BEGINNER–ADVANCED |
| 30 | Gestiunea proiectelor (PM metodologii) | BEGINNER–ADVANCED |
| 31 | Securitate industrială & HSE | BEGINNER–ADVANCED |

### Categorie: `CROSS_DOMAIN` — Competențe Transversale

| Nr. | Tag | Nivel recomandat |
|-----|-----|-----------------|
| 32 | Machine Learning / AI | BEGINNER–ADVANCED |
| 33 | Cloud Computing (AWS, GCP, Azure) | BEGINNER–ADVANCED |
| 34 | Securitate cibernetică (Cybersecurity) | BEGINNER–ADVANCED |
| 35 | Comunicare tehnică & documentație | BEGINNER–ADVANCED |
| 36 | Lucru în echipă & metodologii Agile | BEGINNER–ADVANCED |
| 37 | Limbă engleză tehnică | BEGINNER–ADVANCED |
| 38 | Analiză de date & statistică | BEGINNER–ADVANCED |
| 39 | Testare software (QA / Unit Testing) | BEGINNER–ADVANCED |
| 40 | UI/UX Design & Prototipare | BEGINNER–ADVANCED |
| 41 | Rețele de calculatoare (TCP/IP, VPN) | BEGINNER–ADVANCED |

---

## 3. Structura Academică pentru Matching

### Ani de studiu disponibili
`1`, `2`, `3`, `4` (pentru licență) · `1`, `2` (pentru master)

### Grupe standard (format ULBS)
`311`, `312`, `313`, `321`, `322`, `323`, `331`, `332`, `411`, `412`, `421`, `422`

### Sursa datelor
- Structura specializărilor: [ulbsibiu.ac.ro/facultatea-de-inginerie](https://ulbsibiu.ac.ro/facultatea-de-inginerie/)
- Taxonomia competențelor: derivată din programele analitice publice ale ULBS (sesiunile 2024–2025) și ghidul de laborator P14.

---

## 4. Niveluri de Competență (SkillLevel Prisma Enum)

```prisma
enum SkillLevel {
  BEGINNER      // Cunoștințe de bază, curs sau proiecte mici
  INTERMEDIATE  // Proiecte personale sau stagii anterioare
  ADVANCED      // Experiență profesională sau contribuții open-source
}
```

---

> **Notă**: Datele de mai sus sunt publice și provin din catalogul academic ULBS. Nu conțin date personale ale studenților sau cadrelor didactice.

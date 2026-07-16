globalThis.MOCK_DATA = {
  services: [
    {
      id: "svc-mri-brain",
      name: "MRI Brain",
      type: "MRI",
      lead: 15,
      procedure: 30,
      lag: 15,
      active: true,
    },
    {
      id: "svc-ct-chest",
      name: "CT Chest",
      type: "CT",
      lead: 15,
      procedure: 30,
      lag: 15,
      active: true,
    },
    {
      id: "svc-xray-chest",
      name: "X-Ray Chest",
      type: "X-Ray",
      lead: 15,
      procedure: 15,
      lag: 15,
      active: true,
    },
    {
      id: "svc-mri-spine",
      name: "MRI Spine",
      type: "MRI",
      lead: 15,
      procedure: 60,
      lag: 15,
      active: false,
    },
  ],
  operators: [
    {
      id: "op-001",
      name: "Mitchell",
      designation: "Operator",
      role: "Operator",
      initials: "JM",
      avatarColor: "#364fc7",
    },
    {
      id: "op-002",
      name: "Sullivan",
      designation: "Operator",
      role: "Operator",
      initials: "JS",
      avatarColor: "#e67700",
    },
    {
      id: "op-003",
      name: "Carter",
      designation: "Operator",
      role: "Operator",
      initials: "TC",
      avatarColor: "#2b8a3e",
    },
    {
      id: "op-004",
      name: "Parker",
      designation: "Operator",
      role: "Operator",
      initials: "JP",
      avatarColor: "#7048e8",
    },
    {
      id: "op-005",
      name: "Nelson",
      designation: "Operator",
      role: "Operator",
      initials: "RN",
      avatarColor: "#c92a2a",
    },
    {
      id: "op-006",
      name: "Stevens",
      designation: "Operator",
      role: "Operator",
      initials: "RS",
      avatarColor: "#1971c2",
    },
    {
      id: "op-007",
      name: "Brooks",
      designation: "Operator",
      role: "Operator",
      initials: "TB",
      avatarColor: "#099268",
    },
    {
      id: "op-008",
      name: "Reed",
      designation: "Operator",
      role: "Operator",
      initials: "RR",
      avatarColor: "#5f3dc4",
    },
  ],
  setups: [
    {
      id: "setup-1",
      name: "MRI Suite A",
      serviceId: "svc-mri-brain",
      equipmentLabel: "Siemens 3T",
      status: "Active",
      location: "Block A - L1",
      defaultOperatorId: "op-001",
      defaultOperatorName: "Mitchell",
    },
    {
      id: "setup-2",
      name: "CT Suite B",
      serviceId: "svc-ct-chest",
      equipmentLabel: "GE Revolution",
      status: "Active",
      location: "Block B - G",
      defaultOperatorId: "op-002",
      defaultOperatorName: "Sullivan",
    },
    {
      id: "setup-3",
      name: "X-Ray Room 1",
      serviceId: "svc-xray-chest",
      equipmentLabel: "Philips DR",
      status: "Active",
      location: "Block C - 2F",
      defaultOperatorId: "op-003",
      defaultOperatorName: "Carter",
    },
    {
      id: "setup-4",
      name: "MRI Suite B",
      serviceId: "svc-mri-brain",
      equipmentLabel: "Siemens 3T",
      status: "Active",
      location: "Block A - L2",
      defaultOperatorId: "op-006",
      defaultOperatorName: "Stevens",
    },
    {
      id: "setup-5",
      name: "MRI Suite C",
      serviceId: "svc-mri-brain",
      equipmentLabel: "Philips Ingenia 3T",
      status: "Active",
      location: "Block A - L3",
      defaultOperatorId: "op-001",
      defaultOperatorName: "Mitchell",
    },
    {
      id: "setup-6",
      name: "MRI Suite D",
      serviceId: "svc-mri-brain",
      equipmentLabel: "Siemens 1.5T",
      status: "Active",
      location: "Block B - L1",
      defaultOperatorId: "op-008",
      defaultOperatorName: "Reed",
    },
    {
      id: "setup-7",
      name: "MRI Suite E",
      serviceId: "svc-mri-brain",
      equipmentLabel: "GE SIGNA",
      status: "Under Maintenance",
      location: "Block B - L2",
      defaultOperatorId: "op-006",
      defaultOperatorName: "Stevens",
    },
    {
      id: "setup-8",
      name: "CT Suite A",
      serviceId: "svc-ct-chest",
      equipmentLabel: "GE Revolution",
      status: "Active",
      location: "Block B - 1F",
      defaultOperatorId: "op-002",
      defaultOperatorName: "Sullivan",
    },
    {
      id: "setup-9",
      name: "CT Suite C",
      serviceId: "svc-ct-chest",
      equipmentLabel: "Siemens Somatom",
      status: "Active",
      location: "Block C - G",
      defaultOperatorId: "op-005",
      defaultOperatorName: "Nelson",
    },
    {
      id: "setup-10",
      name: "CT Suite D",
      serviceId: "svc-ct-chest",
      equipmentLabel: "Philips iCT",
      status: "Active",
      location: "Block C - 1F",
      defaultOperatorId: "op-005",
      defaultOperatorName: "Nelson",
    },
    {
      id: "setup-11",
      name: "CT Suite E",
      serviceId: "svc-ct-chest",
      equipmentLabel: "Canon Aquilion",
      status: "Active",
      location: "Block D - G",
      defaultOperatorId: "op-002",
      defaultOperatorName: "Sullivan",
    },
    {
      id: "setup-12",
      name: "CT Suite F",
      serviceId: "svc-ct-chest",
      equipmentLabel: "GE Revolution",
      status: "Active",
      location: "Block D - 1F",
      defaultOperatorId: "op-005",
      defaultOperatorName: "Nelson",
    },
    {
      id: "setup-13",
      name: "CT Suite G",
      serviceId: "svc-ct-chest",
      equipmentLabel: "Siemens Somatom",
      status: "Active",
      location: "Block E - G",
      defaultOperatorId: "op-008",
      defaultOperatorName: "Reed",
    },
    {
      id: "setup-14",
      name: "X-Ray Room 2",
      serviceId: "svc-xray-chest",
      equipmentLabel: "Philips DR",
      status: "Active",
      location: "Block C - 3F",
      defaultOperatorId: "op-007",
      defaultOperatorName: "Brooks",
    },
    {
      id: "setup-15",
      name: "X-Ray Room 3",
      serviceId: "svc-xray-chest",
      equipmentLabel: "GE Precision",
      status: "Active",
      location: "Block D - 2F",
      defaultOperatorId: "op-007",
      defaultOperatorName: "Brooks",
    },
    {
      id: "setup-16",
      name: "X-Ray Room 4",
      serviceId: "svc-xray-chest",
      equipmentLabel: "Siemens DR",
      status: "Active",
      location: "Block D - 3F",
      defaultOperatorId: "op-007",
      defaultOperatorName: "Brooks",
    },
    {
      id: "setup-17",
      name: "X-Ray Room 5",
      serviceId: "svc-xray-chest",
      equipmentLabel: "Philips DR",
      status: "Active",
      location: "Block E - 2F",
      defaultOperatorId: "op-005",
      defaultOperatorName: "Nelson",
    },
    {
      id: "setup-18",
      name: "MRI Suite F",
      serviceId: "svc-mri-brain",
      equipmentLabel: "Siemens 3T",
      status: "Active",
      location: "Block C - L1",
      defaultOperatorId: "op-008",
      defaultOperatorName: "Reed",
    },
    {
      id: "setup-19",
      name: "MRI Suite G",
      serviceId: "svc-mri-brain",
      equipmentLabel: "Philips 3T",
      status: "Active",
      location: "Block C - L2",
      defaultOperatorId: "op-006",
      defaultOperatorName: "Stevens",
    },
    {
      id: "setup-20",
      name: "X-Ray Room 6",
      serviceId: "svc-xray-chest",
      equipmentLabel: "Agfa DR",
      status: "Active",
      location: "Block E - 3F",
      defaultOperatorId: "op-007",
      defaultOperatorName: "Brooks",
    },
  ],
  patients: [],
  requests: [],
  bookings: [
    {
      id: "bk-001",
      requestId: "req-003",
      patientId: "pat-001",
      serviceId: "svc-mri-brain",
      setupId: "setup-1",
      date: "2026-07-08",
      startTime: "10:00",
      status: "Scheduled",
      operatorId: "op-001",
      operatorName: "Mitchell",
    },
    {
      id: "bk-002",
      patientId: "pat-003",
      serviceId: "svc-ct-chest",
      setupId: "setup-2",
      date: "2026-07-08",
      startTime: "10:00",
      status: "Scheduled",
      operatorId: "op-002",
      operatorName: "Sullivan",
    },
    {
      id: "bk-003",
      patientId: "pat-004",
      serviceId: "svc-mri-brain",
      setupId: "setup-1",
      date: "2026-07-08",
      startTime: "14:00",
      status: "Scheduled",
      operatorId: "op-001",
      operatorName: "Mitchell",
    },
    {
      id: "bk-004",
      patientId: "pat-005",
      serviceId: "svc-ct-chest",
      setupId: "setup-8",
      date: "2026-07-08",
      startTime: "08:00",
      status: "Scheduled",
      operatorId: "op-002",
      operatorName: "Sullivan",
    },
    {
      id: "bk-005",
      patientId: "pat-006",
      serviceId: "svc-xray-chest",
      setupId: "setup-3",
      date: "2026-07-08",
      startTime: "11:15",
      status: "Scheduled",
      operatorId: "op-003",
      operatorName: "Carter",
    },
    {
      id: "bk-006",
      patientId: "pat-007",
      serviceId: "svc-mri-brain",
      setupId: "setup-4",
      date: "2026-07-08",
      startTime: "14:00",
      status: "Scheduled",
      operatorId: "op-006",
      operatorName: "Stevens",
    },
    {
      id: "bk-007",
      patientId: "pat-008",
      serviceId: "svc-ct-chest",
      setupId: "setup-9",
      date: "2026-07-08",
      startTime: "14:00",
      status: "Scheduled",
      operatorId: "op-005",
      operatorName: "Nelson",
    },
    {
      id: "bk-008",
      patientId: "pat-009",
      serviceId: "svc-xray-chest",
      setupId: "setup-14",
      date: "2026-07-08",
      startTime: "09:30",
      status: "Scheduled",
      operatorId: "op-007",
      operatorName: "Brooks",
    },
    {
      id: "bk-009",
      patientId: "pat-010",
      serviceId: "svc-mri-brain",
      setupId: "setup-5",
      date: "2026-07-08",
      startTime: "15:00",
      status: "Scheduled",
      operatorId: "op-001",
      operatorName: "Mitchell",
    },
    {
      id: "bk-010",
      patientId: "pat-011",
      serviceId: "svc-ct-chest",
      setupId: "setup-10",
      date: "2026-07-08",
      startTime: "14:00",
      status: "Scheduled",
      operatorId: "op-005",
      operatorName: "Nelson",
    },
    {
      id: "bk-011",
      patientId: "pat-012",
      serviceId: "svc-xray-chest",
      setupId: "setup-15",
      date: "2026-07-08",
      startTime: "10:00",
      status: "Scheduled",
      operatorId: "op-007",
      operatorName: "Brooks",
    },
    {
      id: "bk-012",
      patientId: "pat-002",
      serviceId: "svc-mri-brain",
      setupId: "setup-18",
      date: "2026-07-08",
      startTime: "16:00",
      status: "Scheduled",
      operatorId: "op-008",
      operatorName: "Reed",
    },
    {
      id: "bk-013",
      patientId: "pat-005",
      serviceId: "svc-ct-chest",
      setupId: "setup-11",
      date: "2026-07-08",
      startTime: "16:00",
      status: "Scheduled",
      operatorId: "op-002",
      operatorName: "Sullivan",
    },
    {
      id: "bk-014",
      patientId: "pat-006",
      serviceId: "svc-xray-chest",
      setupId: "setup-16",
      date: "2026-07-08",
      startTime: "14:00",
      status: "Scheduled",
      operatorId: "op-007",
      operatorName: "Brooks",
    },
    {
      id: "bk-015",
      patientId: "pat-009",
      serviceId: "svc-mri-brain",
      setupId: "setup-19",
      date: "2026-07-08",
      startTime: "10:00",
      status: "Scheduled",
      operatorId: "op-006",
      operatorName: "Stevens",
    },
  ],
  events: [
    {
      id: "evt-demo",
      type: "emergency",
      setupId: "setup-1",
      date: "2026-07-08",
      startTime: "09:00",
      durationMinutes: 60,
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      reason: "Demo emergency — review reschedule plan UI",
      status: "Draft",
      planId: "plan-demo",
      createdAt: "2026-07-08T08:00:00.000Z",
    },
    {
      id: "evt-down-ct",
      type: "setup_down",
      setupId: "setup-2",
      date: "2026-07-10",
      startTime: "14:00",
      durationMinutes: 240,
      effectiveFrom: "2026-07-10",
      effectiveTo: "2026-07-11",
      reason: "Planned maintenance — CT Suite B (afternoons)",
      status: "Active",
      createdAt: "2026-07-08T08:00:00.000Z",
    },
    {
      id: "evt-down-ct-b-am",
      type: "setup_down",
      setupId: "setup-2",
      date: "2026-07-08",
      startTime: "08:00",
      durationMinutes: 90,
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      reason: "Morning calibration — CT Suite B",
      status: "Active",
      createdAt: "2026-07-08T08:00:00.000Z",
    },
    {
      id: "evt-down-mri-b",
      type: "setup_down",
      setupId: "setup-4",
      date: "2026-07-08",
      startTime: "10:00",
      durationMinutes: 120,
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      reason: "Cooling system check — MRI Suite B",
      status: "Active",
      createdAt: "2026-07-08T08:00:00.000Z",
    },
    {
      id: "evt-down-ct-a-pm",
      type: "setup_down",
      setupId: "setup-8",
      date: "2026-07-08",
      startTime: "14:00",
      durationMinutes: 180,
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      reason: "Tube replacement — CT Suite A",
      status: "Active",
      createdAt: "2026-07-08T08:00:00.000Z",
    },
    {
      id: "evt-down-xray-2",
      type: "setup_down",
      setupId: "setup-14",
      date: "2026-07-08",
      startTime: "11:30",
      durationMinutes: 90,
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      reason: "Detector service — X-Ray Room 2",
      status: "Active",
      createdAt: "2026-07-08T08:00:00.000Z",
    },
  ],
  operatorLeaves: [
    {
      id: "leave-001",
      operatorId: "op-004",
      effectiveFrom: "2026-07-09",
      effectiveTo: "2026-07-10",
      reason: "Annual leave",
    },
    {
      id: "leave-002",
      operatorId: "op-007",
      effectiveFrom: "2026-07-12",
      effectiveTo: "2026-07-12",
      startTime: "08:00",
      endTime: "13:00",
      reason: "Training (morning)",
    },
    {
      id: "leave-003",
      operatorId: "op-003",
      effectiveFrom: "2026-07-15",
      effectiveTo: "2026-07-16",
      reason: "Sick leave",
    },
    {
      id: "leave-004",
      operatorId: "op-003",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "08:00",
      endTime: "11:00",
      reason: "Training — X-Ray Room 1",
    },
    {
      id: "leave-005",
      operatorId: "op-007",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "15:00",
      endTime: "17:00",
      reason: "Certification — X-Ray rooms",
    },
    {
      id: "leave-006",
      operatorId: "op-005",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "11:00",
      endTime: "13:00",
      reason: "Clinic duty — CT / X-Ray",
    },
    {
      id: "leave-007",
      operatorId: "op-001",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "08:00",
      endTime: "09:30",
      reason: "Morning briefing — MRI",
    },
    {
      id: "leave-008",
      operatorId: "op-002",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "14:00",
      endTime: "16:00",
      reason: "Afternoon leave — CT Suite B",
    },
    {
      id: "leave-009",
      operatorId: "op-008",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "09:00",
      endTime: "10:30",
      reason: "Equipment training — CT Suite G",
    },
    {
      id: "leave-010",
      operatorId: "op-006",
      effectiveFrom: "2026-07-08",
      effectiveTo: "2026-07-08",
      startTime: "16:00",
      endTime: "18:00",
      reason: "Late shift cover elsewhere",
    },
  ],
  reschedulePlans: [
    {
      id: "plan-demo",
      eventId: "evt-demo",
      status: "Draft",
      createdAt: "2026-07-08T08:00:00.000Z",
      moves: [
        {
          id: "move-demo-001",
          bookingId: "bk-001",
          patientId: "pat-001",
          oldSetupId: "setup-1",
          oldDate: "2026-07-08",
          oldStartTime: "10:00",
          newSetupId: null,
          newDate: null,
          newStartTime: null,
          status: "ManualReview",
          reason: "Emergency block on setup",
        },
      ],
    },
  ],
};

globalThis.MOCK_DATA.patients = (function generateMockPatients() {
  var corePatients = [
    {
      id: "pat-001",
      mrn: "MRN-10001",
      name: "James Wilson",
      age: 45,
      gender: "Male",
      patientType: "IPD",
      disease: "Headache",
      severity: "Moderate",
    },
    {
      id: "pat-002",
      mrn: "MRN-10002",
      name: "Emily Johnson",
      age: 32,
      gender: "Female",
      patientType: "OPD",
      disease: "Chest pain",
      severity: "High",
    },
    {
      id: "pat-003",
      mrn: "MRN-10003",
      name: "Michael Davis",
      age: 58,
      gender: "Male",
      patientType: "IPD",
      disease: "Stroke follow-up",
      severity: "High",
    },
    {
      id: "pat-004",
      mrn: "MRN-10004",
      name: "Sarah Martinez",
      age: 27,
      gender: "Female",
      patientType: "OPD",
      disease: "Back pain",
      severity: "Low",
    },
    {
      id: "pat-005",
      mrn: "MRN-10005",
      name: "Robert Anderson",
      age: 41,
      gender: "Male",
      patientType: "IPD",
      disease: "Abdominal pain",
      severity: "Moderate",
    },
    {
      id: "pat-006",
      mrn: "MRN-10006",
      name: "Jennifer Taylor",
      age: 63,
      gender: "Female",
      patientType: "OPD",
      disease: "Cough",
      severity: "Low",
    },
    {
      id: "pat-007",
      mrn: "MRN-10007",
      name: "David Thomas",
      age: 35,
      gender: "Male",
      patientType: "IPD",
      disease: "Seizure workup",
      severity: "High",
    },
    {
      id: "pat-008",
      mrn: "MRN-10008",
      name: "Jessica Brown",
      age: 49,
      gender: "Female",
      patientType: "OPD",
      disease: "Pulmonary nodule",
      severity: "Moderate",
    },
    {
      id: "pat-009",
      mrn: "MRN-10009",
      name: "Christopher Lee",
      age: 22,
      gender: "Male",
      patientType: "OPD",
      disease: "Sports injury",
      severity: "Low",
    },
    {
      id: "pat-010",
      mrn: "MRN-10010",
      name: "Amanda White",
      age: 55,
      gender: "Female",
      patientType: "IPD",
      disease: "Brain metastasis",
      severity: "High",
    },
    {
      id: "pat-011",
      mrn: "MRN-10011",
      name: "Daniel Harris",
      age: 38,
      gender: "Male",
      patientType: "OPD",
      disease: "Renal colic",
      severity: "Moderate",
    },
    {
      id: "pat-012",
      mrn: "MRN-10012",
      name: "Ashley Clark",
      age: 29,
      gender: "Female",
      patientType: "OPD",
      disease: "Pre-op screening",
      severity: "Low",
    },
  ];

  var maleFirst = [
    "James",
    "Michael",
    "Robert",
    "David",
    "William",
    "Richard",
    "Joseph",
    "Thomas",
    "Christopher",
    "Daniel",
    "Matthew",
    "Anthony",
    "Mark",
    "Donald",
    "Steven",
    "Paul",
    "Andrew",
    "Joshua",
    "Kenneth",
    "Kevin",
  ];
  var femaleFirst = [
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
    "Lisa",
    "Nancy",
    "Betty",
    "Margaret",
    "Sandra",
    "Ashley",
    "Kimberly",
    "Emily",
    "Donna",
    "Michelle",
  ];
  var lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Wilson",
    "Anderson",
    "Taylor",
    "Thomas",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Thompson",
    "White",
    "Harris",
    "Clark",
    "Lewis",
    "Walker",
  ];
  var diseases = [
    "Headache",
    "Chest pain",
    "Back pain",
    "Abdominal pain",
    "Cough",
    "Stroke follow-up",
    "Pulmonary nodule",
    "Sports injury",
    "Renal colic",
    "Pre-op screening",
    "Joint pain",
    "Dizziness",
    "Seizure workup",
    "Fever workup",
    "Trauma survey",
    "Cardiac screening",
    "Liver lesion",
    "Sinusitis",
    "Neck stiffness",
    "Diabetic foot",
  ];
  var severities = ["High", "Moderate", "Low"];
  var patientTypes = ["IPD", "OPD"];

  function pick(list, index) {
    return list[index % list.length];
  }

  var patients = corePatients.slice();
  for (var i = 13; i <= 1000; i++) {
    var gender = i % 2 === 0 ? "Female" : "Male";
    var firstPool = gender === "Male" ? maleFirst : femaleFirst;
    var first = pick(firstPool, i);
    var last = pick(lastNames, i * 3);
    patients.push({
      id: "pat-" + i,
      mrn: "MRN-" + String(10000 + i),
      name: first + " " + last,
      age: 18 + ((i * 7) % 62),
      gender: gender,
      patientType: pick(patientTypes, i + (i % 3)),
      disease: pick(diseases, i * 5),
      // Use floor(i/3) so severity is not locked to High for MRI (every 3rd patient/request).
      severity: pick(severities, Math.floor(i / 3)),
    });
  }

  // Keep generator above; expose only first 100 for now.
  return patients.filter(function (_patient, index) {
    return index < 100;
  });
})();

globalThis.MOCK_DATA.requests = (function generateMockRequests() {
  var services = ["svc-mri-brain", "svc-ct-chest", "svc-xray-chest"];
  var windows = ["Morning", "Afternoon"];
  var scheduleDay = "2026-07-08";

  function pick(list, index) {
    return list[index % list.length];
  }

  var requests = [
    {
      id: "req-001",
      patientId: "pat-002",
      serviceId: "svc-ct-chest",
      requestedDate: scheduleDay,
      preferredWindow: "Morning",
      status: "Pending",
    },
    {
      id: "req-002",
      patientId: "pat-003",
      serviceId: "svc-mri-brain",
      requestedDate: scheduleDay,
      preferredWindow: "Afternoon",
      status: "Pending",
    },
    {
      id: "req-003",
      patientId: "pat-001",
      serviceId: "svc-mri-brain",
      requestedDate: scheduleDay,
      preferredWindow: "Morning",
      status: "Assigned",
    },
  ];

  for (var p = 4; p <= 1000; p++) {
    var patientId = p <= 12 ? "pat-" + String(p).padStart(3, "0") : "pat-" + p;
    requests.push({
      id: "req-" + String(p).padStart(3, "0"),
      patientId: patientId,
      serviceId: pick(services, p),
      requestedDate: scheduleDay,
      preferredWindow: pick(windows, p),
      status: "Pending",
    });
  }

  // Match filtered patient set (first 100); keep full generator above.
  var patientIds = {};
  (globalThis.MOCK_DATA.patients || []).forEach(function (patient) {
    patientIds[patient.id] = true;
  });
  return requests.filter(function (request) {
    return patientIds[request.patientId];
  });
})();

globalThis.MOCK_DATA.departments = [
  { id: "dept-medicine", name: "Medicine", status: "Active" },
  { id: "dept-surgery", name: "Surgery", status: "Active" },
  { id: "dept-critical", name: "Critical Care", status: "Active" },
];

globalThis.MOCK_DATA.wards = [
  { id: "ward-med-gen", departmentId: "dept-medicine", name: "Medicine General", wardType: "General", status: "Active" },
  { id: "ward-med-priv", departmentId: "dept-medicine", name: "Medicine Private", wardType: "Private", status: "Active" },
  { id: "ward-surg-gen", departmentId: "dept-surgery", name: "Surgery General", wardType: "General", status: "Active" },
  { id: "ward-surg-priv", departmentId: "dept-surgery", name: "Surgery Private", wardType: "Private", status: "Active" },
  { id: "ward-icu", departmentId: "dept-critical", name: "ICU", wardType: "ICU", status: "Active" },
  { id: "ward-hdu", departmentId: "dept-critical", name: "HDU", wardType: "ICU", status: "Active" },
];

globalThis.MOCK_DATA.beds = [
  { id: "bed-mg-01", wardId: "ward-med-gen", name: "MG-01", status: "Active", bookingMode: "Daily" },
  { id: "bed-mg-02", wardId: "ward-med-gen", name: "MG-02", status: "Active", bookingMode: "Daily" },
  { id: "bed-mg-03", wardId: "ward-med-gen", name: "MG-03", status: "Active", bookingMode: "Hourly" },
  { id: "bed-mg-04", wardId: "ward-med-gen", name: "MG-04", status: "Under Maintenance", bookingMode: "Daily" },
  { id: "bed-mp-01", wardId: "ward-med-priv", name: "MP-01", status: "Active", bookingMode: "Daily" },
  { id: "bed-mp-02", wardId: "ward-med-priv", name: "MP-02", status: "Active", bookingMode: "Daily" },
  { id: "bed-sg-01", wardId: "ward-surg-gen", name: "SG-01", status: "Active", bookingMode: "Daily" },
  { id: "bed-sg-02", wardId: "ward-surg-gen", name: "SG-02", status: "Active", bookingMode: "Daily" },
  { id: "bed-sg-03", wardId: "ward-surg-gen", name: "SG-03", status: "Active", bookingMode: "Hourly" },
  { id: "bed-sp-01", wardId: "ward-surg-priv", name: "SP-01", status: "Active", bookingMode: "Daily" },
  { id: "bed-sp-02", wardId: "ward-surg-priv", name: "SP-02", status: "Active", bookingMode: "Hourly" },
  { id: "bed-icu-01", wardId: "ward-icu", name: "ICU-01", status: "Active", bookingMode: "Daily" },
  { id: "bed-icu-02", wardId: "ward-icu", name: "ICU-02", status: "Active", bookingMode: "Daily" },
  { id: "bed-icu-03", wardId: "ward-icu", name: "ICU-03", status: "Active", bookingMode: "Daily" },
  { id: "bed-hdu-01", wardId: "ward-hdu", name: "HDU-01", status: "Active", bookingMode: "Hourly" },
  { id: "bed-hdu-02", wardId: "ward-hdu", name: "HDU-02", status: "Inactive", bookingMode: "Daily" },
];

globalThis.MOCK_DATA.bedRequests = (function generateBedRequests() {
  var start = "2026-07-08";
  var horizon = 15;

  // Only combos that exist in seed wards/beds.
  var capacityProfiles = [
    { departmentId: "dept-medicine", preferredWardType: "General" },
    { departmentId: "dept-medicine", preferredWardType: "Private" },
    { departmentId: "dept-surgery", preferredWardType: "General" },
    { departmentId: "dept-surgery", preferredWardType: "Private" },
    { departmentId: "dept-critical", preferredWardType: "ICU" },
  ];

  function addDays(dateStr, days) {
    var parts = dateStr.split("-");
    var date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    date.setDate(date.getDate() + days);
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  // One request per patient (pat-1..1000). Assigned rows stay linked to seed allotments.
  var assignedByPatient = {
    "pat-001": {
      departmentId: "dept-medicine",
      preferredWardType: "General",
      requestedAdmitDate: start,
      expectedDays: 4,
    },
    "pat-004": {
      departmentId: "dept-surgery",
      preferredWardType: "General",
      requestedAdmitDate: start,
      expectedDays: 3,
    },
    "pat-005": {
      departmentId: "dept-critical",
      preferredWardType: "ICU",
      requestedAdmitDate: addDays(start, -1),
      expectedDays: 6,
    },
    "pat-006": {
      departmentId: "dept-medicine",
      preferredWardType: "Private",
      requestedAdmitDate: addDays(start, 1),
      expectedDays: 3,
    },
    "pat-007": {
      departmentId: "dept-surgery",
      preferredWardType: "Private",
      requestedAdmitDate: addDays(start, 3),
      expectedDays: 2,
    },
    "pat-008": {
      departmentId: "dept-critical",
      preferredWardType: "ICU",
      requestedAdmitDate: addDays(start, 4),
      expectedDays: 5,
    },
  };

  var requests = [];
  var pendingIndex = 0;
  var stayLengths = [1, 2, 3, 4, 5, 6];
  for (var p = 1; p <= 1000; p++) {
    // Match patient id format in generateMockPatients (001–012 padded, then pat-13…).
    var patientId = p <= 12 ? "pat-" + String(p).padStart(3, "0") : "pat-" + p;
    var assigned = assignedByPatient[patientId];
    if (assigned) {
      requests.push({
        id: "bedreq-" + p,
        patientId: patientId,
        departmentId: assigned.departmentId,
        preferredWardType: assigned.preferredWardType,
        requestedAdmitDate: assigned.requestedAdmitDate,
        expectedDays: assigned.expectedDays,
        status: "Assigned",
      });
      continue;
    }

    // Spread admit dates across the 15-day UI horizon, keep ward/dept valid,
    // and rotate stay lengths 1–6 so the timeline shows variety while packing densely.
    var dayOffset = pendingIndex % horizon;
    var profile =
      capacityProfiles[Math.floor(pendingIndex / horizon) % capacityProfiles.length];
    var stay =
      stayLengths[
        Math.floor(pendingIndex / (horizon * capacityProfiles.length)) % stayLengths.length
      ];
    var daysLeftInHorizon = horizon - dayOffset;
    var expectedDays = Math.min(stay, daysLeftInHorizon);
    if (expectedDays < 1) {
      expectedDays = 1;
    }

    requests.push({
      id: "bedreq-" + p,
      patientId: patientId,
      departmentId: profile.departmentId,
      preferredWardType: profile.preferredWardType,
      requestedAdmitDate: addDays(start, dayOffset),
      expectedDays: expectedDays,
      status: "Pending",
      bookingMode: "Daily",
    });
    pendingIndex += 1;
  }

  // Day-care / procedure beds: keep plenty of hourly requests in the queue so
  // bulk preview / suggestions can pack most hourly slots on Day and 15-day views.
  var hourlyDurations = [60, 90, 120, 180];
  var hourlyStarts = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  var hourlyTargets = [
    { departmentId: "dept-medicine", preferredWardType: "General" },
    { departmentId: "dept-surgery", preferredWardType: "General" },
    { departmentId: "dept-surgery", preferredWardType: "Private" },
    { departmentId: "dept-critical", preferredWardType: "ICU" },
  ];
  var hourlyConverted = 0;
  for (var t = 0; t < hourlyTargets.length; t++) {
    var target = hourlyTargets[t];
    var convertedForTarget = 0;
    for (var i = 0; i < requests.length && convertedForTarget < 90; i++) {
      var req = requests[i];
      if (
        req.status !== "Pending" ||
        req.bookingMode === "Hourly" ||
        req.departmentId !== target.departmentId ||
        req.preferredWardType !== target.preferredWardType
      ) {
        continue;
      }
      req.bookingMode = "Hourly";
      req.expectedDays = 1;
      req.expectedMinutes = hourlyDurations[hourlyConverted % hourlyDurations.length];
      req.preferredStartTime = hourlyStarts[hourlyConverted % hourlyStarts.length];
      hourlyConverted += 1;
      convertedForTarget += 1;
    }
  }

  // Match filtered patient set (first 100); keep full generator above.
  var patientIds = {};
  (globalThis.MOCK_DATA.patients || []).forEach(function (patient) {
    patientIds[patient.id] = true;
  });
  return requests.filter(function (request) {
    return patientIds[request.patientId];
  });
})();

globalThis.MOCK_DATA.allotments = (function generateAllotments() {
  var start = "2026-07-08";

  function addDays(dateStr, days) {
    var parts = dateStr.split("-");
    var date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    date.setDate(date.getDate() + days);
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  return [
    {
      id: "allot-001",
      bedRequestId: "bedreq-1",
      patientId: "pat-001",
      bedId: "bed-mg-01",
      admitDate: start,
      dischargeDate: addDays(start, 4),
      status: "Scheduled",
      bookingMode: "Daily",
    },
    {
      id: "allot-002",
      bedRequestId: "bedreq-4",
      patientId: "pat-004",
      bedId: "bed-sg-01",
      admitDate: start,
      dischargeDate: addDays(start, 3),
      status: "Scheduled",
      bookingMode: "Daily",
    },
    {
      id: "allot-003",
      bedRequestId: "bedreq-5",
      patientId: "pat-005",
      bedId: "bed-icu-01",
      admitDate: addDays(start, -1),
      dischargeDate: addDays(start, 5),
      status: "Scheduled",
      bookingMode: "Daily",
    },
    {
      id: "allot-004",
      bedRequestId: "bedreq-6",
      patientId: "pat-006",
      bedId: "bed-mp-01",
      admitDate: addDays(start, 1),
      dischargeDate: addDays(start, 4),
      status: "Scheduled",
      bookingMode: "Daily",
    },
    {
      id: "allot-005",
      bedRequestId: "bedreq-7",
      patientId: "pat-007",
      bedId: "bed-sp-01",
      admitDate: addDays(start, 3),
      dischargeDate: addDays(start, 5),
      status: "Scheduled",
      bookingMode: "Daily",
    },
    {
      id: "allot-006",
      bedRequestId: "bedreq-8",
      patientId: "pat-008",
      bedId: "bed-icu-02",
      admitDate: addDays(start, 4),
      dischargeDate: addDays(start, 9),
      status: "Scheduled",
      bookingMode: "Daily",
    },
    // Hourly day-care stays on MG-03 / SG-03 / SP-02 / HDU-01 for the schedule start day.
    {
      id: "allot-h01",
      bedRequestId: null,
      patientId: "pat-009",
      bedId: "bed-mg-03",
      admitDate: start,
      dischargeDate: addDays(start, 1),
      startTime: "08:00",
      endTime: "10:00",
      status: "Scheduled",
      bookingMode: "Hourly",
    },
    {
      id: "allot-h02",
      bedRequestId: null,
      patientId: "pat-010",
      bedId: "bed-mg-03",
      admitDate: start,
      dischargeDate: addDays(start, 1),
      startTime: "10:30",
      endTime: "12:00",
      status: "Scheduled",
      bookingMode: "Hourly",
    },
    {
      id: "allot-h03",
      bedRequestId: null,
      patientId: "pat-011",
      bedId: "bed-sg-03",
      admitDate: start,
      dischargeDate: addDays(start, 1),
      startTime: "09:00",
      endTime: "11:00",
      status: "Scheduled",
      bookingMode: "Hourly",
    },
    {
      id: "allot-h04",
      bedRequestId: null,
      patientId: "pat-012",
      bedId: "bed-sg-03",
      admitDate: start,
      dischargeDate: addDays(start, 1),
      startTime: "14:00",
      endTime: "16:30",
      status: "Scheduled",
      bookingMode: "Hourly",
    },
    {
      id: "allot-h05",
      bedRequestId: null,
      patientId: "pat-13",
      bedId: "bed-sp-02",
      admitDate: start,
      dischargeDate: addDays(start, 1),
      startTime: "08:30",
      endTime: "11:30",
      status: "Scheduled",
      bookingMode: "Hourly",
    },
    {
      id: "allot-h06",
      bedRequestId: null,
      patientId: "pat-14",
      bedId: "bed-hdu-01",
      admitDate: start,
      dischargeDate: addDays(start, 1),
      startTime: "15:00",
      endTime: "17:00",
      status: "Scheduled",
      bookingMode: "Hourly",
    },
  ];
})();

export const MOCK_DATA = globalThis.MOCK_DATA;

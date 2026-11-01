// Auto-generated institutional fallback dataset for Chilika Institute of Technology (CIT)
// Guarantees 100% availability with 0 hard violations even when cloud backend is waking up or offline.

export interface TimetableSlot {
  slot_id: number;
  session_id: string;
  course_id: string;
  course_title: string;
  kind: string;
  duration: number;
  faculty_id: string;
  faculty_name: string;
  groups: string[];
  day: string;
  start_period: number;
  room_id: string;
  room_name: string;
}

export interface ExamItem {
  id: string;
  exam_id?: string;
  course_ids: string[];
  groups: string[];
  size: number;
  duration_hours: number;
  day: string;
  session: string;
  rooms: string[];
}

export interface BookingItem {
  id: string;
  booking_id?: string;
  submitted_at: string;
  requester: string;
  role: string;
  department?: string | null;
  requested_category: string;
  title: string;
  attendance: number;
  duration_periods: number;
  windows: Array<{ day: string; from_period: number; to_period: number }>;
  room_types: string[];
  needs: string[];
  requested_room?: string | null;
  mandatory_for_groups: string[];
  status: "approve" | "approved" | "reject" | "rejected" | "alternative" | "cancelled" | "pending";
  assigned_day?: string | null;
  assigned_periods?: number[];
  assigned_room?: string | null;
  rejection_reason?: string | null;
}

export const FALLBACK_TIMETABLE_METADATA = {
  "institute": "Chilika Institute of Technology (fictional)",
  "calendar": {
    "days": [
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI"
    ],
    "periods": [
      {
        "id": 1,
        "start": "08:00",
        "end": "09:00",
        "teaching": true
      },
      {
        "id": 2,
        "start": "09:00",
        "end": "10:00",
        "teaching": true
      },
      {
        "id": 3,
        "start": "10:00",
        "end": "11:00",
        "teaching": true
      },
      {
        "id": 4,
        "start": "11:00",
        "end": "12:00",
        "teaching": true
      },
      {
        "id": 5,
        "start": "12:00",
        "end": "13:00",
        "teaching": true
      },
      {
        "id": 6,
        "start": "14:00",
        "end": "15:00",
        "teaching": true
      },
      {
        "id": 7,
        "start": "15:00",
        "end": "16:00",
        "teaching": true
      },
      {
        "id": 8,
        "start": "16:00",
        "end": "17:00",
        "teaching": true
      },
      {
        "id": 9,
        "start": "17:00",
        "end": "18:00",
        "teaching": true
      },
      {
        "id": 10,
        "start": "18:00",
        "end": "19:00",
        "teaching": false
      },
      {
        "id": 11,
        "start": "19:00",
        "end": "20:00",
        "teaching": false
      },
      {
        "id": 12,
        "start": "20:00",
        "end": "21:00",
        "teaching": false
      },
      {
        "id": 13,
        "start": "21:00",
        "end": "22:00",
        "teaching": false
      }
    ],
    "lunch": {
      "after_period": 5,
      "start": "13:00",
      "end": "14:00"
    },
    "lab_start_periods": [
      2,
      6
    ],
    "event_only_periods": [
      10,
      11,
      12,
      13
    ],
    "fest_week": "Week 7 (Spectra '27)",
    "exam_week": {
      "days": [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT"
      ],
      "sessions": [
        {
          "id": "AM",
          "start": "09:30",
          "end": "11:30"
        },
        {
          "id": "PM",
          "start": "14:00",
          "end": "16:00"
        }
      ]
    }
  },
  "rooms": [
    {
      "id": "AUD",
      "name": "Main Auditorium",
      "building": "Admin Block",
      "type": "auditorium",
      "capacity": 500,
      "accessible": true
    },
    {
      "id": "LH-1",
      "name": "Lecture Hall 1",
      "building": "Lecture Hall Complex",
      "type": "lecture_hall",
      "capacity": 200,
      "accessible": true
    },
    {
      "id": "LH-2",
      "name": "Lecture Hall 2",
      "building": "Lecture Hall Complex",
      "type": "lecture_hall",
      "capacity": 200,
      "accessible": true
    },
    {
      "id": "LH-3",
      "name": "Lecture Hall 3",
      "building": "Lecture Hall Complex",
      "type": "lecture_hall",
      "capacity": 120,
      "accessible": true
    },
    {
      "id": "LH-4",
      "name": "Lecture Hall 4",
      "building": "Lecture Hall Complex",
      "type": "lecture_hall",
      "capacity": 120,
      "accessible": true
    },
    {
      "id": "LH-5",
      "name": "Lecture Hall 5",
      "building": "Lecture Hall Complex",
      "type": "lecture_hall",
      "capacity": 120,
      "accessible": true
    },
    {
      "id": "LH-6",
      "name": "Lecture Hall 6",
      "building": "Lecture Hall Complex",
      "type": "lecture_hall",
      "capacity": 120,
      "accessible": true
    },
    {
      "id": "CR-101",
      "name": "Classroom A-101",
      "building": "Academic Block A (ground floor)",
      "type": "classroom",
      "capacity": 90,
      "accessible": true
    },
    {
      "id": "CR-102",
      "name": "Classroom A-102",
      "building": "Academic Block A (ground floor)",
      "type": "classroom",
      "capacity": 90,
      "accessible": true
    },
    {
      "id": "CR-103",
      "name": "Classroom A-103",
      "building": "Academic Block A (ground floor)",
      "type": "classroom",
      "capacity": 80,
      "accessible": true
    },
    {
      "id": "CR-104",
      "name": "Classroom A-104",
      "building": "Academic Block A (ground floor)",
      "type": "classroom",
      "capacity": 80,
      "accessible": true
    },
    {
      "id": "CR-105",
      "name": "Classroom A-105",
      "building": "Academic Block A (ground floor)",
      "type": "classroom",
      "capacity": 70,
      "accessible": true
    },
    {
      "id": "CR-201",
      "name": "Classroom B-201",
      "building": "Academic Block B (2nd floor, no lift)",
      "type": "classroom",
      "capacity": 90,
      "accessible": false
    },
    {
      "id": "CR-202",
      "name": "Classroom B-202",
      "building": "Academic Block B (2nd floor, no lift)",
      "type": "classroom",
      "capacity": 80,
      "accessible": false
    },
    {
      "id": "CR-203",
      "name": "Classroom B-203",
      "building": "Academic Block B (2nd floor, no lift)",
      "type": "classroom",
      "capacity": 80,
      "accessible": false
    },
    {
      "id": "CR-204",
      "name": "Classroom B-204",
      "building": "Academic Block B (2nd floor, no lift)",
      "type": "classroom",
      "capacity": 70,
      "accessible": false
    },
    {
      "id": "CR-205",
      "name": "Classroom B-205",
      "building": "Academic Block B (2nd floor, no lift)",
      "type": "classroom",
      "capacity": 60,
      "accessible": false
    },
    {
      "id": "SH-1",
      "name": "Seminar Hall 1",
      "building": "Library Building",
      "type": "seminar_hall",
      "capacity": 150,
      "accessible": true
    },
    {
      "id": "SH-2",
      "name": "Seminar Hall 2",
      "building": "Library Building (1st floor, no lift)",
      "type": "seminar_hall",
      "capacity": 100,
      "accessible": false
    },
    {
      "id": "OAT",
      "name": "Open Air Theatre",
      "building": "Campus Green",
      "type": "outdoor",
      "capacity": 800,
      "accessible": true
    },
    {
      "id": "CS-LAB-1",
      "name": "Computing Lab 1",
      "building": "CSE Building",
      "type": "lab_cs",
      "capacity": 90,
      "accessible": true
    },
    {
      "id": "CS-LAB-2",
      "name": "Computing Lab 2",
      "building": "CSE Building",
      "type": "lab_cs",
      "capacity": 90,
      "accessible": true
    },
    {
      "id": "ELEC-LAB-1",
      "name": "Electronics Lab 1",
      "building": "EE-ECE Building",
      "type": "lab_elec",
      "capacity": 80,
      "accessible": true
    },
    {
      "id": "ELEC-LAB-2",
      "name": "Electronics Lab 2",
      "building": "EE-ECE Building",
      "type": "lab_elec",
      "capacity": 80,
      "accessible": true
    },
    {
      "id": "PHY-LAB",
      "name": "Physics Lab",
      "building": "Science Block",
      "type": "lab_phy",
      "capacity": 90,
      "accessible": true
    },
    {
      "id": "MECH-WS",
      "name": "Central Workshop",
      "building": "Workshop Shed",
      "type": "workshop",
      "capacity": 90,
      "accessible": true
    },
    {
      "id": "CIVIL-LAB",
      "name": "Civil Engineering Lab",
      "building": "Civil Building",
      "type": "lab_civil",
      "capacity": 60,
      "accessible": true
    }
  ],
  "faculty": [
    {
      "id": "F01",
      "name": "Dr. Ananya Mishra",
      "department": "CSE"
    },
    {
      "id": "F02",
      "name": "Dr. Rohit Sahoo",
      "department": "CSE"
    },
    {
      "id": "F03",
      "name": "Dr. Kavya Iyer",
      "department": "CSE"
    },
    {
      "id": "F04",
      "name": "Dr. Sandeep Patnaik",
      "department": "CSE"
    },
    {
      "id": "F05",
      "name": "Dr. Meera Nair",
      "department": "CSE"
    },
    {
      "id": "F06",
      "name": "Dr. Arjun Mehta",
      "department": "CSE"
    },
    {
      "id": "F07",
      "name": "Dr. Pooja Das",
      "department": "CSE"
    },
    {
      "id": "F08",
      "name": "Prof. Vikram Rao (Visiting)",
      "department": "CSE"
    },
    {
      "id": "F09",
      "name": "Dr. Ishita Banerjee",
      "department": "ECE"
    },
    {
      "id": "F10",
      "name": "Dr. Suresh Pradhan",
      "department": "ECE"
    },
    {
      "id": "F11",
      "name": "Dr. Neha Kulkarni",
      "department": "ECE"
    },
    {
      "id": "F12",
      "name": "Dr. Amit Behera",
      "department": "ECE"
    },
    {
      "id": "F13",
      "name": "Dr. Ritu Sharma",
      "department": "ECE"
    },
    {
      "id": "F14",
      "name": "Dr. Kunal Joshi",
      "department": "EE"
    },
    {
      "id": "F15",
      "name": "Dr. Sneha Mohanty",
      "department": "EE"
    },
    {
      "id": "F16",
      "name": "Dr. Rakesh Panda",
      "department": "EE"
    },
    {
      "id": "F17",
      "name": "Dr. Divya Menon",
      "department": "EE"
    },
    {
      "id": "F18",
      "name": "Dr. Manoj Tripathy",
      "department": "EE"
    },
    {
      "id": "F19",
      "name": "Dr. Shalini Gupta",
      "department": "MA"
    },
    {
      "id": "F20",
      "name": "Dr. Prakash Nayak",
      "department": "MA"
    },
    {
      "id": "F21",
      "name": "Dr. Lakshmi Reddy",
      "department": "PH"
    },
    {
      "id": "F22",
      "name": "Dr. Harish Dash",
      "department": "PH"
    },
    {
      "id": "F23",
      "name": "Dr. Farah Khan",
      "department": "PH"
    },
    {
      "id": "F24",
      "name": "Dr. Gaurav Jena",
      "department": "PH"
    },
    {
      "id": "F25",
      "name": "Dr. Tanvi Desai",
      "department": "ME"
    },
    {
      "id": "F26",
      "name": "Dr. Abhishek Rout",
      "department": "ME"
    },
    {
      "id": "F27",
      "name": "Dr. Sunita Bose",
      "department": "ME"
    },
    {
      "id": "F28",
      "name": "Dr. Nikhil Swain",
      "department": "ME"
    },
    {
      "id": "F29",
      "name": "Dr. Priya Raman",
      "department": "ME"
    },
    {
      "id": "F30",
      "name": "Dr. Debashish Sethi",
      "department": "ME"
    },
    {
      "id": "F31",
      "name": "Dr. Anjali Verma",
      "department": "CE"
    },
    {
      "id": "F32",
      "name": "Dr. Sameer Khuntia",
      "department": "CE"
    },
    {
      "id": "F33",
      "name": "Dr. Rekha Pillai",
      "department": "CE"
    },
    {
      "id": "F34",
      "name": "Dr. Varun Acharya",
      "department": "CE"
    },
    {
      "id": "F35",
      "name": "Dr. Bhavna Saxena",
      "department": "CE"
    },
    {
      "id": "F36",
      "name": "Dr. Ashok Mahapatra",
      "department": "HSS"
    },
    {
      "id": "F37",
      "name": "Prof. Shreya Kapoor (Dean)",
      "department": "ADMIN"
    },
    {
      "id": "F38",
      "name": "Dr. Imran Qureshi",
      "department": "HSS"
    },
    {
      "id": "F39",
      "name": "Dr. Radhika Hegde",
      "department": "HSS"
    },
    {
      "id": "F40",
      "name": "Dr. Om Prakash Sahu",
      "department": "HSS"
    }
  ],
  "student_groups": [
    {
      "id": "Y1-A",
      "name": "B.Tech Year 1, Section A",
      "year": 1,
      "department": "COMMON",
      "size": 90,
      "needs_accessible": false
    },
    {
      "id": "Y1-B",
      "name": "B.Tech Year 1, Section B",
      "year": 1,
      "department": "COMMON",
      "size": 90,
      "needs_accessible": false
    },
    {
      "id": "Y1-C",
      "name": "B.Tech Year 1, Section C",
      "year": 1,
      "department": "COMMON",
      "size": 90,
      "needs_accessible": false
    },
    {
      "id": "Y1-D",
      "name": "B.Tech Year 1, Section D",
      "year": 1,
      "department": "COMMON",
      "size": 90,
      "needs_accessible": false
    },
    {
      "id": "CSE-2",
      "name": "CSE Year 2",
      "year": 2,
      "department": "CSE",
      "size": 80,
      "needs_accessible": false
    },
    {
      "id": "ECE-2",
      "name": "ECE Year 2",
      "year": 2,
      "department": "ECE",
      "size": 70,
      "needs_accessible": false
    },
    {
      "id": "EE-2",
      "name": "EE Year 2",
      "year": 2,
      "department": "EE",
      "size": 60,
      "needs_accessible": false
    },
    {
      "id": "ME-2",
      "name": "ME Year 2",
      "year": 2,
      "department": "ME",
      "size": 60,
      "needs_accessible": true
    },
    {
      "id": "CE-2",
      "name": "CE Year 2",
      "year": 2,
      "department": "CE",
      "size": 50,
      "needs_accessible": false
    },
    {
      "id": "CSE-3",
      "name": "CSE Year 3",
      "year": 3,
      "department": "CSE",
      "size": 75,
      "needs_accessible": false
    },
    {
      "id": "ECE-3",
      "name": "ECE Year 3",
      "year": 3,
      "department": "ECE",
      "size": 65,
      "needs_accessible": false
    },
    {
      "id": "EE-3",
      "name": "EE Year 3",
      "year": 3,
      "department": "EE",
      "size": 55,
      "needs_accessible": false
    },
    {
      "id": "ME-3",
      "name": "ME Year 3",
      "year": 3,
      "department": "ME",
      "size": 55,
      "needs_accessible": false
    },
    {
      "id": "CE-3",
      "name": "CE Year 3",
      "year": 3,
      "department": "CE",
      "size": 45,
      "needs_accessible": false
    }
  ],
  "courses": [
    {
      "id": "MA101",
      "title": "Calculus and Linear Algebra",
      "department": "MA",
      "year": 1,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 0
    },
    {
      "id": "PH101",
      "title": "Engineering Physics",
      "department": "PH",
      "year": 1,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "PH191",
      "title": "Physics Laboratory",
      "department": "PH",
      "year": 1,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "CS101",
      "title": "Programming in C",
      "department": "CSE",
      "year": 1,
      "lecture_hours": 2,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS191",
      "title": "Programming Laboratory",
      "department": "CSE",
      "year": 1,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "WS101",
      "title": "Engineering Workshop",
      "department": "ME",
      "year": 1,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "HS101",
      "title": "Communicative English",
      "department": "HSS",
      "year": 1,
      "lecture_hours": 2,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ID101",
      "title": "Introduction to Engineering",
      "department": "ADMIN",
      "year": 1,
      "lecture_hours": 1,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS201",
      "title": "Data Structures",
      "department": "CSE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS202",
      "title": "Discrete Mathematics",
      "department": "CSE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 0
    },
    {
      "id": "CS203",
      "title": "Digital Logic Design",
      "department": "CSE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS204",
      "title": "Object-Oriented Programming",
      "department": "CSE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS291",
      "title": "Data Structures Lab",
      "department": "CSE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "CS292",
      "title": "Digital Logic Lab",
      "department": "CSE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "EC201",
      "title": "Signals and Systems",
      "department": "ECE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 0
    },
    {
      "id": "EC202",
      "title": "Network Theory",
      "department": "ECE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EC203",
      "title": "Electronic Devices",
      "department": "ECE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EC204",
      "title": "Probability and Random Processes",
      "department": "ECE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EC291",
      "title": "Electronic Devices Lab",
      "department": "ECE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "EC292",
      "title": "Programming Lab",
      "department": "ECE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "EE201",
      "title": "Circuit Analysis",
      "department": "EE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 0
    },
    {
      "id": "EE202",
      "title": "Electrical Machines I",
      "department": "EE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EE203",
      "title": "Electrical Measurements",
      "department": "EE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EE204",
      "title": "Electromagnetic Fields",
      "department": "EE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EE291",
      "title": "Measurements Lab",
      "department": "EE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "EE292",
      "title": "Machines Lab",
      "department": "EE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "ME201",
      "title": "Engineering Thermodynamics",
      "department": "ME",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ME202",
      "title": "Mechanics of Solids",
      "department": "ME",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 0
    },
    {
      "id": "ME203",
      "title": "Kinematics of Machines",
      "department": "ME",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ME204",
      "title": "Manufacturing Processes",
      "department": "ME",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ME291",
      "title": "Workshop Practice II",
      "department": "ME",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "ME292",
      "title": "Materials Testing Lab",
      "department": "ME",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "CE201",
      "title": "Surveying",
      "department": "CE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CE202",
      "title": "Fluid Mechanics",
      "department": "CE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 0
    },
    {
      "id": "CE203",
      "title": "Strength of Materials",
      "department": "CE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CE204",
      "title": "Engineering Geology",
      "department": "CE",
      "year": 2,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CE291",
      "title": "Surveying Lab",
      "department": "CE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "CE292",
      "title": "Fluid Mechanics Lab",
      "department": "CE",
      "year": 2,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "HS201",
      "title": "Principles of Economics",
      "department": "HSS",
      "year": 2,
      "lecture_hours": 2,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS301",
      "title": "Operating Systems",
      "department": "CSE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS302",
      "title": "Database Systems",
      "department": "CSE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS303",
      "title": "Computer Networks",
      "department": "CSE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CS391",
      "title": "Systems Lab",
      "department": "CSE",
      "year": 3,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "EC301",
      "title": "Communication Systems",
      "department": "ECE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EC302",
      "title": "Digital Signal Processing",
      "department": "ECE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EC303",
      "title": "VLSI Design",
      "department": "ECE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EC391",
      "title": "Communication Lab",
      "department": "ECE",
      "year": 3,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "EE301",
      "title": "Power Systems",
      "department": "EE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EE302",
      "title": "Control Systems",
      "department": "EE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EE303",
      "title": "Power Electronics",
      "department": "EE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "EE391",
      "title": "Power Lab",
      "department": "EE",
      "year": 3,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "ME301",
      "title": "Heat Transfer",
      "department": "ME",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ME302",
      "title": "Machine Design",
      "department": "ME",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ME303",
      "title": "Fluid Machines",
      "department": "ME",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "ME391",
      "title": "Thermal Lab",
      "department": "ME",
      "year": 3,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "CE301",
      "title": "Structural Analysis",
      "department": "CE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CE302",
      "title": "Geotechnical Engineering",
      "department": "CE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CE303",
      "title": "Transportation Engineering",
      "department": "CE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "CE391",
      "title": "Structures Lab",
      "department": "CE",
      "year": 3,
      "lecture_hours": 0,
      "tutorial_hours": 0,
      "lab_blocks": 1
    },
    {
      "id": "OE301",
      "title": "Introduction to Finance",
      "department": "HSS",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "OE302",
      "title": "Data Visualisation",
      "department": "CSE",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    },
    {
      "id": "OE303",
      "title": "Technical Writing",
      "department": "HSS",
      "year": 3,
      "lecture_hours": 3,
      "tutorial_hours": 0,
      "lab_blocks": 0
    }
  ],
  "total_sessions": 189,
  "total_exams": 41,
  "total_bookings": 25
};

export const FALLBACK_SLOTS: TimetableSlot[] = [
  {
    "slot_id": 1,
    "session_id": "MA101-AB-L1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "groups": [
      "Y1-A",
      "Y1-B"
    ],
    "day": "Friday",
    "start_period": 2,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 2,
    "session_id": "MA101-AB-L2",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "groups": [
      "Y1-A",
      "Y1-B"
    ],
    "day": "Friday",
    "start_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 3,
    "session_id": "MA101-AB-L3",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "groups": [
      "Y1-A",
      "Y1-B"
    ],
    "day": "Thursday",
    "start_period": 1,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 4,
    "session_id": "MA101-CD-L1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "groups": [
      "Y1-C",
      "Y1-D"
    ],
    "day": "Thursday",
    "start_period": 5,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 5,
    "session_id": "MA101-CD-L2",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "groups": [
      "Y1-C",
      "Y1-D"
    ],
    "day": "Thursday",
    "start_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 6,
    "session_id": "MA101-CD-L3",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "groups": [
      "Y1-C",
      "Y1-D"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 7,
    "session_id": "MA101-A-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "groups": [
      "Y1-A"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 8,
    "session_id": "PH101-A-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "groups": [
      "Y1-A"
    ],
    "day": "Monday",
    "start_period": 7,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 9,
    "session_id": "PH101-A-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "groups": [
      "Y1-A"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 10,
    "session_id": "PH101-A-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "groups": [
      "Y1-A"
    ],
    "day": "Monday",
    "start_period": 4,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 11,
    "session_id": "PH191-A-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F23",
    "faculty_name": "Dr. Farah Khan",
    "groups": [
      "Y1-A"
    ],
    "day": "Friday",
    "start_period": 6,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab"
  },
  {
    "slot_id": 12,
    "session_id": "CS101-A-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "Y1-A"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 13,
    "session_id": "CS101-A-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "Y1-A"
    ],
    "day": "Monday",
    "start_period": 2,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 14,
    "session_id": "CS191-A-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F03",
    "faculty_name": "Dr. Kavya Iyer",
    "groups": [
      "Y1-A"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "CS-LAB-2",
    "room_name": "Computing Lab 2"
  },
  {
    "slot_id": 15,
    "session_id": "WS101-A-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F29",
    "faculty_name": "Dr. Priya Raman",
    "groups": [
      "Y1-A"
    ],
    "day": "Thursday",
    "start_period": 6,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 16,
    "session_id": "HS101-A-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-A"
    ],
    "day": "Tuesday",
    "start_period": 7,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 17,
    "session_id": "HS101-A-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-A"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 18,
    "session_id": "MA101-B-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "groups": [
      "Y1-B"
    ],
    "day": "Tuesday",
    "start_period": 7,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 19,
    "session_id": "PH101-B-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "groups": [
      "Y1-B"
    ],
    "day": "Tuesday",
    "start_period": 8,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 20,
    "session_id": "PH101-B-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "groups": [
      "Y1-B"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 21,
    "session_id": "PH101-B-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "groups": [
      "Y1-B"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 22,
    "session_id": "PH191-B-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F23",
    "faculty_name": "Dr. Farah Khan",
    "groups": [
      "Y1-B"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab"
  },
  {
    "slot_id": 23,
    "session_id": "CS101-B-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "Y1-B"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 24,
    "session_id": "CS101-B-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "Y1-B"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 25,
    "session_id": "CS191-B-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F03",
    "faculty_name": "Dr. Kavya Iyer",
    "groups": [
      "Y1-B"
    ],
    "day": "Monday",
    "start_period": 2,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1"
  },
  {
    "slot_id": 26,
    "session_id": "WS101-B-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F29",
    "faculty_name": "Dr. Priya Raman",
    "groups": [
      "Y1-B"
    ],
    "day": "Wednesday",
    "start_period": 6,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 27,
    "session_id": "HS101-B-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-B"
    ],
    "day": "Tuesday",
    "start_period": 3,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 28,
    "session_id": "HS101-B-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-B"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 29,
    "session_id": "MA101-C-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "groups": [
      "Y1-C"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 30,
    "session_id": "PH101-C-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "groups": [
      "Y1-C"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 31,
    "session_id": "PH101-C-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "groups": [
      "Y1-C"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 32,
    "session_id": "PH101-C-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "groups": [
      "Y1-C"
    ],
    "day": "Monday",
    "start_period": 2,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 33,
    "session_id": "PH191-C-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F24",
    "faculty_name": "Dr. Gaurav Jena",
    "groups": [
      "Y1-C"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab"
  },
  {
    "slot_id": 34,
    "session_id": "CS101-C-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "Y1-C"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 35,
    "session_id": "CS101-C-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "Y1-C"
    ],
    "day": "Monday",
    "start_period": 4,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 36,
    "session_id": "CS191-C-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F04",
    "faculty_name": "Dr. Sandeep Patnaik",
    "groups": [
      "Y1-C"
    ],
    "day": "Wednesday",
    "start_period": 6,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1"
  },
  {
    "slot_id": 37,
    "session_id": "WS101-C-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F30",
    "faculty_name": "Dr. Debashish Sethi",
    "groups": [
      "Y1-C"
    ],
    "day": "Thursday",
    "start_period": 2,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 38,
    "session_id": "HS101-C-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-C"
    ],
    "day": "Monday",
    "start_period": 7,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 39,
    "session_id": "HS101-C-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-C"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 40,
    "session_id": "MA101-D-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "groups": [
      "Y1-D"
    ],
    "day": "Wednesday",
    "start_period": 1,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 41,
    "session_id": "PH101-D-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "groups": [
      "Y1-D"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 42,
    "session_id": "PH101-D-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "groups": [
      "Y1-D"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 43,
    "session_id": "PH101-D-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "groups": [
      "Y1-D"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 44,
    "session_id": "PH191-D-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F24",
    "faculty_name": "Dr. Gaurav Jena",
    "groups": [
      "Y1-D"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab"
  },
  {
    "slot_id": 45,
    "session_id": "CS101-D-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "Y1-D"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 46,
    "session_id": "CS101-D-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "Y1-D"
    ],
    "day": "Monday",
    "start_period": 2,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 47,
    "session_id": "CS191-D-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F04",
    "faculty_name": "Dr. Sandeep Patnaik",
    "groups": [
      "Y1-D"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "CS-LAB-2",
    "room_name": "Computing Lab 2"
  },
  {
    "slot_id": 48,
    "session_id": "WS101-D-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F30",
    "faculty_name": "Dr. Debashish Sethi",
    "groups": [
      "Y1-D"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 49,
    "session_id": "HS101-D-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-D"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 50,
    "session_id": "HS101-D-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "groups": [
      "Y1-D"
    ],
    "day": "Monday",
    "start_period": 4,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 51,
    "session_id": "ID101-ALL-L1",
    "course_id": "ID101",
    "course_title": "Introduction to Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F37",
    "faculty_name": "Prof. Shreya Kapoor (Dean)",
    "groups": [
      "Y1-A",
      "Y1-B",
      "Y1-C",
      "Y1-D"
    ],
    "day": "Friday",
    "start_period": 3,
    "room_id": "AUD",
    "room_name": "Main Auditorium"
  },
  {
    "slot_id": 52,
    "session_id": "CS201-L1",
    "course_id": "CS201",
    "course_title": "Data Structures",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "CSE-2"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 53,
    "session_id": "CS201-L2",
    "course_id": "CS201",
    "course_title": "Data Structures",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "CSE-2"
    ],
    "day": "Thursday",
    "start_period": 8,
    "room_id": "CR-202",
    "room_name": "Classroom B-202"
  },
  {
    "slot_id": 54,
    "session_id": "CS201-L3",
    "course_id": "CS201",
    "course_title": "Data Structures",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "groups": [
      "CSE-2"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "CR-202",
    "room_name": "Classroom B-202"
  },
  {
    "slot_id": 55,
    "session_id": "CS202-L1",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-2"
    ],
    "day": "Wednesday",
    "start_period": 4,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 56,
    "session_id": "CS202-L2",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-2"
    ],
    "day": "Wednesday",
    "start_period": 3,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 57,
    "session_id": "CS202-L3",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-2"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 58,
    "session_id": "CS202-T1",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-2"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 59,
    "session_id": "CS203-L1",
    "course_id": "CS203",
    "course_title": "Digital Logic Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "groups": [
      "CSE-2"
    ],
    "day": "Tuesday",
    "start_period": 8,
    "room_id": "CR-203",
    "room_name": "Classroom B-203"
  },
  {
    "slot_id": 60,
    "session_id": "CS203-L2",
    "course_id": "CS203",
    "course_title": "Digital Logic Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "groups": [
      "CSE-2"
    ],
    "day": "Wednesday",
    "start_period": 8,
    "room_id": "CR-203",
    "room_name": "Classroom B-203"
  },
  {
    "slot_id": 61,
    "session_id": "CS203-L3",
    "course_id": "CS203",
    "course_title": "Digital Logic Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "groups": [
      "CSE-2"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "CR-104",
    "room_name": "Classroom A-104"
  },
  {
    "slot_id": 62,
    "session_id": "CS204-L1",
    "course_id": "CS204",
    "course_title": "Object-Oriented Programming",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F08",
    "faculty_name": "Prof. Vikram Rao (Visiting)",
    "groups": [
      "CSE-2"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "CR-203",
    "room_name": "Classroom B-203"
  },
  {
    "slot_id": 63,
    "session_id": "CS204-L2",
    "course_id": "CS204",
    "course_title": "Object-Oriented Programming",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F08",
    "faculty_name": "Prof. Vikram Rao (Visiting)",
    "groups": [
      "CSE-2"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "CR-104",
    "room_name": "Classroom A-104"
  },
  {
    "slot_id": 64,
    "session_id": "CS204-L3",
    "course_id": "CS204",
    "course_title": "Object-Oriented Programming",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F08",
    "faculty_name": "Prof. Vikram Rao (Visiting)",
    "groups": [
      "CSE-2"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "CR-103",
    "room_name": "Classroom A-103"
  },
  {
    "slot_id": 65,
    "session_id": "CS291-P1",
    "course_id": "CS291",
    "course_title": "Data Structures Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F03",
    "faculty_name": "Dr. Kavya Iyer",
    "groups": [
      "CSE-2"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1"
  },
  {
    "slot_id": 66,
    "session_id": "CS292-P1",
    "course_id": "CS292",
    "course_title": "Digital Logic Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "groups": [
      "CSE-2"
    ],
    "day": "Monday",
    "start_period": 2,
    "room_id": "ELEC-LAB-2",
    "room_name": "Electronics Lab 2"
  },
  {
    "slot_id": 67,
    "session_id": "EC201-L1",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-2"
    ],
    "day": "Thursday",
    "start_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 68,
    "session_id": "EC201-L2",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-2"
    ],
    "day": "Thursday",
    "start_period": 2,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 69,
    "session_id": "EC201-L3",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "CR-204",
    "room_name": "Classroom B-204"
  },
  {
    "slot_id": 70,
    "session_id": "EC201-T1",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "CR-203",
    "room_name": "Classroom B-203"
  },
  {
    "slot_id": 71,
    "session_id": "EC202-L1",
    "course_id": "EC202",
    "course_title": "Network Theory",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "groups": [
      "ECE-2"
    ],
    "day": "Thursday",
    "start_period": 1,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 72,
    "session_id": "EC202-L2",
    "course_id": "EC202",
    "course_title": "Network Theory",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "groups": [
      "ECE-2"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 73,
    "session_id": "EC202-L3",
    "course_id": "EC202",
    "course_title": "Network Theory",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "groups": [
      "ECE-2"
    ],
    "day": "Wednesday",
    "start_period": 1,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 74,
    "session_id": "EC203-L1",
    "course_id": "EC203",
    "course_title": "Electronic Devices",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "groups": [
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 4,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 75,
    "session_id": "EC203-L2",
    "course_id": "EC203",
    "course_title": "Electronic Devices",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "groups": [
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "CR-103",
    "room_name": "Classroom A-103"
  },
  {
    "slot_id": 76,
    "session_id": "EC203-L3",
    "course_id": "EC203",
    "course_title": "Electronic Devices",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "groups": [
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 2,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 77,
    "session_id": "EC204-L1",
    "course_id": "EC204",
    "course_title": "Probability and Random Processes",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "groups": [
      "ECE-2"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 78,
    "session_id": "EC204-L2",
    "course_id": "EC204",
    "course_title": "Probability and Random Processes",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "groups": [
      "ECE-2"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "CR-103",
    "room_name": "Classroom A-103"
  },
  {
    "slot_id": 79,
    "session_id": "EC204-L3",
    "course_id": "EC204",
    "course_title": "Probability and Random Processes",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "groups": [
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 80,
    "session_id": "EC291-P1",
    "course_id": "EC291",
    "course_title": "Electronic Devices Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "groups": [
      "ECE-2"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "ELEC-LAB-2",
    "room_name": "Electronics Lab 2"
  },
  {
    "slot_id": 81,
    "session_id": "EC292-P1",
    "course_id": "EC292",
    "course_title": "Programming Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "ECE-2"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1"
  },
  {
    "slot_id": 82,
    "session_id": "EE201-L1",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-2"
    ],
    "day": "Thursday",
    "start_period": 4,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 83,
    "session_id": "EE201-L2",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-2"
    ],
    "day": "Thursday",
    "start_period": 3,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 84,
    "session_id": "EE201-L3",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-2"
    ],
    "day": "Thursday",
    "start_period": 2,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 85,
    "session_id": "EE201-T1",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-2"
    ],
    "day": "Thursday",
    "start_period": 1,
    "room_id": "CR-203",
    "room_name": "Classroom B-203"
  },
  {
    "slot_id": 86,
    "session_id": "EE202-L1",
    "course_id": "EE202",
    "course_title": "Electrical Machines I",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "groups": [
      "EE-2"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 87,
    "session_id": "EE202-L2",
    "course_id": "EE202",
    "course_title": "Electrical Machines I",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "groups": [
      "EE-2"
    ],
    "day": "Wednesday",
    "start_period": 4,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 88,
    "session_id": "EE202-L3",
    "course_id": "EE202",
    "course_title": "Electrical Machines I",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "groups": [
      "EE-2"
    ],
    "day": "Wednesday",
    "start_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 89,
    "session_id": "EE203-L1",
    "course_id": "EE203",
    "course_title": "Electrical Measurements",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "groups": [
      "EE-2"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 90,
    "session_id": "EE203-L2",
    "course_id": "EE203",
    "course_title": "Electrical Measurements",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "groups": [
      "EE-2"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "CR-205",
    "room_name": "Classroom B-205"
  },
  {
    "slot_id": 91,
    "session_id": "EE203-L3",
    "course_id": "EE203",
    "course_title": "Electrical Measurements",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "groups": [
      "EE-2"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 92,
    "session_id": "EE204-L1",
    "course_id": "EE204",
    "course_title": "Electromagnetic Fields",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "groups": [
      "EE-2"
    ],
    "day": "Wednesday",
    "start_period": 1,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 93,
    "session_id": "EE204-L2",
    "course_id": "EE204",
    "course_title": "Electromagnetic Fields",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "groups": [
      "EE-2"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "CR-204",
    "room_name": "Classroom B-204"
  },
  {
    "slot_id": 94,
    "session_id": "EE204-L3",
    "course_id": "EE204",
    "course_title": "Electromagnetic Fields",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "groups": [
      "EE-2"
    ],
    "day": "Monday",
    "start_period": 7,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 95,
    "session_id": "EE291-P1",
    "course_id": "EE291",
    "course_title": "Measurements Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "groups": [
      "EE-2"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1"
  },
  {
    "slot_id": 96,
    "session_id": "EE292-P1",
    "course_id": "EE292",
    "course_title": "Machines Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F18",
    "faculty_name": "Dr. Manoj Tripathy",
    "groups": [
      "EE-2"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1"
  },
  {
    "slot_id": 97,
    "session_id": "ME201-L1",
    "course_id": "ME201",
    "course_title": "Engineering Thermodynamics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "groups": [
      "ME-2"
    ],
    "day": "Thursday",
    "start_period": 1,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 98,
    "session_id": "ME201-L2",
    "course_id": "ME201",
    "course_title": "Engineering Thermodynamics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 99,
    "session_id": "ME201-L3",
    "course_id": "ME201",
    "course_title": "Engineering Thermodynamics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 4,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 100,
    "session_id": "ME202-L1",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 6,
    "room_id": "CR-105",
    "room_name": "Classroom A-105"
  },
  {
    "slot_id": 101,
    "session_id": "ME202-L2",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 7,
    "room_id": "CR-105",
    "room_name": "Classroom A-105"
  },
  {
    "slot_id": 102,
    "session_id": "ME202-L3",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 3,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 103,
    "session_id": "ME202-T1",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 104,
    "session_id": "ME203-L1",
    "course_id": "ME203",
    "course_title": "Kinematics of Machines",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "groups": [
      "ME-2"
    ],
    "day": "Wednesday",
    "start_period": 1,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 105,
    "session_id": "ME203-L2",
    "course_id": "ME203",
    "course_title": "Kinematics of Machines",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "groups": [
      "ME-2"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 106,
    "session_id": "ME203-L3",
    "course_id": "ME203",
    "course_title": "Kinematics of Machines",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "groups": [
      "ME-2"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "CR-105",
    "room_name": "Classroom A-105"
  },
  {
    "slot_id": 107,
    "session_id": "ME204-L1",
    "course_id": "ME204",
    "course_title": "Manufacturing Processes",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "groups": [
      "ME-2"
    ],
    "day": "Monday",
    "start_period": 7,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 108,
    "session_id": "ME204-L2",
    "course_id": "ME204",
    "course_title": "Manufacturing Processes",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "groups": [
      "ME-2"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 109,
    "session_id": "ME204-L3",
    "course_id": "ME204",
    "course_title": "Manufacturing Processes",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "groups": [
      "ME-2"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 110,
    "session_id": "ME291-P1",
    "course_id": "ME291",
    "course_title": "Workshop Practice II",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "groups": [
      "ME-2"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 111,
    "session_id": "ME292-P1",
    "course_id": "ME292",
    "course_title": "Materials Testing Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F29",
    "faculty_name": "Dr. Priya Raman",
    "groups": [
      "ME-2"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 112,
    "session_id": "CE201-L1",
    "course_id": "CE201",
    "course_title": "Surveying",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "groups": [
      "CE-2"
    ],
    "day": "Monday",
    "start_period": 7,
    "room_id": "CR-205",
    "room_name": "Classroom B-205"
  },
  {
    "slot_id": 113,
    "session_id": "CE201-L2",
    "course_id": "CE201",
    "course_title": "Surveying",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "groups": [
      "CE-2"
    ],
    "day": "Thursday",
    "start_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 114,
    "session_id": "CE201-L3",
    "course_id": "CE201",
    "course_title": "Surveying",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "groups": [
      "CE-2"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 115,
    "session_id": "CE202-L1",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-2"
    ],
    "day": "Wednesday",
    "start_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 116,
    "session_id": "CE202-L2",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-2"
    ],
    "day": "Friday",
    "start_period": 1,
    "room_id": "CR-103",
    "room_name": "Classroom A-103"
  },
  {
    "slot_id": 117,
    "session_id": "CE202-L3",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-2"
    ],
    "day": "Wednesday",
    "start_period": 2,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 118,
    "session_id": "CE202-T1",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "tutorial",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-2"
    ],
    "day": "Friday",
    "start_period": 2,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 119,
    "session_id": "CE203-L1",
    "course_id": "CE203",
    "course_title": "Strength of Materials",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "groups": [
      "CE-2"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 120,
    "session_id": "CE203-L2",
    "course_id": "CE203",
    "course_title": "Strength of Materials",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "groups": [
      "CE-2"
    ],
    "day": "Wednesday",
    "start_period": 4,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 121,
    "session_id": "CE203-L3",
    "course_id": "CE203",
    "course_title": "Strength of Materials",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "groups": [
      "CE-2"
    ],
    "day": "Monday",
    "start_period": 8,
    "room_id": "CR-205",
    "room_name": "Classroom B-205"
  },
  {
    "slot_id": 122,
    "session_id": "CE204-L1",
    "course_id": "CE204",
    "course_title": "Engineering Geology",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "groups": [
      "CE-2"
    ],
    "day": "Wednesday",
    "start_period": 3,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 123,
    "session_id": "CE204-L2",
    "course_id": "CE204",
    "course_title": "Engineering Geology",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "groups": [
      "CE-2"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "CR-102",
    "room_name": "Classroom A-102"
  },
  {
    "slot_id": 124,
    "session_id": "CE204-L3",
    "course_id": "CE204",
    "course_title": "Engineering Geology",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "groups": [
      "CE-2"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 125,
    "session_id": "CE291-P1",
    "course_id": "CE291",
    "course_title": "Surveying Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "groups": [
      "CE-2"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "CIVIL-LAB",
    "room_name": "Civil Engineering Lab"
  },
  {
    "slot_id": 126,
    "session_id": "CE292-P1",
    "course_id": "CE292",
    "course_title": "Fluid Mechanics Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F35",
    "faculty_name": "Dr. Bhavna Saxena",
    "groups": [
      "CE-2"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "CIVIL-LAB",
    "room_name": "Civil Engineering Lab"
  },
  {
    "slot_id": 127,
    "session_id": "HS201-H1-L1",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "groups": [
      "CSE-2",
      "ECE-2"
    ],
    "day": "Wednesday",
    "start_period": 7,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 128,
    "session_id": "HS201-H2-L1",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "groups": [
      "EE-2",
      "ME-2",
      "CE-2"
    ],
    "day": "Friday",
    "start_period": 6,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 129,
    "session_id": "HS201-H1-L2",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "groups": [
      "CSE-2",
      "ECE-2"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 130,
    "session_id": "HS201-H2-L2",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "groups": [
      "EE-2",
      "ME-2",
      "CE-2"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2"
  },
  {
    "slot_id": 131,
    "session_id": "CS301-L1",
    "course_id": "CS301",
    "course_title": "Operating Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 7,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 132,
    "session_id": "CS301-L2",
    "course_id": "CS301",
    "course_title": "Operating Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 133,
    "session_id": "CS301-L3",
    "course_id": "CS301",
    "course_title": "Operating Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 134,
    "session_id": "CS302-L1",
    "course_id": "CS302",
    "course_title": "Database Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 135,
    "session_id": "CS302-L2",
    "course_id": "CS302",
    "course_title": "Database Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 3,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 136,
    "session_id": "CS302-L3",
    "course_id": "CS302",
    "course_title": "Database Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 137,
    "session_id": "CS303-L1",
    "course_id": "CS303",
    "course_title": "Computer Networks",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-3"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 138,
    "session_id": "CS303-L2",
    "course_id": "CS303",
    "course_title": "Computer Networks",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-3"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  },
  {
    "slot_id": 139,
    "session_id": "CS303-L3",
    "course_id": "CS303",
    "course_title": "Computer Networks",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "groups": [
      "CSE-3"
    ],
    "day": "Monday",
    "start_period": 4,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 140,
    "session_id": "CS391-P1",
    "course_id": "CS391",
    "course_title": "Systems Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F04",
    "faculty_name": "Dr. Sandeep Patnaik",
    "groups": [
      "CSE-3"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1"
  },
  {
    "slot_id": 141,
    "session_id": "EC301-L1",
    "course_id": "EC301",
    "course_title": "Communication Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 7,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 142,
    "session_id": "EC301-L2",
    "course_id": "EC301",
    "course_title": "Communication Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 143,
    "session_id": "EC301-L3",
    "course_id": "EC301",
    "course_title": "Communication Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 144,
    "session_id": "EC302-L1",
    "course_id": "EC302",
    "course_title": "Digital Signal Processing",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 145,
    "session_id": "EC302-L2",
    "course_id": "EC302",
    "course_title": "Digital Signal Processing",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 146,
    "session_id": "EC302-L3",
    "course_id": "EC302",
    "course_title": "Digital Signal Processing",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 147,
    "session_id": "EC303-L1",
    "course_id": "EC303",
    "course_title": "VLSI Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "groups": [
      "ECE-3"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 148,
    "session_id": "EC303-L2",
    "course_id": "EC303",
    "course_title": "VLSI Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "groups": [
      "ECE-3"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "CR-202",
    "room_name": "Classroom B-202"
  },
  {
    "slot_id": 149,
    "session_id": "EC303-L3",
    "course_id": "EC303",
    "course_title": "VLSI Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "groups": [
      "ECE-3"
    ],
    "day": "Monday",
    "start_period": 4,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 150,
    "session_id": "EC391-P1",
    "course_id": "EC391",
    "course_title": "Communication Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F13",
    "faculty_name": "Dr. Ritu Sharma",
    "groups": [
      "ECE-3"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "ELEC-LAB-2",
    "room_name": "Electronics Lab 2"
  },
  {
    "slot_id": 151,
    "session_id": "EE301-L1",
    "course_id": "EE301",
    "course_title": "Power Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-3"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 152,
    "session_id": "EE301-L2",
    "course_id": "EE301",
    "course_title": "Power Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-3"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 153,
    "session_id": "EE301-L3",
    "course_id": "EE301",
    "course_title": "Power Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "groups": [
      "EE-3"
    ],
    "day": "Wednesday",
    "start_period": 5,
    "room_id": "CR-205",
    "room_name": "Classroom B-205"
  },
  {
    "slot_id": 154,
    "session_id": "EE302-L1",
    "course_id": "EE302",
    "course_title": "Control Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "groups": [
      "EE-3"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 155,
    "session_id": "EE302-L2",
    "course_id": "EE302",
    "course_title": "Control Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "groups": [
      "EE-3"
    ],
    "day": "Tuesday",
    "start_period": 3,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 156,
    "session_id": "EE302-L3",
    "course_id": "EE302",
    "course_title": "Control Systems",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "groups": [
      "EE-3"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 157,
    "session_id": "EE303-L1",
    "course_id": "EE303",
    "course_title": "Power Electronics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "groups": [
      "EE-3"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 158,
    "session_id": "EE303-L2",
    "course_id": "EE303",
    "course_title": "Power Electronics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "groups": [
      "EE-3"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4"
  },
  {
    "slot_id": 159,
    "session_id": "EE303-L3",
    "course_id": "EE303",
    "course_title": "Power Electronics",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "groups": [
      "EE-3"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "CR-203",
    "room_name": "Classroom B-203"
  },
  {
    "slot_id": 160,
    "session_id": "EE391-P1",
    "course_id": "EE391",
    "course_title": "Power Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F18",
    "faculty_name": "Dr. Manoj Tripathy",
    "groups": [
      "EE-3"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1"
  },
  {
    "slot_id": 161,
    "session_id": "ME301-L1",
    "course_id": "ME301",
    "course_title": "Heat Transfer",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 7,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 162,
    "session_id": "ME301-L2",
    "course_id": "ME301",
    "course_title": "Heat Transfer",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 163,
    "session_id": "ME301-L3",
    "course_id": "ME301",
    "course_title": "Heat Transfer",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 164,
    "session_id": "ME302-L1",
    "course_id": "ME302",
    "course_title": "Machine Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 165,
    "session_id": "ME302-L2",
    "course_id": "ME302",
    "course_title": "Machine Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 3,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 166,
    "session_id": "ME302-L3",
    "course_id": "ME302",
    "course_title": "Machine Design",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 167,
    "session_id": "ME303-L1",
    "course_id": "ME303",
    "course_title": "Fluid Machines",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "groups": [
      "ME-3"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 168,
    "session_id": "ME303-L2",
    "course_id": "ME303",
    "course_title": "Fluid Machines",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "groups": [
      "ME-3"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3"
  },
  {
    "slot_id": 169,
    "session_id": "ME303-L3",
    "course_id": "ME303",
    "course_title": "Fluid Machines",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "groups": [
      "ME-3"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "CR-204",
    "room_name": "Classroom B-204"
  },
  {
    "slot_id": 170,
    "session_id": "ME391-P1",
    "course_id": "ME391",
    "course_title": "Thermal Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F30",
    "faculty_name": "Dr. Debashish Sethi",
    "groups": [
      "ME-3"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop"
  },
  {
    "slot_id": 171,
    "session_id": "CE301-L1",
    "course_id": "CE301",
    "course_title": "Structural Analysis",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 6,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 172,
    "session_id": "CE301-L2",
    "course_id": "CE301",
    "course_title": "Structural Analysis",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 5,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 173,
    "session_id": "CE301-L3",
    "course_id": "CE301",
    "course_title": "Structural Analysis",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 4,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 174,
    "session_id": "CE302-L1",
    "course_id": "CE302",
    "course_title": "Geotechnical Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 7,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 175,
    "session_id": "CE302-L2",
    "course_id": "CE302",
    "course_title": "Geotechnical Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 2,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 176,
    "session_id": "CE302-L3",
    "course_id": "CE302",
    "course_title": "Geotechnical Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 8,
    "room_id": "CR-205",
    "room_name": "Classroom B-205"
  },
  {
    "slot_id": 177,
    "session_id": "CE303-L1",
    "course_id": "CE303",
    "course_title": "Transportation Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "groups": [
      "CE-3"
    ],
    "day": "Tuesday",
    "start_period": 1,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 178,
    "session_id": "CE303-L2",
    "course_id": "CE303",
    "course_title": "Transportation Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "groups": [
      "CE-3"
    ],
    "day": "Monday",
    "start_period": 5,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 179,
    "session_id": "CE303-L3",
    "course_id": "CE303",
    "course_title": "Transportation Engineering",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "groups": [
      "CE-3"
    ],
    "day": "Monday",
    "start_period": 1,
    "room_id": "CR-205",
    "room_name": "Classroom B-205"
  },
  {
    "slot_id": 180,
    "session_id": "CE391-P1",
    "course_id": "CE391",
    "course_title": "Structures Lab",
    "kind": "lab",
    "duration": 3,
    "faculty_id": "F35",
    "faculty_name": "Dr. Bhavna Saxena",
    "groups": [
      "CE-3"
    ],
    "day": "Monday",
    "start_period": 6,
    "room_id": "CIVIL-LAB",
    "room_name": "Civil Engineering Lab"
  },
  {
    "slot_id": 181,
    "session_id": "OE301-L1",
    "course_id": "OE301",
    "course_title": "Introduction to Finance",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F39",
    "faculty_name": "Dr. Radhika Hegde",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 182,
    "session_id": "OE301-L2",
    "course_id": "OE301",
    "course_title": "Introduction to Finance",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F39",
    "faculty_name": "Dr. Radhika Hegde",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Friday",
    "start_period": 8,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 183,
    "session_id": "OE301-L3",
    "course_id": "OE301",
    "course_title": "Introduction to Finance",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F39",
    "faculty_name": "Dr. Radhika Hegde",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Friday",
    "start_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 184,
    "session_id": "OE302-L1",
    "course_id": "OE302",
    "course_title": "Data Visualisation",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 185,
    "session_id": "OE302-L2",
    "course_id": "OE302",
    "course_title": "Data Visualisation",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Friday",
    "start_period": 8,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5"
  },
  {
    "slot_id": 186,
    "session_id": "OE302-L3",
    "course_id": "OE302",
    "course_title": "Data Visualisation",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Friday",
    "start_period": 3,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6"
  },
  {
    "slot_id": 187,
    "session_id": "OE303-L1",
    "course_id": "OE303",
    "course_title": "Technical Writing",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F40",
    "faculty_name": "Dr. Om Prakash Sahu",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Monday",
    "start_period": 3,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1"
  },
  {
    "slot_id": 188,
    "session_id": "OE303-L2",
    "course_id": "OE303",
    "course_title": "Technical Writing",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F40",
    "faculty_name": "Dr. Om Prakash Sahu",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Friday",
    "start_period": 8,
    "room_id": "CR-101",
    "room_name": "Classroom A-101"
  },
  {
    "slot_id": 189,
    "session_id": "OE303-L3",
    "course_id": "OE303",
    "course_title": "Technical Writing",
    "kind": "lecture",
    "duration": 1,
    "faculty_id": "F40",
    "faculty_name": "Dr. Om Prakash Sahu",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "day": "Friday",
    "start_period": 3,
    "room_id": "CR-201",
    "room_name": "Classroom B-201"
  }
];

export const FALLBACK_EXAMS: ExamItem[] = [
  {
    "id": "EX-MA101",
    "exam_id": "EX-MA101",
    "course_ids": [
      "MA101"
    ],
    "groups": [
      "Y1-A",
      "Y1-B",
      "Y1-C",
      "Y1-D"
    ],
    "size": 360,
    "duration_hours": 2,
    "day": "WED",
    "session": "AM",
    "rooms": [
      "LH-1",
      "LH-2",
      "CR-103",
      "CR-201",
      "CR-202",
      "SH-1"
    ]
  },
  {
    "id": "EX-PH101",
    "exam_id": "EX-PH101",
    "course_ids": [
      "PH101"
    ],
    "groups": [
      "Y1-A",
      "Y1-B",
      "Y1-C",
      "Y1-D"
    ],
    "size": 360,
    "duration_hours": 2,
    "day": "SAT",
    "session": "PM",
    "rooms": [
      "AUD",
      "LH-6",
      "CR-103",
      "CR-204"
    ]
  },
  {
    "id": "EX-CS101",
    "exam_id": "EX-CS101",
    "course_ids": [
      "CS101"
    ],
    "groups": [
      "Y1-A",
      "Y1-B",
      "Y1-C",
      "Y1-D"
    ],
    "size": 360,
    "duration_hours": 2,
    "day": "MON",
    "session": "PM",
    "rooms": [
      "AUD",
      "CR-201",
      "CR-202",
      "CR-205"
    ]
  },
  {
    "id": "EX-HS101",
    "exam_id": "EX-HS101",
    "course_ids": [
      "HS101"
    ],
    "groups": [
      "Y1-A",
      "Y1-B",
      "Y1-C",
      "Y1-D"
    ],
    "size": 360,
    "duration_hours": 2,
    "day": "TUE",
    "session": "PM",
    "rooms": [
      "LH-1",
      "LH-2",
      "CR-105",
      "CR-203",
      "SH-1",
      "SH-2"
    ]
  },
  {
    "id": "EX-CS201",
    "exam_id": "EX-CS201",
    "course_ids": [
      "CS201"
    ],
    "groups": [
      "CSE-2"
    ],
    "size": 80,
    "duration_hours": 2,
    "day": "WED",
    "session": "AM",
    "rooms": [
      "CR-101",
      "CR-104"
    ]
  },
  {
    "id": "EX-CS202",
    "exam_id": "EX-CS202",
    "course_ids": [
      "CS202"
    ],
    "groups": [
      "CSE-2"
    ],
    "size": 80,
    "duration_hours": 2,
    "day": "TUE",
    "session": "PM",
    "rooms": [
      "AUD"
    ]
  },
  {
    "id": "EX-CS203",
    "exam_id": "EX-CS203",
    "course_ids": [
      "CS203"
    ],
    "groups": [
      "CSE-2"
    ],
    "size": 80,
    "duration_hours": 2,
    "day": "THU",
    "session": "AM",
    "rooms": [
      "LH-2",
      "CR-204"
    ]
  },
  {
    "id": "EX-CS204",
    "exam_id": "EX-CS204",
    "course_ids": [
      "CS204"
    ],
    "groups": [
      "CSE-2"
    ],
    "size": 80,
    "duration_hours": 2,
    "day": "SAT",
    "session": "PM",
    "rooms": [
      "LH-2"
    ]
  },
  {
    "id": "EX-EC201",
    "exam_id": "EX-EC201",
    "course_ids": [
      "EC201"
    ],
    "groups": [
      "ECE-2"
    ],
    "size": 70,
    "duration_hours": 2,
    "day": "WED",
    "session": "AM",
    "rooms": [
      "LH-4",
      "LH-5"
    ]
  },
  {
    "id": "EX-EC202",
    "exam_id": "EX-EC202",
    "course_ids": [
      "EC202"
    ],
    "groups": [
      "ECE-2"
    ],
    "size": 70,
    "duration_hours": 2,
    "day": "SAT",
    "session": "PM",
    "rooms": [
      "LH-3",
      "CR-201"
    ]
  },
  {
    "id": "EX-EC203",
    "exam_id": "EX-EC203",
    "course_ids": [
      "EC203"
    ],
    "groups": [
      "ECE-2"
    ],
    "size": 70,
    "duration_hours": 2,
    "day": "FRI",
    "session": "AM",
    "rooms": [
      "LH-2"
    ]
  },
  {
    "id": "EX-EC204",
    "exam_id": "EX-EC204",
    "course_ids": [
      "EC204"
    ],
    "groups": [
      "ECE-2"
    ],
    "size": 70,
    "duration_hours": 2,
    "day": "THU",
    "session": "AM",
    "rooms": [
      "LH-1"
    ]
  },
  {
    "id": "EX-EE201",
    "exam_id": "EX-EE201",
    "course_ids": [
      "EE201"
    ],
    "groups": [
      "EE-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "THU",
    "session": "AM",
    "rooms": [
      "AUD"
    ]
  },
  {
    "id": "EX-EE202",
    "exam_id": "EX-EE202",
    "course_ids": [
      "EE202"
    ],
    "groups": [
      "EE-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "TUE",
    "session": "PM",
    "rooms": [
      "CR-103",
      "CR-104"
    ]
  },
  {
    "id": "EX-EE203",
    "exam_id": "EX-EE203",
    "course_ids": [
      "EE203"
    ],
    "groups": [
      "EE-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "SAT",
    "session": "AM",
    "rooms": [
      "LH-3"
    ]
  },
  {
    "id": "EX-EE204",
    "exam_id": "EX-EE204",
    "course_ids": [
      "EE204"
    ],
    "groups": [
      "EE-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "WED",
    "session": "AM",
    "rooms": [
      "LH-3"
    ]
  },
  {
    "id": "EX-ME201",
    "exam_id": "EX-ME201",
    "course_ids": [
      "ME201"
    ],
    "groups": [
      "ME-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "FRI",
    "session": "PM",
    "rooms": [
      "LH-1"
    ]
  },
  {
    "id": "EX-ME202",
    "exam_id": "EX-ME202",
    "course_ids": [
      "ME202"
    ],
    "groups": [
      "ME-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "TUE",
    "session": "PM",
    "rooms": [
      "CR-101",
      "CR-205"
    ]
  },
  {
    "id": "EX-ME203",
    "exam_id": "EX-ME203",
    "course_ids": [
      "ME203"
    ],
    "groups": [
      "ME-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "THU",
    "session": "PM",
    "rooms": [
      "LH-4"
    ]
  },
  {
    "id": "EX-ME204",
    "exam_id": "EX-ME204",
    "course_ids": [
      "ME204"
    ],
    "groups": [
      "ME-2"
    ],
    "size": 60,
    "duration_hours": 2,
    "day": "SAT",
    "session": "PM",
    "rooms": [
      "LH-5"
    ]
  },
  {
    "id": "EX-CE201",
    "exam_id": "EX-CE201",
    "course_ids": [
      "CE201"
    ],
    "groups": [
      "CE-2"
    ],
    "size": 50,
    "duration_hours": 2,
    "day": "SAT",
    "session": "PM",
    "rooms": [
      "CR-105",
      "CR-205"
    ]
  },
  {
    "id": "EX-CE202",
    "exam_id": "EX-CE202",
    "course_ids": [
      "CE202"
    ],
    "groups": [
      "CE-2"
    ],
    "size": 50,
    "duration_hours": 2,
    "day": "TUE",
    "session": "PM",
    "rooms": [
      "LH-4"
    ]
  },
  {
    "id": "EX-CE203",
    "exam_id": "EX-CE203",
    "course_ids": [
      "CE203"
    ],
    "groups": [
      "CE-2"
    ],
    "size": 50,
    "duration_hours": 2,
    "day": "FRI",
    "session": "PM",
    "rooms": [
      "AUD"
    ]
  },
  {
    "id": "EX-CE204",
    "exam_id": "EX-CE204",
    "course_ids": [
      "CE204"
    ],
    "groups": [
      "CE-2"
    ],
    "size": 50,
    "duration_hours": 2,
    "day": "WED",
    "session": "PM",
    "rooms": [
      "SH-2"
    ]
  },
  {
    "id": "EX-HS201",
    "exam_id": "EX-HS201",
    "course_ids": [
      "HS201"
    ],
    "groups": [
      "CSE-2",
      "ECE-2",
      "EE-2",
      "ME-2",
      "CE-2"
    ],
    "size": 320,
    "duration_hours": 2,
    "day": "MON",
    "session": "AM",
    "rooms": [
      "AUD",
      "LH-6",
      "CR-101"
    ]
  },
  {
    "id": "EX-CS301",
    "exam_id": "EX-CS301",
    "course_ids": [
      "CS301"
    ],
    "groups": [
      "CSE-3"
    ],
    "size": 75,
    "duration_hours": 2,
    "day": "FRI",
    "session": "AM",
    "rooms": [
      "LH-1"
    ]
  },
  {
    "id": "EX-CS302",
    "exam_id": "EX-CS302",
    "course_ids": [
      "CS302"
    ],
    "groups": [
      "CSE-3"
    ],
    "size": 75,
    "duration_hours": 2,
    "day": "MON",
    "session": "AM",
    "rooms": [
      "LH-5",
      "CR-203"
    ]
  },
  {
    "id": "EX-CS303",
    "exam_id": "EX-CS303",
    "course_ids": [
      "CS303"
    ],
    "groups": [
      "CSE-3"
    ],
    "size": 75,
    "duration_hours": 2,
    "day": "TUE",
    "session": "AM",
    "rooms": [
      "LH-1"
    ]
  },
  {
    "id": "EX-EC301",
    "exam_id": "EX-EC301",
    "course_ids": [
      "EC301"
    ],
    "groups": [
      "ECE-3"
    ],
    "size": 65,
    "duration_hours": 2,
    "day": "FRI",
    "session": "AM",
    "rooms": [
      "AUD"
    ]
  },
  {
    "id": "EX-EC302",
    "exam_id": "EX-EC302",
    "course_ids": [
      "EC302"
    ],
    "groups": [
      "ECE-3"
    ],
    "size": 65,
    "duration_hours": 2,
    "day": "THU",
    "session": "AM",
    "rooms": [
      "SH-1",
      "SH-2"
    ]
  },
  {
    "id": "EX-EC303",
    "exam_id": "EX-EC303",
    "course_ids": [
      "EC303"
    ],
    "groups": [
      "ECE-3"
    ],
    "size": 65,
    "duration_hours": 2,
    "day": "TUE",
    "session": "PM",
    "rooms": [
      "LH-3",
      "LH-5"
    ]
  },
  {
    "id": "EX-EE301",
    "exam_id": "EX-EE301",
    "course_ids": [
      "EE301"
    ],
    "groups": [
      "EE-3"
    ],
    "size": 55,
    "duration_hours": 2,
    "day": "THU",
    "session": "PM",
    "rooms": [
      "AUD"
    ]
  },
  {
    "id": "EX-EE302",
    "exam_id": "EX-EE302",
    "course_ids": [
      "EE302"
    ],
    "groups": [
      "EE-3"
    ],
    "size": 55,
    "duration_hours": 2,
    "day": "SAT",
    "session": "AM",
    "rooms": [
      "CR-103",
      "CR-204"
    ]
  },
  {
    "id": "EX-EE303",
    "exam_id": "EX-EE303",
    "course_ids": [
      "EE303"
    ],
    "groups": [
      "EE-3"
    ],
    "size": 55,
    "duration_hours": 2,
    "day": "FRI",
    "session": "AM",
    "rooms": [
      "SH-1"
    ]
  },
  {
    "id": "EX-ME301",
    "exam_id": "EX-ME301",
    "course_ids": [
      "ME301"
    ],
    "groups": [
      "ME-3"
    ],
    "size": 55,
    "duration_hours": 2,
    "day": "SAT",
    "session": "PM",
    "rooms": [
      "CR-101",
      "CR-202"
    ]
  },
  {
    "id": "EX-ME302",
    "exam_id": "EX-ME302",
    "course_ids": [
      "ME302"
    ],
    "groups": [
      "ME-3"
    ],
    "size": 55,
    "duration_hours": 2,
    "day": "THU",
    "session": "PM",
    "rooms": [
      "SH-1"
    ]
  },
  {
    "id": "EX-ME303",
    "exam_id": "EX-ME303",
    "course_ids": [
      "ME303"
    ],
    "groups": [
      "ME-3"
    ],
    "size": 55,
    "duration_hours": 2,
    "day": "TUE",
    "session": "AM",
    "rooms": [
      "CR-104",
      "SH-2"
    ]
  },
  {
    "id": "EX-CE301",
    "exam_id": "EX-CE301",
    "course_ids": [
      "CE301"
    ],
    "groups": [
      "CE-3"
    ],
    "size": 45,
    "duration_hours": 2,
    "day": "TUE",
    "session": "AM",
    "rooms": [
      "AUD"
    ]
  },
  {
    "id": "EX-CE302",
    "exam_id": "EX-CE302",
    "course_ids": [
      "CE302"
    ],
    "groups": [
      "CE-3"
    ],
    "size": 45,
    "duration_hours": 2,
    "day": "THU",
    "session": "AM",
    "rooms": [
      "LH-6"
    ]
  },
  {
    "id": "EX-CE303",
    "exam_id": "EX-CE303",
    "course_ids": [
      "CE303"
    ],
    "groups": [
      "CE-3"
    ],
    "size": 45,
    "duration_hours": 2,
    "day": "MON",
    "session": "PM",
    "rooms": [
      "LH-6"
    ]
  },
  {
    "id": "EX-OE-BASKET",
    "exam_id": "EX-OE-BASKET",
    "course_ids": [
      "OE301",
      "OE302",
      "OE303"
    ],
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "size": 295,
    "duration_hours": 2,
    "day": "WED",
    "session": "AM",
    "rooms": [
      "AUD",
      "SH-2"
    ]
  }
];

export const FALLBACK_BOOKINGS: BookingItem[] = [
  {
    "id": "BR-01",
    "booking_id": "BR-01",
    "submitted_at": "2027-01-20T09:00:00+05:30",
    "requester": "Spectra Core Team",
    "role": "admin",
    "department": null,
    "requested_category": "institute_event",
    "title": "Spectra '27 Inauguration",
    "attendance": 450,
    "duration_periods": 2,
    "windows": [
      {
        "day": "MON",
        "from_period": 4,
        "to_period": 5
      }
    ],
    "room_types": [
      "auditorium"
    ],
    "needs": [
      "stage",
      "pa_system",
      "projector"
    ],
    "requested_room": "AUD",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Monday",
    "assigned_periods": [
      4,
      5
    ],
    "assigned_room": "AUD",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-02",
    "booking_id": "BR-02",
    "submitted_at": "2027-01-22T11:30:00+05:30",
    "requester": "Coding Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra Code Sprint (8-hour hackathon)",
    "attendance": 70,
    "duration_periods": 6,
    "windows": [
      {
        "day": "THU",
        "from_period": 6,
        "to_period": 13
      },
      {
        "day": "FRI",
        "from_period": 6,
        "to_period": 13
      }
    ],
    "room_types": [
      "lab_cs"
    ],
    "needs": [
      "computers"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Thursday",
    "assigned_periods": [
      6,
      7,
      8,
      9,
      10,
      11
    ],
    "assigned_room": "CS-LAB-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-03",
    "booking_id": "BR-03",
    "submitted_at": "2027-01-21T16:00:00+05:30",
    "requester": "Office of the Dean of Academics",
    "role": "faculty",
    "department": null,
    "requested_category": "guest_lecture",
    "title": "Talk: Building India's Navigation Satellites",
    "attendance": 300,
    "duration_periods": 2,
    "windows": [
      {
        "day": "WED",
        "from_period": 6,
        "to_period": 9
      }
    ],
    "room_types": [
      "auditorium",
      "lecture_hall"
    ],
    "needs": [
      "projector",
      "pa_system"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Wednesday",
    "assigned_periods": [
      6,
      7
    ],
    "assigned_room": "AUD",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-04",
    "booking_id": "BR-04",
    "submitted_at": "2027-01-25T10:05:00+05:30",
    "requester": "Robotics Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Line-follower robot workshop",
    "attendance": 60,
    "duration_periods": 3,
    "windows": [
      {
        "day": "TUE",
        "from_period": 10,
        "to_period": 13
      }
    ],
    "room_types": [
      "lab_elec",
      "seminar_hall"
    ],
    "needs": [
      "projector"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Tuesday",
    "assigned_periods": [
      10,
      11,
      12
    ],
    "assigned_room": "SH-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-05a",
    "booking_id": "BR-05a",
    "submitted_at": "2027-01-24T20:15:00+05:30",
    "requester": "Dance Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra dance rehearsal (MON)",
    "attendance": 40,
    "duration_periods": 2,
    "windows": [
      {
        "day": "MON",
        "from_period": 11,
        "to_period": 12
      }
    ],
    "room_types": [
      "outdoor",
      "seminar_hall"
    ],
    "needs": [],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Monday",
    "assigned_periods": [
      11,
      12
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-05b",
    "booking_id": "BR-05b",
    "submitted_at": "2027-01-24T20:15:00+05:30",
    "requester": "Dance Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra dance rehearsal (TUE)",
    "attendance": 40,
    "duration_periods": 2,
    "windows": [
      {
        "day": "TUE",
        "from_period": 11,
        "to_period": 12
      }
    ],
    "room_types": [
      "outdoor",
      "seminar_hall"
    ],
    "needs": [],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Tuesday",
    "assigned_periods": [
      11,
      12
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-05c",
    "booking_id": "BR-05c",
    "submitted_at": "2027-01-24T20:15:00+05:30",
    "requester": "Dance Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra dance rehearsal (WED)",
    "attendance": 40,
    "duration_periods": 2,
    "windows": [
      {
        "day": "WED",
        "from_period": 11,
        "to_period": 12
      }
    ],
    "room_types": [
      "outdoor",
      "seminar_hall"
    ],
    "needs": [],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Wednesday",
    "assigned_periods": [
      11,
      12
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-05d",
    "booking_id": "BR-05d",
    "submitted_at": "2027-01-24T20:15:00+05:30",
    "requester": "Dance Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra dance rehearsal (THU)",
    "attendance": 40,
    "duration_periods": 2,
    "windows": [
      {
        "day": "THU",
        "from_period": 11,
        "to_period": 12
      }
    ],
    "room_types": [
      "outdoor",
      "seminar_hall"
    ],
    "needs": [],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Thursday",
    "assigned_periods": [
      11,
      12
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-05e",
    "booking_id": "BR-05e",
    "submitted_at": "2027-01-24T20:15:00+05:30",
    "requester": "Dance Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra dance rehearsal (FRI)",
    "attendance": 40,
    "duration_periods": 2,
    "windows": [
      {
        "day": "FRI",
        "from_period": 11,
        "to_period": 12
      }
    ],
    "room_types": [
      "outdoor",
      "seminar_hall"
    ],
    "needs": [],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Friday",
    "assigned_periods": [
      11,
      12
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-06",
    "booking_id": "BR-06",
    "submitted_at": "2027-01-23T14:00:00+05:30",
    "requester": "Quiz Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra Quiz Prelims",
    "attendance": 140,
    "duration_periods": 2,
    "windows": [
      {
        "day": "THU",
        "from_period": 10,
        "to_period": 11
      }
    ],
    "room_types": [
      "seminar_hall",
      "auditorium",
      "lecture_hall"
    ],
    "needs": [
      "projector",
      "pa_system"
    ],
    "requested_room": "SH-1",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Thursday",
    "assigned_periods": [
      10,
      11
    ],
    "assigned_room": "SH-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-07",
    "booking_id": "BR-07",
    "submitted_at": "2027-01-26T09:45:00+05:30",
    "requester": "Dramatics Society",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Stage play: Andha Yug",
    "attendance": 130,
    "duration_periods": 3,
    "windows": [
      {
        "day": "THU",
        "from_period": 10,
        "to_period": 12
      }
    ],
    "room_types": [
      "seminar_hall",
      "auditorium"
    ],
    "needs": [
      "stage",
      "pa_system"
    ],
    "requested_room": "SH-1",
    "mandatory_for_groups": [],
    "status": "alternative",
    "assigned_day": null,
    "assigned_periods": [],
    "assigned_room": null,
    "rejection_reason": "Room SH-1 occupied by booking (BR-06) on THU period 10"
  },
  {
    "id": "BR-08",
    "booking_id": "BR-08",
    "submitted_at": "2027-01-24T12:00:00+05:30",
    "requester": "ECE Department",
    "role": "department_coordinator",
    "department": "ECE",
    "requested_category": "department_event",
    "title": "ECE alumni seminar",
    "attendance": 65,
    "duration_periods": 1,
    "windows": [
      {
        "day": "THU",
        "from_period": 8,
        "to_period": 8
      }
    ],
    "room_types": [
      "seminar_hall",
      "lecture_hall",
      "classroom"
    ],
    "needs": [
      "projector"
    ],
    "requested_room": null,
    "mandatory_for_groups": [
      "ECE-3"
    ],
    "status": "approved",
    "assigned_day": "Thursday",
    "assigned_periods": [
      8
    ],
    "assigned_room": "LH-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-09",
    "booking_id": "BR-09",
    "submitted_at": "2027-01-27T22:10:00+05:30",
    "requester": "Gaming Society",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Valorant LAN finals screening",
    "attendance": 1200,
    "duration_periods": 3,
    "windows": [
      {
        "day": "FRI",
        "from_period": 10,
        "to_period": 13
      }
    ],
    "room_types": [
      "auditorium",
      "outdoor"
    ],
    "needs": [
      "pa_system"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "reject",
    "assigned_day": null,
    "assigned_periods": [],
    "assigned_room": null,
    "rejection_reason": "Requested room and time slot unavailable due to schedule conflicts."
  },
  {
    "id": "BR-10",
    "booking_id": "BR-10",
    "submitted_at": "2027-01-28T10:00:00+05:30",
    "requester": "Photography Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra photo exhibition",
    "attendance": 80,
    "duration_periods": 9,
    "windows": [
      {
        "day": "FRI",
        "from_period": 1,
        "to_period": 9
      }
    ],
    "room_types": [
      "seminar_hall"
    ],
    "needs": [
      "accessible"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Friday",
    "assigned_periods": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    "assigned_room": "SH-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-11a",
    "booking_id": "BR-11a",
    "submitted_at": "2027-01-20T09:30:00+05:30",
    "requester": "Spectra Core Team",
    "role": "admin",
    "department": null,
    "requested_category": "institute_event",
    "title": "Robo-Wars arena (day 1)",
    "attendance": 600,
    "duration_periods": 4,
    "windows": [
      {
        "day": "THU",
        "from_period": 6,
        "to_period": 9
      }
    ],
    "room_types": [
      "outdoor"
    ],
    "needs": [
      "pa_system"
    ],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Thursday",
    "assigned_periods": [
      6,
      7,
      8,
      9
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-11b",
    "booking_id": "BR-11b",
    "submitted_at": "2027-01-20T09:30:00+05:30",
    "requester": "Spectra Core Team",
    "role": "admin",
    "department": null,
    "requested_category": "institute_event",
    "title": "Robo-Wars arena (day 2)",
    "attendance": 600,
    "duration_periods": 4,
    "windows": [
      {
        "day": "FRI",
        "from_period": 6,
        "to_period": 9
      }
    ],
    "room_types": [
      "outdoor"
    ],
    "needs": [
      "pa_system"
    ],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Friday",
    "assigned_periods": [
      6,
      7,
      8,
      9
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-12",
    "booking_id": "BR-12",
    "submitted_at": "2027-01-29T13:20:00+05:30",
    "requester": "E-Cell",
    "role": "club",
    "department": null,
    "requested_category": "guest_lecture",
    "title": "Founder talk",
    "attendance": 200,
    "duration_periods": 1,
    "windows": [
      {
        "day": "TUE",
        "from_period": 9,
        "to_period": 9
      }
    ],
    "room_types": [
      "lecture_hall",
      "auditorium"
    ],
    "needs": [
      "projector",
      "pa_system"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Tuesday",
    "assigned_periods": [
      9
    ],
    "assigned_room": "AUD",
    "rejection_reason": "Requested venue and window available with zero clashes. Note: Category adjusted to 'club_event' per role cap."
  },
  {
    "id": "BR-13",
    "booking_id": "BR-13",
    "submitted_at": "2027-01-25T17:00:00+05:30",
    "requester": "Training and Placement Cell",
    "role": "department_coordinator",
    "department": "CSE",
    "requested_category": "department_event",
    "title": "Pre-placement talk",
    "attendance": 75,
    "duration_periods": 2,
    "windows": [
      {
        "day": "WED",
        "from_period": 10,
        "to_period": 11
      }
    ],
    "room_types": [
      "lecture_hall",
      "classroom",
      "seminar_hall"
    ],
    "needs": [
      "projector"
    ],
    "requested_room": null,
    "mandatory_for_groups": [
      "CSE-3"
    ],
    "status": "approved",
    "assigned_day": "Wednesday",
    "assigned_periods": [
      10,
      11
    ],
    "assigned_room": "LH-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-14",
    "booking_id": "BR-14",
    "submitted_at": "2027-01-30T19:00:00+05:30",
    "requester": "Literary Society",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Spectra Open Mic",
    "attendance": 90,
    "duration_periods": 2,
    "windows": [
      {
        "day": "WED",
        "from_period": 11,
        "to_period": 12
      }
    ],
    "room_types": [
      "lecture_hall",
      "seminar_hall"
    ],
    "needs": [
      "pa_system"
    ],
    "requested_room": "LHC-5",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Wednesday",
    "assigned_periods": [
      11,
      12
    ],
    "assigned_room": "LH-2",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-15",
    "booking_id": "BR-15",
    "submitted_at": "2027-01-31T11:00:00+05:30",
    "requester": "Music Club",
    "role": "club",
    "department": null,
    "requested_category": "institute_event",
    "title": "Spectra Jam Night",
    "attendance": 300,
    "duration_periods": 3,
    "windows": [
      {
        "day": "FRI",
        "from_period": 10,
        "to_period": 12
      }
    ],
    "room_types": [
      "auditorium",
      "outdoor"
    ],
    "needs": [
      "stage",
      "pa_system"
    ],
    "requested_room": null,
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Friday",
    "assigned_periods": [
      10,
      11,
      12
    ],
    "assigned_room": "AUD",
    "rejection_reason": "Requested venue and window available with zero clashes. Note: Category adjusted to 'club_event' per role cap."
  },
  {
    "id": "BR-16",
    "booking_id": "BR-16",
    "submitted_at": "2027-02-02T10:00:00+05:30",
    "requester": "Spectra Core Team",
    "role": "admin",
    "department": null,
    "requested_category": "institute_event",
    "title": "Spectra Pro-Night",
    "attendance": 750,
    "duration_periods": 4,
    "windows": [
      {
        "day": "FRI",
        "from_period": 10,
        "to_period": 13
      }
    ],
    "room_types": [
      "outdoor"
    ],
    "needs": [
      "stage",
      "pa_system"
    ],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "alternative",
    "assigned_day": null,
    "assigned_periods": [],
    "assigned_room": null,
    "rejection_reason": "Room OAT occupied by booking (BR-05e) on FRI period 11"
  },
  {
    "id": "BR-17",
    "booking_id": "BR-17",
    "submitted_at": "2027-02-01T21:30:00+05:30",
    "requester": "Astronomy Club",
    "role": "club",
    "department": null,
    "requested_category": "club_event",
    "title": "Night sky watch",
    "attendance": 50,
    "duration_periods": 2,
    "windows": [
      {
        "day": "WED",
        "from_period": 13,
        "to_period": 14
      }
    ],
    "room_types": [
      "outdoor"
    ],
    "needs": [],
    "requested_room": "OAT",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Wednesday",
    "assigned_periods": [
      13,
      14
    ],
    "assigned_room": "OAT",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-18",
    "booking_id": "BR-18",
    "submitted_at": "2027-01-26T15:00:00+05:30",
    "requester": "Civil Engineering Department",
    "role": "department_coordinator",
    "department": "CE",
    "requested_category": "department_event",
    "title": "Bridge-building contest",
    "attendance": 45,
    "duration_periods": 3,
    "windows": [
      {
        "day": "TUE",
        "from_period": 6,
        "to_period": 9
      },
      {
        "day": "THU",
        "from_period": 6,
        "to_period": 9
      }
    ],
    "room_types": [
      "lab_civil",
      "workshop"
    ],
    "needs": [],
    "requested_room": null,
    "mandatory_for_groups": [
      "CE-3"
    ],
    "status": "approved",
    "assigned_day": "Thursday",
    "assigned_periods": [
      6,
      7,
      8
    ],
    "assigned_room": "CIVIL-LAB",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-19",
    "booking_id": "BR-19",
    "submitted_at": "2027-01-27T09:00:00+05:30",
    "requester": "Dr. Amit Behera (F12)",
    "role": "faculty",
    "department": "ECE",
    "requested_category": "guest_lecture",
    "title": "Industry talk: chip design careers",
    "attendance": 65,
    "duration_periods": 1,
    "windows": [
      {
        "day": "MON",
        "from_period": 9,
        "to_period": 9
      },
      {
        "day": "TUE",
        "from_period": 9,
        "to_period": 9
      },
      {
        "day": "WED",
        "from_period": 9,
        "to_period": 9
      }
    ],
    "room_types": [
      "classroom",
      "lecture_hall",
      "seminar_hall"
    ],
    "needs": [
      "projector"
    ],
    "requested_room": null,
    "mandatory_for_groups": [
      "ECE-3"
    ],
    "status": "approved",
    "assigned_day": "Monday",
    "assigned_periods": [
      9
    ],
    "assigned_room": "LH-1",
    "rejection_reason": "Requested venue and window available with zero clashes."
  },
  {
    "id": "BR-20",
    "booking_id": "BR-20",
    "submitted_at": "2027-01-20T10:00:00+05:30",
    "requester": "Spectra Core Team",
    "role": "admin",
    "department": null,
    "requested_category": "institute_event",
    "title": "Spectra closing ceremony",
    "attendance": 480,
    "duration_periods": 2,
    "windows": [
      {
        "day": "FRI",
        "from_period": 4,
        "to_period": 5
      }
    ],
    "room_types": [
      "auditorium"
    ],
    "needs": [
      "stage",
      "pa_system",
      "projector"
    ],
    "requested_room": "AUD",
    "mandatory_for_groups": [],
    "status": "approved",
    "assigned_day": "Friday",
    "assigned_periods": [
      4,
      5
    ],
    "assigned_room": "AUD",
    "rejection_reason": "Requested venue and window available with zero clashes."
  }
];

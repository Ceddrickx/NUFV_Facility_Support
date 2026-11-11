/* Locations. ID pattern <PREFIX>-<NN>-<ROOM>; QR payload "NUF-LOC:<id>".
   The rooms, floors, location groups and old-code aliases come from database/NU_Facility_Support_DB.xlsx (see
   tools/build-data.py): only the part between the GENERATED markers is rewritten by the converter. */
(function () {
  const App = (window.App = window.App || {});
  App.seed = App.seed || {};
  // Floors are numbers, except LG (lower ground) and UG (upper ground), which sit below floor 1.
  App.seed.floorLabel = (f) => (typeof f === 'number' ? `${f}${['th', 'st', 'nd', 'rd'][f] || 'th'} Floor` : String(f));
  App.seed.floorRank = (f) => ({ LG: -2, UG: -1 })[f] ?? Number(f);

  /* GENERATED:BEGIN locations */
  const LOCATION_KINDS = [
    {
      "value": "lecture-room",
      "label": "Lecture Room",
      "field": "Lecture Room"
    },
    {
      "value": "computer-laboratory",
      "label": "Computer Laboratory",
      "field": "Computer Laboratory"
    },
    {
      "value": "office",
      "label": "Office",
      "field": "Office"
    },
    {
      "value": "hallway",
      "label": "Hallway",
      "field": "Hallway"
    },
    {
      "value": "other-area",
      "label": "Other Area",
      "field": "Other Area"
    }
  ];
  const KIND_BY_TYPE = {
    "Classroom": "lecture-room",
    "Computer Laboratory": "computer-laboratory",
    "Office": "office",
    "Hallway": "hallway",
    "Restroom": "other-area",
    "Other": "other-area"
  };
  const BUILDING_FLOOR_LIST = {
    "NU Fairview Main Building": [
      "LG",
      "UG",
      1,
      2,
      3,
      4,
      5
    ],
    "NU Fairview 2nd Building": [
      1
    ]
  };
  const LOCATION_REMAP = {
    "OTH-LG-BEX": "OTH-LG-BULLDOGSEXCHAN",
    "OFC-UG-FMO1": "OFC-UG-FACILITIESMANA",
    "OFC-UG-FMO2": "OFC-UG-FACILITIESMANA",
    "OFC-01-110": "OFC-UG-FACILITIESMANA",
    "OFC-01-111": "OFC-01-104",
    "OFC-01-LRC": "OTH-01-103",
    "OFC-01-ADM": "OFC-01-102",
    "OFC-01-TRS": "OFC-01-106",
    "OTH-01-CAN": "OTH-01-101",
    "HLW-01-002": "OTH-01-101",
    "HLW-01-001": "OTH-01-101",
    "RST-01-M": "RST-01-CR",
    "RST-01-F": "RST-01-CR",
    "LAB-01-101": "LAB-04-423L",
    "RM-01-102": "RM-02-206",
    "RM-01-103": "RM-02-207",
    "LAB-02-201": "LAB-04-405L",
    "RM-02-202": "RM-02-202",
    "RM-02-203": "RM-02-203",
    "RM-02-204": "RM-02-205",
    "HLW-02-001": "RM-02-202",
    "RST-02-M": "RST-02-CR",
    "RST-02-F": "RST-02-CR",
    "RST-02-001": "RST-02-CR",
    "LAB-03-301": "LAB-04-402L",
    "RM-03-302": "RM-03-305",
    "RM-03-303": "RM-03-309",
    "LAB-03-A311": "LAB-04-418L",
    "RM-03-A312": "RM-03-311",
    "RM-03-A313": "RM-03-312",
    "HLW-03-001": "RM-03-310",
    "RST-03-M": "RST-03-CR",
    "RST-03-F": "RST-03-CR",
    "RM-04-401": "RM-04-404",
    "RM-04-402": "RM-04-406",
    "LAB-04-A411": "LAB-04-420L",
    "RM-04-A412": "RM-04-414",
    "RM-04-A413": "RM-04-415",
    "OFC-02-210": "OFC-04-411",
    "HLW-04-001": "RM-04-404",
    "RST-04-M": "RST-04-CR",
    "RST-04-F": "RST-04-CR",
    "RST-04-001": "RST-04-CR",
    "RM-05-A512": "RM-05-511",
    "RM-05-A513": "RM-05-502",
    "OTH-05-CFL": "OTH-05-MARIANOSCAFE",
    "HLW-05-001": "RM-05-502",
    "LAB-05-A511": "LAB-04-422L",
    "RST-05-M": "RST-05-CR",
    "RST-05-F": "RST-05-CR",
    "RM-01-A101": "RM-01-A101",
    "OTH-01-GYM": "OTH-01-PECOURT",
    "LAB-02-A201": "LAB-04-419L",
    "RST-01-AM": "RST-01-ACR",
    "RST-01-AF": "RST-01-ACR",
    "RST-02-AM": "RST-01-ACR",
    "RST-02-AF": "RST-01-ACR"
  };
  const LOCATIONS = [
    {
      "id": "OTH-LG-ISOLATIONROOM",
      "building": "NU Fairview Main Building",
      "floor": "LG",
      "room": "Isolation Room",
      "name": "Isolation Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-LG-ISOLATIONROOM"
    },
    {
      "id": "OTH-LG-SECURITYAREA",
      "building": "NU Fairview Main Building",
      "floor": "LG",
      "room": "Security Area",
      "name": "Security Area",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-LG-SECURITYAREA"
    },
    {
      "id": "OTH-LG-CONSTRUCTIONMA",
      "building": "NU Fairview Main Building",
      "floor": "LG",
      "room": "Construction Materials Room",
      "name": "Construction Materials Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-LG-CONSTRUCTIONMA"
    },
    {
      "id": "OTH-LG-UNIVERSALTESTI",
      "building": "NU Fairview Main Building",
      "floor": "LG",
      "room": "Universal Testing Machine Room",
      "name": "Universal Testing Machine Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-LG-UNIVERSALTESTI"
    },
    {
      "id": "OTH-LG-BULLDOGSEXCHAN",
      "building": "NU Fairview Main Building",
      "floor": "LG",
      "room": "Bulldogs Exchange",
      "name": "Bulldogs Exchange",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-LG-BULLDOGSEXCHAN"
    },
    {
      "id": "OFC-UG-ADMISSIONSANDM",
      "building": "NU Fairview Main Building",
      "floor": "UG",
      "room": "Admissions and Marketing Office (AMO)",
      "name": "Admissions and Marketing Office (AMO)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-UG-ADMISSIONSANDM"
    },
    {
      "id": "OFC-UG-FACILITIESMANA",
      "building": "NU Fairview Main Building",
      "floor": "UG",
      "room": "Facilities Management Office (FMO)",
      "name": "Facilities Management Office (FMO)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-UG-FACILITIESMANA"
    },
    {
      "id": "OTH-01-101",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "101",
      "name": "Room 101 - Canteen",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-101"
    },
    {
      "id": "OFC-01-102",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "102",
      "name": "Room 102 - Admissions",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-01-102"
    },
    {
      "id": "OTH-01-103",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "103",
      "name": "Room 103 - Learning Resource Center (LRC)",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-103"
    },
    {
      "id": "OFC-01-104",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "104",
      "name": "Room 104 - Registrar",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-01-104"
    },
    {
      "id": "OFC-01-106",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "106",
      "name": "Room 106 - Treasury",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-01-106"
    },
    {
      "id": "OTH-01-107",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "107",
      "name": "Room 107 - Function 1 & Function 2",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-107"
    },
    {
      "id": "OFC-01-108",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "108",
      "name": "Room 108 - Health Services Office (HSO)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-01-108"
    },
    {
      "id": "OTH-01-PECOURT",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "PE Court",
      "name": "PE Court",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-PECOURT"
    },
    {
      "id": "OTH-01-PRINTINGAREA",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "Printing Area",
      "name": "Printing Area",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-PRINTINGAREA"
    },
    {
      "id": "RST-01-CR",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "Restroom",
      "name": "1st Floor - Comfort Room (CR)",
      "type": "Restroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RST-01-CR"
    },
    {
      "id": "OTH-01-SPORTSEQUIPMEN",
      "building": "NU Fairview Main Building",
      "floor": 1,
      "room": "Sports Equipment",
      "name": "Sports Equipment",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-SPORTSEQUIPMEN"
    },
    {
      "id": "OTH-02-201",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "201",
      "name": "Room 201 - Electrical Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-02-201"
    },
    {
      "id": "RM-02-202",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "202",
      "name": "Room 202 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-202"
    },
    {
      "id": "RM-02-203",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "203",
      "name": "Room 203 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-203"
    },
    {
      "id": "OFC-02-204",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "204",
      "name": "Room 204 - Student Development and Activities Office (SDAO)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-02-204"
    },
    {
      "id": "RM-02-205",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "205",
      "name": "Room 205 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-205"
    },
    {
      "id": "RM-02-206",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "206",
      "name": "Room 206 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-206"
    },
    {
      "id": "RM-02-207",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "207",
      "name": "Room 207 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-207"
    },
    {
      "id": "RM-02-208",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "208",
      "name": "Room 208 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-208"
    },
    {
      "id": "RM-02-209",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "209",
      "name": "Room 209 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-209"
    },
    {
      "id": "OFC-02-210",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "210",
      "name": "Room 210 - Guidance and Counseling Office (GCO)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-02-210"
    },
    {
      "id": "OFC-02-211",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "211",
      "name": "Room 211 - Guidance and Counseling Office (GCO) — Testing Unit",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-02-211"
    },
    {
      "id": "OTH-02-212L",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "212L",
      "name": "Room 212L - Hydraulics Laboratory",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-02-212L"
    },
    {
      "id": "OTH-02-214L",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "214L",
      "name": "Room 214L - Geotech Laboratory",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-02-214L"
    },
    {
      "id": "RM-02-215",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "215",
      "name": "Room 215 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-215"
    },
    {
      "id": "RM-02-216",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "216",
      "name": "Room 216 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-216"
    },
    {
      "id": "RM-02-217",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "217",
      "name": "Room 217 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-217"
    },
    {
      "id": "RM-02-218",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "218",
      "name": "Room 218 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-218"
    },
    {
      "id": "RM-02-219",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "219",
      "name": "Room 219 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-219"
    },
    {
      "id": "RM-02-220",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "220",
      "name": "Room 220 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-220"
    },
    {
      "id": "RM-02-221",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "221",
      "name": "Room 221 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-221"
    },
    {
      "id": "RM-02-222",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "222",
      "name": "Room 222 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-222"
    },
    {
      "id": "OTH-02-223L",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "223L",
      "name": "Room 223L - Psychology Lab",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-02-223L"
    },
    {
      "id": "RM-02-224",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "224",
      "name": "Room 224 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-224"
    },
    {
      "id": "RM-02-225",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "225",
      "name": "Room 225 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-225"
    },
    {
      "id": "RM-02-226",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "226",
      "name": "Room 226 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-02-226"
    },
    {
      "id": "RST-02-CR",
      "building": "NU Fairview Main Building",
      "floor": 2,
      "room": "Restroom",
      "name": "2nd Floor - Comfort Room (CR)",
      "type": "Restroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RST-02-CR"
    },
    {
      "id": "OTH-03-301",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "301",
      "name": "Room 301 - Restricted Area",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-301"
    },
    {
      "id": "OFC-03-302",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "302",
      "name": "Room 302 - Faculty Room",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-03-302"
    },
    {
      "id": "OTH-03-303L",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "303L",
      "name": "Room 303L - Architecture Lab",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-303L"
    },
    {
      "id": "OFC-03-304",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "304",
      "name": "Room 304 - Faculty Room",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-03-304"
    },
    {
      "id": "RM-03-305",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "305",
      "name": "Room 305 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-305"
    },
    {
      "id": "OFC-03-306",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "306",
      "name": "Room 306 - Board Room",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-03-306"
    },
    {
      "id": "OFC-03-307",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "307",
      "name": "Room 307 - Human Resources (HR)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-03-307"
    },
    {
      "id": "OFC-03-308",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "308",
      "name": "Room 308 - Accounting",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-03-308"
    },
    {
      "id": "RM-03-309",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "309",
      "name": "Room 309 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-309"
    },
    {
      "id": "RM-03-310",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "310",
      "name": "Room 310 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-310"
    },
    {
      "id": "RM-03-311",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "311",
      "name": "Room 311 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-311"
    },
    {
      "id": "RM-03-312",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "312",
      "name": "Room 312 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-312"
    },
    {
      "id": "RM-03-313",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "313",
      "name": "Room 313 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-313"
    },
    {
      "id": "RM-03-314",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "314",
      "name": "Room 314 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-314"
    },
    {
      "id": "RM-03-315",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "315",
      "name": "Room 315 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-315"
    },
    {
      "id": "RM-03-316",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "316",
      "name": "Room 316 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-316"
    },
    {
      "id": "RM-03-317",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "317",
      "name": "Room 317 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-317"
    },
    {
      "id": "RM-03-318",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "318",
      "name": "Room 318 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-318"
    },
    {
      "id": "RM-03-319",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "319",
      "name": "Room 319 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-319"
    },
    {
      "id": "OTH-03-320",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "320",
      "name": "Room 320 - Chapel",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-320"
    },
    {
      "id": "OTH-03-321L",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "321L",
      "name": "Room 321L - Architecture Lab",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-321L"
    },
    {
      "id": "RM-03-322",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "322",
      "name": "Room 322 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-03-322"
    },
    {
      "id": "OTH-03-323L",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "323L",
      "name": "Room 323L - Architecture Lab",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-323L"
    },
    {
      "id": "OFC-03-324",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "324",
      "name": "Room 324 - Campus Research, Faculty Services, Marketing Office",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-03-324"
    },
    {
      "id": "OTH-03-324L",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "324L",
      "name": "Room 324L - Media Lab",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-324L"
    },
    {
      "id": "OTH-03-BUSINESSSIMULA",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "Business Simulation Room",
      "name": "Business Simulation Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-03-BUSINESSSIMULA"
    },
    {
      "id": "RST-03-CR",
      "building": "NU Fairview Main Building",
      "floor": 3,
      "room": "Restroom",
      "name": "3rd Floor - Comfort Room (CR)",
      "type": "Restroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RST-03-CR"
    },
    {
      "id": "OTH-04-401",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "401",
      "name": "Room 401 - Electrical Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-401"
    },
    {
      "id": "LAB-04-402L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "402L",
      "name": "Room 402L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-402L"
    },
    {
      "id": "RM-04-404",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "404",
      "name": "Room 404 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-404"
    },
    {
      "id": "LAB-04-405L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "405L",
      "name": "Room 405L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-405L"
    },
    {
      "id": "RM-04-406",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "406",
      "name": "Room 406 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-406"
    },
    {
      "id": "OTH-04-407L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "407L",
      "name": "Room 407L - General Physics Laboratory 1",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-407L"
    },
    {
      "id": "OTH-04-408",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "408",
      "name": "Room 408 - Physics Storage",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-408"
    },
    {
      "id": "OTH-04-409L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "409L",
      "name": "Room 409L - General Physics Laboratory 2",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-409L"
    },
    {
      "id": "OTH-04-410L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "410L",
      "name": "Room 410L - Zoology Lab",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-410L"
    },
    {
      "id": "OFC-04-411",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "411",
      "name": "Room 411 - Information Technology Services Office (ITSO)",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-04-411"
    },
    {
      "id": "OTH-04-412L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "412L",
      "name": "Room 412L - Circuit Laboratory",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-412L"
    },
    {
      "id": "OTH-04-413",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "413",
      "name": "Room 413 - Audio-Visual Room (AVR)",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-413"
    },
    {
      "id": "RM-04-414",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "414",
      "name": "Room 414 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-414"
    },
    {
      "id": "RM-04-415",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "415",
      "name": "Room 415 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-415"
    },
    {
      "id": "RM-04-416",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "416",
      "name": "Room 416 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-416"
    },
    {
      "id": "RM-04-417",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "417",
      "name": "Room 417 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-417"
    },
    {
      "id": "LAB-04-418L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "418L",
      "name": "Room 418L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-418L"
    },
    {
      "id": "LAB-04-419L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "419L",
      "name": "Room 419L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-419L"
    },
    {
      "id": "LAB-04-420L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "420L",
      "name": "Room 420L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-420L"
    },
    {
      "id": "RM-04-421",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "421",
      "name": "Room 421 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-421"
    },
    {
      "id": "LAB-04-422L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "422L",
      "name": "Room 422L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-422L"
    },
    {
      "id": "LAB-04-423L",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "423L",
      "name": "Room 423L - Computer Laboratory (Comlab)",
      "type": "Computer Laboratory",
      "status": "Active",
      "qrPayload": "NUF-LOC:LAB-04-423L"
    },
    {
      "id": "RM-04-424",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "424",
      "name": "Room 424 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-424"
    },
    {
      "id": "RM-04-425",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "425",
      "name": "Room 425 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-04-425"
    },
    {
      "id": "OTH-04-CIRCUITLABSTOR",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "Circuit Lab Storage",
      "name": "Circuit Lab Storage",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-04-CIRCUITLABSTOR"
    },
    {
      "id": "RST-04-CR",
      "building": "NU Fairview Main Building",
      "floor": 4,
      "room": "Restroom",
      "name": "4th Floor - Comfort Room (CR)",
      "type": "Restroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RST-04-CR"
    },
    {
      "id": "OTH-05-501",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "501",
      "name": "Room 501 - Electrical Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-501"
    },
    {
      "id": "RM-05-502",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "502",
      "name": "Room 502 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-05-502"
    },
    {
      "id": "OTH-05-503",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "503",
      "name": "Room 503 - 5th Floor Function Hall",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-503"
    },
    {
      "id": "OFC-05-504",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "504",
      "name": "Room 504 - School of Tourism and Hospitality Management (STHM) Faculty Room",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-05-504"
    },
    {
      "id": "OTH-05-505",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "505",
      "name": "Room 505 - Storage 1",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-505"
    },
    {
      "id": "OTH-05-506L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "506L",
      "name": "Room 506L - Chemistry Lab 1",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-506L"
    },
    {
      "id": "OTH-05-507",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "507",
      "name": "Room 507 - Chemistry Storage",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-507"
    },
    {
      "id": "OTH-05-508L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "508L",
      "name": "Room 508L - Chemistry Lab 2",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-508L"
    },
    {
      "id": "OTH-05-509",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "509",
      "name": "Room 509 - Travel Counter",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-509"
    },
    {
      "id": "OTH-05-510",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "510",
      "name": "Room 510 - Standard Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-510"
    },
    {
      "id": "RM-05-511",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "511",
      "name": "Room 511 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-05-511"
    },
    {
      "id": "OTH-05-512L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "512L",
      "name": "Room 512L - Baking Kitchen",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-512L"
    },
    {
      "id": "OTH-05-513",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "513",
      "name": "Room 513 - Cold Kitchen",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-513"
    },
    {
      "id": "OTH-05-514",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "514",
      "name": "Room 514 - Storage 3",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-514"
    },
    {
      "id": "OTH-05-515L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "515L",
      "name": "Room 515L - Hot Kitchen 4",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-515L"
    },
    {
      "id": "OTH-05-516",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "516",
      "name": "Room 516 - Storage 2",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-516"
    },
    {
      "id": "OTH-05-517L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "517L",
      "name": "Room 517L - Hot Kitchen 3",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-517L"
    },
    {
      "id": "OTH-05-519L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "519L",
      "name": "Room 519L - Hot Kitchen 2",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-519L"
    },
    {
      "id": "OTH-05-521L",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "521L",
      "name": "Room 521L - Hot Kitchen 1",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-521L"
    },
    {
      "id": "OTH-05-522",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "522",
      "name": "Room 522 - Demo Kitchen",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-522"
    },
    {
      "id": "OTH-05-523",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "523",
      "name": "Room 523 - Laundry Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-523"
    },
    {
      "id": "OTH-05-FAMILYSUITE",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "Family Suite",
      "name": "Family Suite",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-FAMILYSUITE"
    },
    {
      "id": "OTH-05-MARIANOSCAFE",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "Mariano's Cafe",
      "name": "Mariano's Cafe",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-05-MARIANOSCAFE"
    },
    {
      "id": "RST-05-CR",
      "building": "NU Fairview Main Building",
      "floor": 5,
      "room": "Restroom",
      "name": "5th Floor - Comfort Room (CR)",
      "type": "Restroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RST-05-CR"
    },
    {
      "id": "RM-01-A101",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "101",
      "name": "2nd Building Room 101 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A101"
    },
    {
      "id": "RM-01-A102",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "102",
      "name": "2nd Building Room 102 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A102"
    },
    {
      "id": "RM-01-A103",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "103",
      "name": "2nd Building Room 103 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A103"
    },
    {
      "id": "RM-01-A104",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "104",
      "name": "2nd Building Room 104 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A104"
    },
    {
      "id": "RM-01-A105",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "105",
      "name": "2nd Building Room 105 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A105"
    },
    {
      "id": "RM-01-A106",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "106",
      "name": "2nd Building Room 106 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A106"
    },
    {
      "id": "RM-01-A107",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "107",
      "name": "2nd Building Room 107 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A107"
    },
    {
      "id": "RM-01-A108",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "108",
      "name": "2nd Building Room 108 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A108"
    },
    {
      "id": "RM-01-A109",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "109",
      "name": "2nd Building Room 109 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A109"
    },
    {
      "id": "RM-01-A110",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "110",
      "name": "2nd Building Room 110 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A110"
    },
    {
      "id": "RM-01-A111",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "111",
      "name": "2nd Building Room 111 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A111"
    },
    {
      "id": "RM-01-A112",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "112",
      "name": "2nd Building Room 112 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A112"
    },
    {
      "id": "RM-01-A113",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "113",
      "name": "2nd Building Room 113 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A113"
    },
    {
      "id": "RM-01-A114",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "114",
      "name": "2nd Building Room 114 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A114"
    },
    {
      "id": "RM-01-A115",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "115",
      "name": "2nd Building Room 115 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A115"
    },
    {
      "id": "RM-01-A116",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "116",
      "name": "2nd Building Room 116 - Lecture Room",
      "type": "Classroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RM-01-A116"
    },
    {
      "id": "OTH-01-ANATIONALSERVIC",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "National Service Training Program / Community Extension (NSTP / ComEx)",
      "name": "2nd Building - National Service Training Program / Community Extension (NSTP / ComEx)",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-ANATIONALSERVIC"
    },
    {
      "id": "OTH-01-AELECTRICALENGI",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "Electrical Engineering (EE) Room",
      "name": "2nd Building - Electrical Engineering (EE) Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-AELECTRICALENGI"
    },
    {
      "id": "OTH-01-AFUNCTIONROOM",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "Function Room",
      "name": "2nd Building - Function Room",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-AFUNCTIONROOM"
    },
    {
      "id": "OTH-01-AINTERMEDIATEDI",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "Intermediate Distribution Frame (IDF)",
      "name": "2nd Building - Intermediate Distribution Frame (IDF)",
      "type": "Other",
      "status": "Active",
      "qrPayload": "NUF-LOC:OTH-01-AINTERMEDIATEDI"
    },
    {
      "id": "OFC-01-AFACULTYROOM",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "Faculty Room",
      "name": "2nd Building - Faculty Room",
      "type": "Office",
      "status": "Active",
      "qrPayload": "NUF-LOC:OFC-01-AFACULTYROOM"
    },
    {
      "id": "RST-01-ACR",
      "building": "NU Fairview 2nd Building",
      "floor": 1,
      "room": "Restroom",
      "name": "2nd Building - Comfort Room (CR)",
      "type": "Restroom",
      "status": "Active",
      "qrPayload": "NUF-LOC:RST-01-ACR"
    }
  ];
  /* GENERATED:END locations */

  // Location kinds shown in the picker's Location type select. Labels are user-facing;
  // values are normalized keys used to filter the underlying location records.
  App.seed.LOCATION_KINDS = LOCATION_KINDS;
  App.seed.kindOf = (l) => KIND_BY_TYPE[l && l.type] || 'other-area';
  // Fixed floor lists, in this order. Values 1-5 match the numeric floor on the rooms. Other buildings list the floors their rooms are on.
  const floorList = (floors) => floors.map((f) => ({ value: f, label: App.seed.floorLabel(f) }));
  App.seed.BUILDING_FLOORS = {};
  Object.keys(BUILDING_FLOOR_LIST).forEach((b) => {
    App.seed.BUILDING_FLOORS[b] = floorList(BUILDING_FLOOR_LIST[b]);
  });

  // Every location id used before the official rooms list, mapped to the room that replaces it.
  // Applied to the seed data and to the QR scanner's input.
  App.seed.locationRemap = LOCATION_REMAP;

  // Locations marked retired are hidden from every new selection.
  App.seed.locations = function () {
    return LOCATIONS.map((l) => Object.assign({}, l));
  };
})();

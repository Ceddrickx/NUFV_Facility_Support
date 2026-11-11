/* Enumerations and lookup tables shared by every module. Four roles only.
   The values (roles, statuses, teams, categories, shared messages) come from the database workbook:
   change database/NU_Facility_Support_DB.xlsx and run tools/build-data.py. Only the part between the GENERATED
   markers is rewritten by the converter; the code around it is hand-written. */
(function () {
  const App = (window.App = window.App || {});

  /* GENERATED:BEGIN db */
  const DB = {
    "meta": {
      "source": "database/NU_Facility_Support_DB.xlsx",
      "generatedAt": "2026-10-17T11:28:54.590Z",
      "dataAnchor": "2026-10-17T11:01:25.267Z"
    },
    "config": {
      "defaultRole": "student",
      "defaultUserId": "u-stu1",
      "microsoftSignInEmail": "sacriztade@admins.nu-fairview.edu.ph",
      "defaultLocationId": "LAB-04-402L",
      "recurringThreshold": 5
    },
    "ROLES": {
      "student": {
        "label": "Student / Faculty",
        "short": "Student"
      },
      "fmo": {
        "label": "FMO Technician",
        "short": "FMO"
      },
      "it": {
        "label": "IT Technician",
        "short": "IT"
      },
      "admin": {
        "label": "Admin",
        "short": "Admin"
      }
    },
    "STATUS": [
      "Pending",
      "Assigned",
      "In Progress",
      "Resolved",
      "Closed / Verified",
      "Reopened"
    ],
    "STATUS_ORDER": [
      "Pending",
      "Assigned",
      "In Progress",
      "Reopened",
      "Resolved",
      "Closed / Verified"
    ],
    "GROUPS": [
      "IT",
      "Facility",
      "Triage"
    ],
    "LOCATION_TYPES": [
      "Classroom",
      "Computer Laboratory",
      "Office",
      "Hallway",
      "Restroom",
      "Other"
    ],
    "NO_PASSWORD": "Do not enter any password. Describe what you see on screen. Authorized personnel will handle access.",
    "SAFETY_TEXT": "If anyone is in immediate danger, leave the area and contact campus security or emergency services first. Then submit this report.",
    "CATEGORIES": [
      {
        "id": "Computer / Hardware",
        "label": "Computer / Hardware",
        "group": "IT",
        "icon": "cpu",
        "problems": [
          {
            "label": "Will not turn on",
            "title": "Computer will not turn on",
            "safety": false
          },
          {
            "label": "Freezes or restarts",
            "title": "Computer freezes or restarts",
            "safety": false
          },
          {
            "label": "Very slow",
            "title": "Computer is very slow",
            "safety": false
          },
          {
            "label": "Other",
            "title": "Computer problem",
            "safety": false
          }
        ]
      },
      {
        "id": "Missing / Unavailable Hardware",
        "label": "Missing / Unavailable Hardware",
        "group": "IT",
        "icon": "help",
        "problems": [
          {
            "label": "No CPU / system unit",
            "title": "No CPU / system unit at workstation",
            "safety": false
          },
          {
            "label": "Missing component",
            "title": "Missing computer component",
            "safety": false
          },
          {
            "label": "Unit unavailable",
            "title": "Computer unit unavailable",
            "safety": false
          },
          {
            "label": "Other",
            "title": "Missing hardware",
            "safety": false
          }
        ]
      },
      {
        "id": "Wi-Fi / Network",
        "label": "Wi-Fi / Network",
        "group": "IT",
        "icon": "wifi",
        "problems": [
          {
            "label": "No connection",
            "title": "No network connection",
            "safety": false
          },
          {
            "label": "Unstable connection",
            "title": "Wi-Fi connection unstable",
            "safety": false
          },
          {
            "label": "Weak signal",
            "title": "Weak Wi-Fi signal",
            "safety": false
          },
          {
            "label": "Other",
            "title": "Network problem",
            "safety": false
          }
        ]
      },
      {
        "id": "Computer Login / Access",
        "label": "Computer Login / Access",
        "group": "IT",
        "icon": "key",
        "problems": [
          {
            "label": "Asks for username or password I do not know",
            "title": "Computer asks for credentials I do not have",
            "safety": false
          },
          {
            "label": "Account locked",
            "title": "Account is locked",
            "safety": false
          },
          {
            "label": "Other",
            "title": "Computer access problem",
            "safety": false
          }
        ],
        "noPassword": true
      },
      {
        "id": "School Email / Account",
        "label": "School Email / Account",
        "group": "IT",
        "icon": "mail",
        "problems": [
          {
            "label": "Cannot sign in to school email on lab PC",
            "title": "Cannot sign in to school email on lab PC",
            "safety": false
          },
          {
            "label": "Cannot access required service",
            "title": "Cannot access a required service",
            "safety": false
          },
          {
            "label": "Other",
            "title": "School account problem",
            "safety": false
          }
        ],
        "noPassword": true
      },
      {
        "id": "Electrical",
        "label": "Electrical",
        "group": "Facility",
        "icon": "zap",
        "problems": [
          {
            "label": "No power at outlet",
            "title": "No power at outlet",
            "safety": false
          },
          {
            "label": "Exposed wiring",
            "title": "Exposed wiring",
            "safety": false
          },
          {
            "label": "Sparks or burning smell (safety)",
            "title": "Sparks or burning smell",
            "safety": true
          },
          {
            "label": "Other",
            "title": "Electrical problem",
            "safety": false
          }
        ]
      },
      {
        "id": "Air Conditioning",
        "label": "Air Conditioning",
        "group": "Facility",
        "icon": "snow",
        "problems": [
          {
            "label": "Not cooling",
            "title": "Air conditioner not cooling",
            "safety": false
          },
          {
            "label": "Noisy",
            "title": "Air conditioner is noisy",
            "safety": false
          },
          {
            "label": "Leaking water",
            "title": "Air conditioner leaking water",
            "safety": false
          },
          {
            "label": "Will not turn on",
            "title": "Air conditioner will not turn on",
            "safety": false
          }
        ]
      },
      {
        "id": "Lighting",
        "label": "Lighting",
        "group": "Facility",
        "icon": "bulb",
        "problems": [
          {
            "label": "Light not working",
            "title": "Light is not working",
            "safety": false
          },
          {
            "label": "Flickering",
            "title": "Light is flickering",
            "safety": false
          },
          {
            "label": "Too dim",
            "title": "Lighting is too dim",
            "safety": false
          }
        ]
      },
      {
        "id": "Plumbing",
        "label": "Plumbing",
        "group": "Facility",
        "icon": "droplet",
        "problems": [
          {
            "label": "Leak",
            "title": "Water leak",
            "safety": false
          },
          {
            "label": "Clogged",
            "title": "Clogged drain or toilet",
            "safety": false
          },
          {
            "label": "No water",
            "title": "No water supply",
            "safety": false
          },
          {
            "label": "Flooding (safety)",
            "title": "Flooding",
            "safety": true
          }
        ]
      },
      {
        "id": "Furniture",
        "label": "Furniture",
        "group": "Facility",
        "icon": "chair",
        "problems": [
          {
            "label": "Broken chair",
            "title": "Broken chair",
            "safety": false
          },
          {
            "label": "Broken table or desk",
            "title": "Broken table or desk",
            "safety": false
          },
          {
            "label": "Other",
            "title": "Furniture problem",
            "safety": false
          }
        ]
      },
      {
        "id": "Equipment",
        "label": "Equipment",
        "group": "Facility",
        "icon": "projector",
        "problems": [
          {
            "label": "Projector not working",
            "title": "Projector not working",
            "safety": false
          },
          {
            "label": "TV or whiteboard issue",
            "title": "TV or whiteboard issue",
            "safety": false
          },
          {
            "label": "Other",
            "title": "Equipment problem",
            "safety": false
          }
        ]
      },
      {
        "id": "Other",
        "label": "Other",
        "group": "Triage",
        "icon": "help",
        "problems": [
          {
            "label": "Describe the problem",
            "title": "",
            "safety": false
          }
        ]
      }
    ]
  };
  /* GENERATED:END db */

  // Labels are the generic role names. A signed-in person's own roleLabel (for example "Faculty") is used where a person is shown.
  const { ROLES, STATUS, STATUS_ORDER, GROUPS, LOCATION_TYPES, NO_PASSWORD, SAFETY_TEXT, CATEGORIES } = DB;

  // CATEGORIES is the single source of truth: the report form, every ticket filter, the chatbot and analytics read from it.
  // Categories route to a group automatically (simulated RPA routing). Account categories are the ones flagged noPassword.
  const ACCOUNT_CATEGORIES = CATEGORIES.filter((c) => c.noPassword).map((c) => c.id);
  const catByName = (n) => CATEGORIES.find((c) => c.id === n);
  const groupOf = (cat) => (catByName(cat) || { group: 'Triage' }).group;

  // Facts about the database this build was made from, and the few settings the site reads from it.
  App.db = { meta: DB.meta, config: DB.config };

  App.C = {
    ROLES,
    STATUS,
    STATUS_ORDER,
    GROUPS,
    LOCATION_TYPES,
    NO_PASSWORD,
    SAFETY_TEXT,
    CATEGORIES,
    ACCOUNT_CATEGORIES,
    catByName,
    groupOf,
    ROLE_KEYS: Object.keys(ROLES),
  };
})();

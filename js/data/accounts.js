/* The only accounts allowed to sign in (demo, no backend). The full email must match exactly and so must the password.
   Each account's userId points at a person in seed-users.js. Passwords are plain text here, so this is for a demo only.
   The accounts come from the Account sheet of database/NU_Facility_Support_DB.xlsx (see tools/build-data.py): only the part
   between the GENERATED markers is rewritten by the converter. An account with an mfaSecret always asks for a Google
   Authenticator code (add the key to the phone once with "Enter a setup key"). */
(function () {
  const App = (window.App = window.App || {});

  /* GENERATED:BEGIN list */
  const list = [
    {
      "email": "constantinopgo@students.nu-fairview.edu.ph",
      "password": "2025-1038122",
      "role": "student",
      "roleLabel": "Student",
      "userId": "u-stu1",
      "name": "Gian",
      "firstName": "Gian",
      "lastName": "Constantino",
      "fullName": "Gian Constantino"
    },
    {
      "email": "literatojes@students.nu-fairview.edu.ph",
      "password": "2025-1037169",
      "role": "student",
      "roleLabel": "Student",
      "userId": "u-stu2",
      "name": "Emman",
      "firstName": "Emman",
      "lastName": "Literato",
      "fullName": "Emman Literato"
    },
    {
      "email": "bajarlcc@faculty.nu-fairview.edu.ph",
      "password": "2025-1037898",
      "role": "student",
      "roleLabel": "Faculty",
      "userId": "u-fac1",
      "name": "Lance Christopher",
      "firstName": "Lance Christopher",
      "lastName": "Bajar",
      "fullName": "Lance Christopher Bajar"
    },
    {
      "email": "villarkcc@technicians.nu-fairview.edu.ph",
      "password": "2025-1034600",
      "role": "it",
      "roleLabel": "IT Technician",
      "userId": "u-it1",
      "name": "Kim Cedrick",
      "firstName": "Kim Cedrick",
      "lastName": "Villar",
      "fullName": "Kim Cedrick Villar"
    },
    {
      "email": "isaacrf@technicians.nu-fairview.edu.ph",
      "password": "2025-1031452",
      "role": "it",
      "roleLabel": "IT Technician",
      "userId": "u-it2",
      "name": "Raphael",
      "firstName": "Raphael",
      "lastName": "Isaac",
      "fullName": "Raphael Isaac"
    },
    {
      "email": "legaspijbd@technicians.nu-fairview.edu.ph",
      "password": "2025-1039638",
      "role": "fmo",
      "roleLabel": "FMO Technician",
      "userId": "u-fmo1",
      "name": "John Benedict",
      "firstName": "John Benedict",
      "lastName": "Legaspi",
      "fullName": "John Benedict Legaspi"
    },
    {
      "email": "garciaayg@technicians.nu-fairview.edu.ph",
      "password": "2025-1033834",
      "role": "fmo",
      "roleLabel": "FMO Technician",
      "userId": "u-fmo2",
      "name": "Ares Yael",
      "firstName": "Ares Yael",
      "lastName": "Garcia",
      "fullName": "Ares Yael Garcia"
    },
    {
      "email": "sacriztade@admins.nu-fairview.edu.ph",
      "password": "2025-1032718",
      "role": "admin",
      "roleLabel": "Admin",
      "userId": "u-adm",
      "name": "Tiffany Ann",
      "firstName": "Tiffany Ann",
      "lastName": "Sacriz",
      "fullName": "Tiffany Ann Sacriz"
    },
    {
      "email": "z4nvern07@gmail.com",
      "password": "2025-1034600",
      "role": "it",
      "roleLabel": "IT Technician",
      "userId": "u-it1",
      "name": "Kim Cedrick",
      "firstName": "Kim Cedrick",
      "lastName": "Villar",
      "fullName": "Kim Cedrick Villar",
      "mfaSecret": "LTXCPMZEKGRSPPC67U33GUABY7CQ7WDS"
    }
  ];
  /* GENERATED:END list */

  const norm = (e) =>
    String(e || '')
      .trim()
      .toLowerCase();
  App.accounts = {
    list,
    // The matching account, or null. Email is case-insensitive; the password must match exactly.
    find(email, password) {
      const x = list.find((acc) => acc.email === norm(email));
      return x && x.password === password ? x : null;
    },
    byEmail(email) {
      return list.find((acc) => acc.email === norm(email)) || null;
    },
  };
})();

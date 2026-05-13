/* ============================================================
   booksData.js  —  default seed books loaded into localStorage
   on first visit via initBooks.js
   ============================================================ */

const defaultBooks = [

  /* --- competitive exam books --- */
  {
    id: "b1",
    title: "Quantitative Aptitude",
    author: "R.S. Aggarwal",
    category: "Competitive Exam",
    subCategory: "Aptitude",
    image: "../assets/images/7340671.jpg",
    isbn: "9789351760148",
    totalCopies: 10,
    availableCopies: 10,
    status: "available"
  },
  {
    id: "b2",
    title: "General Knowledge 2025",
    author: "Lucent",
    category: "Competitive Exam",
    subCategory: "GK",
    image: "../assets/images/7340671.jpg",
    isbn: "9789384761549",
    totalCopies: 8,
    availableCopies: 8,
    status: "available"
  },
  {
    id: "b3",
    title: "SSC Reasoning",
    author: "Kiran Publications",
    category: "Competitive Exam",
    subCategory: "Reasoning",
    image: "../assets/images/7340671.jpg",
    isbn: "9788192931427",
    totalCopies: 6,
    availableCopies: 6,
    status: "available"
  },

  /* --- fy bcs --- */
  {
    id: "b4",
    title: "C Programming",
    author: "E. Balagurusamy",
    category: "Academic",
    subCategory: "FY BCS",
    image: "../assets/images/7340671.jpg",
    isbn: "9781259004612",
    totalCopies: 12,
    availableCopies: 12,
    status: "available"
  },
  {
    id: "b5",
    title: "Digital Electronics",
    author: "Morris Mano",
    category: "Academic",
    subCategory: "FY BCS",
    image: "../assets/images/7340671.jpg",
    isbn: "9789332901539",
    totalCopies: 7,
    availableCopies: 7,
    status: "available"
  },

  /* --- sy bcs --- */
  {
    id: "b6",
    title: "Data Structures",
    author: "Seymour Lipschutz",
    category: "Academic",
    subCategory: "SY BCS",
    image: "../assets/images/7340671.jpg",
    isbn: "9780070701986",
    totalCopies: 10,
    availableCopies: 10,
    status: "available"
  },
  {
    id: "b7",
    title: "Operating System",
    author: "Galvin",
    category: "Academic",
    subCategory: "SY BCS",
    image: "../assets/images/7340671.jpg",
    isbn: "9781119456339",
    totalCopies: 9,
    availableCopies: 9,
    status: "available"
  },

  /* --- ty bcs --- */
  {
    id: "b8",
    title: "Database System",
    author: "Korth",
    category: "Academic",
    subCategory: "TY BCS",
    image: "../assets/images/7340671.jpg",
    isbn: "9780078022159",
    totalCopies: 11,
    availableCopies: 11,
    status: "available"
  },
  {
    id: "b9",
    title: "Computer Networks",
    author: "Andrew Tanenbaum",
    category: "Academic",
    subCategory: "TY BCS",
    image: "../assets/images/7340671.jpg",
    isbn: "9789332575778",
    totalCopies: 6,
    availableCopies: 6,
    status: "available"
  },

  /* --- reading / fiction --- */
  {
    id: "b10",
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Reading",
    subCategory: "Novel",
    image: "../assets/images/7340671.jpg",
    isbn: "9780061122415",
    totalCopies: 5,
    availableCopies: 5,
    status: "available"
  },
  {
    id: "b11",
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    category: "Reading",
    subCategory: "Biography",
    image: "../assets/images/7340671.jpg",
    isbn: "9781612680194",
    totalCopies: 7,
    availableCopies: 7,
    status: "available"
  },
  {
    id: "b12",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Reading",
    subCategory: "Biography",
    image: "../assets/images/7340671.jpg",
    isbn: "9780735211292",
    totalCopies: 6,
    availableCopies: 6,
    status: "available"
  }
];

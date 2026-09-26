import { Book, DialecticComment, Question, ReadingPath, Review, Note, Bookmark, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  name: "Beatrice Moreau",
  title: "Lifelong Reader & Theological Inquirer",
  location: "Paris",
  memberSince: "2023",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
  themePreference: "cream",
  booksRead: 14,
  notesCount: 48,
  dayStreak: 12,
  goalTarget: 24,
  topics: ["Early Church", "Patristics", "Philosophy", "Contemplative Prayer", "Ancient Classics"]
};

export const INITIAL_BOOKS: Book[] = [
  {
    id: "conf-4",
    title: "The Confessions",
    originalTitle: "Confessiones",
    author: "Augustine of Hippo",
    authorEra: "354–430 AD · North Africa / Rome / Milan",
    authorBio: "Bishop of Hippo Regius, Doctor of Grace, and one of the most influential theologians in Western Christianity and philosophy.",
    category: "Spiritual Memoir",
    categoryTag: "Patristic",
    progress: 85,
    currentPage: 289,
    currentLocation: "Book VIII: The Garden at Milan",
    notesCount: 22,
    circleCount: 40,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdAq9atrTR3DAeW72VICqn9K4gQeTGTq5i_EkEKp9xw_z6BfR65kHsmNyWDZJDg80JosDQ3gRvqwwNRBKzcvvkB7mjFRd49H-ETrGxAIXfIcxwWguELZAYCA4fx1lJ8U1sDbGw3CiNvb2lYG9hbCJnYFsGpNkkvkSAB4Uw3fc5SyNn98T2Cv8wjS32Td_xxXV3ZTdB31kNoNYLLCPfdBVjq82djYAPduVvMFFaj1nf--P168Ds3Y20ew",
    codexLabel: "Liber VIII",
    era: "c. 397–400 AD",
    totalPages: 340,
    summary: "The intimate narrative of conversion, interior wrestling, and restless longing resting in God, reaching its spiritual and psychological zenith in the garden of Milan with the child’s chant «Tolle, lege».",
    historicalContext: "Composed in North Africa shortly after Augustine was consecrated Bishop of Hippo. It inventively created the genre of Western autobiography, addressed directly to God as an extended prayer of repentance, self-interrogation, and adoration.",
    rating: 4.88,
    ratingsCount: 14820,
    reviewsCount: 1640,
    ratingBreakdown: [
      { stars: 5, percentage: 76, count: 11263 },
      { stars: 4, percentage: 17, count: 2519 },
      { stars: 3, percentage: 5, count: 741 },
      { stars: 2, percentage: 1, count: 148 },
      { stars: 1, percentage: 1, count: 149 }
    ],
    readingStatus: "currently-reading",
    userRating: 5,
    isbn: "978-0199537822",
    clavisId: "CPL 0251",
    originalLanguage: "Classical Latin",
    translator: "Henry Chadwick (Oxford World's Classics)",
    publisher: "Oxford University Press",
    publishedYear: "Composed c. 397 AD · Oxford Edition 2008",
    editionFormat: "Paperback, 340 pages · Critical Annotated Edition",
    quotes: [
      {
        id: "q-conf-1",
        quote: "You have made us for yourself, O Lord, and our hearts are restless until they rest in you.",
        citation: "Book I, Chapter 1",
        likes: 342,
        isFavorited: true
      },
      {
        id: "q-conf-2",
        quote: "Late have I loved you, beauty so old and so new: late have I loved you! And see, you were within and I was in the external world and sought you there.",
        citation: "Book X, Chapter 27",
        likes: 298,
        isFavorited: true
      },
      {
        id: "q-conf-3",
        quote: "Give me chastity and continence, but not yet.",
        citation: "Book VIII, Chapter 7",
        likes: 184,
        isFavorited: false
      }
    ],
    relatedBookIds: ["civ-3", "inc-1", "theo-2"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Augustine+Confessions+Chadwick",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Open Access Digitization)",
        type: "archive",
        url: "https://archive.org/details/confessionsofsta00augu",
        description: "Digitized public domain manuscripts & bilingual folios"
      },
      {
        label: "Christian Classics Ethereal Library (CCEL)",
        type: "ccel",
        url: "https://ccel.org/ccel/augustine/confessions",
        description: "Open scholarly hyperlinked text and apparatus"
      },
      {
        label: "Oxford University Press Academic Catalog",
        type: "academic",
        url: "https://global.oup.com",
        description: "Authoritative Oxford World's Classics critical edition"
      }
    ]
  },
  {
    id: "inc-1",
    title: "On the Incarnation",
    originalTitle: "De Incarnatione Verbi Dei",
    author: "Athanasius of Alexandria",
    authorEra: "c. 296–373 AD · Alexandria / Egypt",
    authorBio: "Patriarch of Alexandria, defender of the Nicene confession against Arianism, known as Athanasius Contra Mundum.",
    category: "Christology",
    categoryTag: "Patristic",
    progress: 68,
    currentPage: 65,
    currentLocation: "Ch. IV: The Divine Dilemma",
    notesCount: 6,
    circleCount: 18,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUUVfkg_ibLfq2sC8koWyblRY57N7leRrjGsuzUoIzn7uu_suN4MXAT-5T46ggijV_7TcR1YHYB_kClg1RzahAoJrUjHCL_5yAfCoKuncQSMj8vx4rEv6_Qxc1WCp87xeDA6Y9KuIGE6UpmqGShnY-9yhjWIGZks_M9d-pce-rE6JOQAd7oqzp-yCpj3XosAIsbyScH57ZLR-XDn6--wOIwvRdHhX2EGti5JWWm9gqsRy0UxXkeSWeFQ",
    codexLabel: "VOL. IV",
    era: "c. 319 AD",
    totalPages: 96,
    summary: "Athanasius’s foundational masterpiece demonstrating how God the Word took upon himself a human body so that humanity might be redeemed from corruption and the ontological slide toward non-being.",
    historicalContext: "Written in the youthful vigor of Athanasius's archdeaconate before or shortly after the Council of Nicaea (325 AD), this treatise presents the central logic of Christian redemption.",
    rating: 4.82,
    ratingsCount: 8240,
    reviewsCount: 910,
    ratingBreakdown: [
      { stars: 5, percentage: 72, count: 5932 },
      { stars: 4, percentage: 20, count: 1648 },
      { stars: 3, percentage: 6, count: 494 },
      { stars: 2, percentage: 1, count: 82 },
      { stars: 1, percentage: 1, count: 84 }
    ],
    readingStatus: "currently-reading",
    userRating: 5,
    isbn: "978-0881414271",
    clavisId: "CPG 2091",
    originalLanguage: "Koine Greek",
    translator: "John Behr (with introduction by C.S. Lewis)",
    publisher: "St. Vladimir's Seminary Press (PPS Series)",
    publishedYear: "c. 319 AD · SVS Press 2011",
    editionFormat: "Paperback, 96 pages · Popular Patristics Series #44",
    quotes: [
      {
        id: "q-inc-1",
        quote: "He became what we are that He might make us what He is.",
        citation: "Section 54.3",
        likes: 412,
        isFavorited: true
      },
      {
        id: "q-inc-2",
        quote: "For as when a portrait that has been painted on a panel becomes obliterated through external stains, the artist does not cast the panel away, but comes back and sits again for the portrait.",
        citation: "Section 14.1",
        likes: 276,
        isFavorited: false
      }
    ],
    relatedBookIds: ["conf-4", "theo-2", "lad-8"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Athanasius+On+the+Incarnation+Behr",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Open Access)",
        type: "archive",
        url: "https://archive.org/details/athanasiusinco00athauoft",
        description: "Digitized Greek text with parallel English translation"
      },
      {
        label: "Christian Classics Ethereal Library",
        type: "ccel",
        url: "https://ccel.org/ccel/athanasius/incardiv",
        description: "Public domain text and Robertson introduction"
      }
    ]
  },
  {
    id: "theo-2",
    title: "Mystical Theology",
    originalTitle: "Theologia Mystica",
    author: "Pseudo-Dionysius the Areopagite",
    authorEra: "Late 5th – Early 6th Century · Syria / Antioch",
    authorBio: "Anonymous Christian Neoplatonist whose corpus shaped medieval Christian mysticism, Eastern hesychasm, and Thomas Aquinas.",
    category: "Apophatic",
    categoryTag: "Apophatic",
    progress: 42,
    currentPage: 33,
    currentLocation: "Ch. II: Darkness & Light",
    notesCount: 4,
    circleCount: 9,
    coverImage: "",
    bgCode: "#3c2a21",
    codexLabel: "Codex II",
    era: "5th-6th Cent.",
    totalPages: 78,
    summary: "The foundational text of Christian apophatic contemplation, pointing the seeking mind past conceptual affirmations into the divine darkness of unknowing that outshines all understanding.",
    historicalContext: "Composed under the pseudonym of Paul’s Athenian convert from Acts 17, combining Proclean Neoplatonic dialectic with Gregory of Nyssa's Moses ascending Mount Sinai.",
    rating: 4.74,
    ratingsCount: 3120,
    reviewsCount: 380,
    ratingBreakdown: [
      { stars: 5, percentage: 68, count: 2121 },
      { stars: 4, percentage: 22, count: 686 },
      { stars: 3, percentage: 7, count: 218 },
      { stars: 2, percentage: 2, count: 62 },
      { stars: 1, percentage: 1, count: 33 }
    ],
    readingStatus: "want-to-read",
    userRating: 0,
    isbn: "978-0809128389",
    clavisId: "CPG 6603",
    originalLanguage: "Greek (Syriac / Latin reception)",
    translator: "Colm Luibheid & Paul Rorem",
    publisher: "Paulist Press (Classics of Western Spirituality)",
    publishedYear: "c. 500 AD · Paulist Press 1987",
    editionFormat: "Paperback, 78 pages · Complete Works Series",
    quotes: [
      {
        id: "q-theo-1",
        quote: "Trinity!! Higher than any being, any divinity, any goodness! Guide of Christians in the wisdom of heaven! Direct our way to the summit of mystical oracles, which is above light and above knowledge, where the simple, absolute, and unchangeable mysteries of heavenly truth lie hidden in the dazzling obscurity of the secret Silence.",
        citation: "Chapter I, 997A",
        likes: 195,
        isFavorited: true
      }
    ],
    relatedBookIds: ["cloud-6", "inc-1", "conf-4"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Pseudo-Dionysius+Complete+Works+Paulist",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Dionysian Corpus)",
        type: "archive",
        url: "https://archive.org/details/dionysiuscomplete00luib",
        description: "Open Access English translation by Paulist Press"
      }
    ]
  },
  {
    id: "civ-3",
    title: "The City of God",
    originalTitle: "De Civitate Dei contra Paganos",
    author: "Augustine of Hippo",
    authorEra: "354–430 AD · North Africa",
    authorBio: "Bishop of Hippo Regius, Doctor of Grace, architect of Christian theology of history and politics.",
    category: "Ecclesiology",
    categoryTag: "Magnum Opus",
    progress: 24,
    currentPage: 262,
    currentLocation: "Book I: The Fall of Rome",
    notesCount: 14,
    circleCount: 32,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc3nnx4rKjrq4mZrTkCEbKQpMcNHGJsKMXb41-bHP0ys_NlUKmdm7U4J5RUBIOxu4Bds5foVOAmN7MJ6Hn2AFkegkuZz9IvET3-Tk6_VbiH2cSwBV7W_i6zTeXiQLbT8ajizsHXEhFweZeHJxqxC88LZHLyds8U9WX-325StFazxKEoMZoaA7iAEmkNCp8sAd_nWfXzY_pznuU9yJlOinwCbQJW52TB39BB-1QejDvaKhV5i8wTDIh8Q",
    codexLabel: "De Civitate",
    era: "c. 413–426 AD",
    totalPages: 1092,
    summary: "Augustine’s monumental defense of Christianity against pagan critiques following the Visigothic sack of Rome (410 AD), contrasting the Earthly City animated by love of self with the Heavenly City animated by love of God.",
    historicalContext: "Composed across 13 years amid the collapsing Western Roman Empire, establishing a comprehensive Christian philosophy of history, peace, Providence, and eschatology.",
    rating: 4.81,
    ratingsCount: 6890,
    reviewsCount: 780,
    ratingBreakdown: [
      { stars: 5, percentage: 71, count: 4891 },
      { stars: 4, percentage: 21, count: 1446 },
      { stars: 3, percentage: 6, count: 413 },
      { stars: 2, percentage: 1, count: 68 },
      { stars: 1, percentage: 1, count: 72 }
    ],
    readingStatus: "want-to-read",
    userRating: 0,
    isbn: "978-0140448948",
    clavisId: "CPL 0259",
    originalLanguage: "Classical Latin",
    translator: "Henry Bettenson (with intro by G.R. Evans)",
    publisher: "Penguin Classics",
    publishedYear: "c. 426 AD · Penguin Edition 2003",
    editionFormat: "Paperback, 1092 pages · Unabridged Translation",
    quotes: [
      {
        id: "q-civ-1",
        quote: "Two cities, then, have been created by two loves: that is, the earthly by love of self, even to the contempt of God, the heavenly by love of God, even to the contempt of self.",
        citation: "Book XIV, Chapter 28",
        likes: 310,
        isFavorited: true
      },
      {
        id: "q-civ-2",
        quote: "The peace of all things is the tranquillity of order. Order is the distribution which allots things equal and unequal, each to its own place.",
        citation: "Book XIX, Chapter 13",
        likes: 245,
        isFavorited: true
      }
    ],
    relatedBookIds: ["conf-4", "ben-7"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Augustine+City+of+God+Bettenson",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Complete Latin & English)",
        type: "archive",
        url: "https://archive.org/details/cityofgod00auguuoft",
        description: "Bilingual scanned volumes from Edinburgh translation"
      }
    ]
  },
  {
    id: "say-5",
    title: "The Sayings of the Desert Fathers",
    originalTitle: "Apophthegmata Patrum",
    author: "Desert Solitaries of Egypt",
    authorEra: "4th–5th Century · Scetis / Nitria / Thebaid",
    authorBio: "Abba Anthony, Poemen, Moses the Black, Syncletica, and Amma Sarah—ascetic pioneers who fled to the wilderness to wage war on passions.",
    category: "Asceticism",
    categoryTag: "Desert Monasticism",
    progress: 50,
    currentPage: 130,
    currentLocation: "Step 3: Solitude (Hesychia)",
    notesCount: 8,
    circleCount: 12,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIS3Fq6lYbGU-zJDfsH-d1KDlh18QWlmfvFXF44UGMx27EkUERoWn7CtlstUYJBWzMVSXjX3zk0D3A1FmGfhzGVsAFem9ULBNwmp3-6AnRo3-cVWucjvfxijHi2oncS5mDBF6FNjiJ602m3V7d7DfidG0uKDmN2KUuchsuIq0lWefLpvL7hUXaWm7A_Jv3fA_w-F6upqCUcsGviEjapUMQ8UWwVHYYc_dTcAcmvPPhwLSq06gBSGFieA",
    codexLabel: "Scetis",
    era: "4th–5th Cent.",
    totalPages: 260,
    summary: "Distilled spiritual aphorisms and encounter narratives from the desert mothers and fathers, embodying interior vigilance (nepsis), compunction (penthos), humility, and holy stillness (hesychia).",
    historicalContext: "Originally transmitted orally in Coptic and Greek among monastic cells in Lower Egypt, gathered into Alphabetical and Systematic collections in the 5th and 6th centuries.",
    rating: 4.89,
    ratingsCount: 5120,
    reviewsCount: 540,
    ratingBreakdown: [
      { stars: 5, percentage: 78, count: 3993 },
      { stars: 4, percentage: 16, count: 819 },
      { stars: 3, percentage: 4, count: 204 },
      { stars: 2, percentage: 1, count: 51 },
      { stars: 1, percentage: 1, count: 53 }
    ],
    readingStatus: "read",
    userRating: 5,
    userDateFinished: "Aug 2025",
    isbn: "978-0879079598",
    clavisId: "CPG 5560",
    originalLanguage: "Coptic & Koine Greek",
    translator: "Benedicta Ward SLG (foreword by Metropolitan Kallistos Ware)",
    publisher: "Cistercian Publications (CS 59)",
    publishedYear: "c. 5th Cent. · Cistercian Publications 1984",
    editionFormat: "Paperback, 269 pages · The Alphabetical Collection",
    quotes: [
      {
        id: "q-say-1",
        quote: "Go, sit in your cell, and your cell will teach you everything.",
        citation: "Abba Moses the Black, Saying 6",
        likes: 388,
        isFavorited: true
      },
      {
        id: "q-say-2",
        quote: "If you are silent, you will find peace wherever you live.",
        citation: "Abba Poemen, Saying 84",
        likes: 215,
        isFavorited: false
      }
    ],
    relatedBookIds: ["ben-7", "lad-8", "cloud-6"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Sayings+Desert+Fathers+Benedicta+Ward",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Digitized Collection)",
        type: "archive",
        url: "https://archive.org/details/sayingsofdesertf0000unse",
        description: "Open Access archival reading copy"
      }
    ]
  },
  {
    id: "cloud-6",
    title: "The Cloud of Unknowing",
    originalTitle: "Caligo Ignorantis",
    author: "Anonymous English Mystic",
    authorEra: "Late 14th Century · East Midlands / England",
    authorBio: "Anonymous Carthusian monk or contemplative spiritual master writing in Middle English during the great flowering of late medieval English mysticism.",
    category: "Contemplation",
    categoryTag: "Medieval Mysticism",
    progress: 15,
    currentPage: 27,
    currentLocation: "Ch. III: The Work of Love",
    notesCount: 5,
    circleCount: 16,
    coverImage: "",
    bgCode: "#eae8e4",
    codexLabel: "XIV Cent.",
    era: "14th Cent.",
    totalPages: 180,
    summary: "A practical guide to contemplative prayer advising the soul to cast all thoughts and creaturely concepts beneath a cloud of forgetting, while piercing the cloud of unknowing with a sharp dart of longing love.",
    historicalContext: "Written in the era of Richard Rolle, Walter Hilton, and Julian of Norwich, adapting Dionysian negative theology into colloquial, tender English prose for a young hermit.",
    rating: 4.79,
    ratingsCount: 7890,
    reviewsCount: 820,
    ratingBreakdown: [
      { stars: 5, percentage: 70, count: 5523 },
      { stars: 4, percentage: 21, count: 1656 },
      { stars: 3, percentage: 6, count: 473 },
      { stars: 2, percentage: 2, count: 157 },
      { stars: 1, percentage: 1, count: 81 }
    ],
    readingStatus: "want-to-read",
    userRating: 0,
    isbn: "978-0809123322",
    originalLanguage: "Middle English",
    translator: "James Walsh SJ (preface by Simon Tugwell OP)",
    publisher: "Paulist Press (Classics of Western Spirituality)",
    publishedYear: "c. 1375 AD · Paulist Press 1981",
    editionFormat: "Paperback, 180 pages · Modernized English Edition",
    quotes: [
      {
        id: "q-cloud-1",
        quote: "By love he may be gotten and holden; but by thought never.",
        citation: "Chapter 6",
        likes: 340,
        isFavorited: true
      },
      {
        id: "q-cloud-2",
        quote: "Strike upon that thick cloud of unknowing with a sharp dart of longing love.",
        citation: "Chapter 9",
        likes: 260,
        isFavorited: false
      }
    ],
    relatedBookIds: ["theo-2", "lad-8", "say-5"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Cloud+of+Unknowing+Walsh",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Evelyn Underhill Edition)",
        type: "archive",
        url: "https://archive.org/details/cloudofunknowing00unde",
        description: "Classic Evelyn Underhill introduction & text"
      }
    ]
  },
  {
    id: "ben-7",
    title: "Rule of Saint Benedict",
    originalTitle: "Regula Sancti Benedicti",
    author: "Benedict of Nursia",
    authorEra: "c. 480–548 AD · Subiaco / Monte Cassino, Italy",
    authorBio: "Abbot, father of Western monasticism, and patron saint of Europe who established the twelve degrees of humility and monastic moderation.",
    category: "Monastic Law",
    categoryTag: "Western Monasticism",
    progress: 88,
    currentPage: 98,
    currentLocation: "Prologue: Ausculta fili",
    notesCount: 8,
    circleCount: 24,
    coverImage: "",
    bgCode: "#253930",
    codexLabel: "Monte Cassino",
    era: "c. 516 AD",
    totalPages: 112,
    summary: "The master charter of Western cenobitic living, harmonizing prayer (ora), manual work (labora), and sacred reading (lectio divina) under the abbot’s paternal discretion and common fraternal obedience.",
    historicalContext: "Synthesized from the Master's Rule (Regula Magistri) and John Cassian, Benedict provided a balanced, durable framework that preserved learning and culture through the early Middle Ages.",
    rating: 4.86,
    ratingsCount: 9450,
    reviewsCount: 910,
    ratingBreakdown: [
      { stars: 5, percentage: 74, count: 6993 },
      { stars: 4, percentage: 19, count: 1795 },
      { stars: 3, percentage: 5, count: 472 },
      { stars: 2, percentage: 1, count: 94 },
      { stars: 1, percentage: 1, count: 96 }
    ],
    readingStatus: "read",
    userRating: 5,
    userDateFinished: "July 2025",
    isbn: "978-0814612118",
    clavisId: "CPL 1852",
    originalLanguage: "Late Vulgar Latin",
    translator: "Timothy Fry OSB (RB 1980 Edition)",
    publisher: "Liturgical Press",
    publishedYear: "c. 516 AD · Liturgical Press 1982",
    editionFormat: "Paperback, 112 pages · Monastic Centennial Edition",
    quotes: [
      {
        id: "q-ben-1",
        quote: "Listen, O my son, to the precepts of thy master, and incline the ear of thy heart.",
        citation: "Prologue, verse 1",
        likes: 310,
        isFavorited: true
      },
      {
        id: "q-ben-2",
        quote: "Let all guests who arrive be received like Christ; for He is going to say, 'I was a stranger and you took Me in.'",
        citation: "Chapter 53: On the Reception of Guests",
        likes: 275,
        isFavorited: true
      }
    ],
    relatedBookIds: ["say-5", "lad-8", "conf-4"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=Rule+of+Saint+Benedict+Timothy+Fry",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Latin & English Parallel)",
        type: "archive",
        url: "https://archive.org/details/ruleofstbenedict00bene",
        description: "Bilingual edition from Fort Augustus Abbey"
      }
    ]
  },
  {
    id: "lad-8",
    title: "The Ladder of Divine Ascent",
    originalTitle: "Klimax Theias Anabaseos",
    author: "John Climacus",
    authorEra: "c. 579–649 AD · Mount Sinai / Egypt",
    authorBio: "Abbot of Saint Catherine’s Monastery at Mount Sinai, whose 30 steps of ascent remain the essential Lenten reading of Eastern Christianity.",
    category: "Asceticism",
    categoryTag: "Eastern Orthodox",
    progress: 72,
    currentPage: 223,
    currentLocation: "Step 27: Holy Hesychia",
    notesCount: 10,
    circleCount: 19,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB-z_wi-0UXawdFJ6g2TV9M84khNqOk2RgFUJA_9qrxCOLGrgQLDyIuLM6_l8njapO1uMAbCWQ4wvhbiagCkV9tqW6c7p7yVC0B2jX4jsZZjp5wTXs7_THW7KBiTYjD8eRl0LgRYjEUYPA48-kLVUJP-E629dWR7IxPpnztARzZp8TSBXGNNJ95vuswZIt_ZGLli-qOeec5-ONfwjULrHn4G9taxkffMZr-ysLDAzwCCNUBh9Nh2kR7Q",
    codexLabel: "Sinai Codex",
    era: "c. 600 AD",
    totalPages: 310,
    summary: "Thirty rungs of interior spiritual ascent corresponding to Christ’s thirty hidden years, linking radical world renunciation through battle with the passions to the crown of dispassion (apatheia) and agape at Mount Sinai.",
    historicalContext: "Requested by Abbot John of Raithu for the instruction of hermits in the Sinai desert; its visual icon of monks ascending and demons tugging with hooks is celebrated worldwide.",
    rating: 4.87,
    ratingsCount: 4210,
    reviewsCount: 430,
    ratingBreakdown: [
      { stars: 5, percentage: 75, count: 3157 },
      { stars: 4, percentage: 18, count: 757 },
      { stars: 3, percentage: 5, count: 210 },
      { stars: 2, percentage: 1, count: 42 },
      { stars: 1, percentage: 1, count: 44 }
    ],
    readingStatus: "currently-reading",
    userRating: 5,
    isbn: "978-0809123308",
    clavisId: "CPG 7888",
    originalLanguage: "Byzantine Greek",
    translator: "Colm Luibheid & Norman Russell (intro by Kallistos Ware)",
    publisher: "Paulist Press (Classics of Western Spirituality)",
    publishedYear: "c. 600 AD · Paulist Press 1982",
    editionFormat: "Paperback, 310 pages · Sinai Monastic Series",
    quotes: [
      {
        id: "q-lad-1",
        quote: "Hesychia is the unceasing worship and standing before God. The friend of silence draws near to God and, talking to Him in secret, is enlightened by Him.",
        citation: "Step 27: On Holy Solitude",
        likes: 289,
        isFavorited: true
      },
      {
        id: "q-lad-2",
        quote: "Repentance is the renewal of baptism. Repentance is a contract with God for a second life.",
        citation: "Step 5: On Repentance",
        likes: 210,
        isFavorited: false
      }
    ],
    relatedBookIds: ["say-5", "inc-1", "theo-2"],
    externalLinks: [
      {
        label: "Find in University / Local Library",
        type: "worldcat",
        url: "https://www.worldcat.org/search?q=John+Climacus+Ladder+of+Divine+Ascent",
        description: "Search worldwide WorldCat library union catalogs"
      },
      {
        label: "Internet Archive (Holy Transfiguration Monastery Edition)",
        type: "archive",
        url: "https://archive.org/details/ladderofdivineas0000john",
        description: "Open Access Sinai monastic translation"
      }
    ]
  }
];

export const INITIAL_COLLOQUIUM_COMMENTS: DialecticComment[] = [
  {
    id: "beatrice-1",
    author: "Sr. Beatrice Moreau",
    role: "Church History Fellow",
    timeLocation: "Yesterday at Compline · Paris",
    thesisTag: "Thesis #1",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqQDrweYA7aylfdT-KU_qWLg3X4_HYipYi8tSU4nHp8YgKzipSfQJUdmNtXR6G9ZDG--VxVsG159QovhhymqoEBQ_VwDrpY6rPG9ytvlKASa88fqA0iX-1jhGjAOjD1UYsvwX3hTPPe65PtrpdfzLv1oUULvE9ZSeN2T3zT2MoaXuROg3iPqkzgUxdajVrjAg50eV8w7CFvUYS1EIhkORtGgAdKNRxbbT9gUeS3DSu66mHWhNB4TM0Cw",
    assents: 18,
    userAssented: false,
    referenceFolio: "Augustine, Tract. in Io. Evang. 26.4: «Trahitur animus amore...»",
    content: [
      "Father Alistair poses the indispensable question. However, casting this as a binary between irresistible volition and illuminated assent misreads Augustine’s psychology of the affections.",
      "In De Civitate Dei and his later tracts against Julian of Eclanum, Augustine makes evident that grace does not extinguish the faculty of choice, but cures its atrophy through delectatio victrix. Grace presents the Supreme Beauty with such luminous clarity that the will freely desires what it previously fled. It is irresistible not by brute compulsion, but by triumphant loveliness."
    ],
    replies: [
      {
        id: "julian-1-1",
        author: "Julian Thorne",
        role: "Oxford Theological Fellow",
        timeLocation: "Today at Matins · Oxford",
        thesisTag: "Dialectic 1.1",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeiaSzRXfIQWejuIS2XFujc37b0JC1AA5-PgPSAlKYkoNVtfUq1ugt8Q-CIxOrXLkDgmGF0HARuAepg9gQ2zw4SulxJqr317YRb9I8FfwV5Bw4P05XQ4zBSrbepXS8stQlyeaMfCZu9KlvOD72cQ_gy1rhBaAUrsKaTicPdysnSmNm0g8-fA6sG9jRTprw6nMnjuNLGZtGi-6AIfCie-hzlolB7mGQ8NHPFcoxSwe6LZwQlL4qAI03Vg",
        assents: 9,
        userAssented: false,
        content: [
          "@SrBeatriceMoreau Indeed, Sister, but notice how in the preceding chapter (Confessions VIII.10) the will is described as divided against itself: \"It wills not entirely; therefore it commands not entirely.\"",
          "If the will itself is fractured by the penalty of original sin, is the delectatio truly operative on an autonomous assent, or must there be a monergistic reconstitution of the volitional capacity beforehand?"
        ]
      },
      {
        id: "evangeline-1-2",
        author: "Dr. Evangeline Cross",
        role: "Leuven Dogmatics Chair",
        timeLocation: "Today at Prime · Leuven",
        thesisTag: "Dialectic 1.2",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw",
        assents: 12,
        userAssented: false,
        content: [
          "Julian’s observation mirrors Augustine’s own words in VIII.9: «Imperat animus corpori, et paret statim: imperat animus sibi, et resistitur.» The division is existential, not merely theoretical. Assent here is given under divine medicinal rehabilitation (gratia sanans), which restores human freedom to its authentic teleological telos rather than obliterating it."
        ]
      }
    ]
  },
  {
    id: "timothy-2",
    author: "Rev. Timothy Kelly",
    role: "Eastern Patristics Chair",
    timeLocation: "Today at Terce · Dublin",
    thesisTag: "Thesis #2",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw",
    assents: 11,
    userAssented: false,
    content: [
      "It is instructive to contrast Augustine’s internal monologue here with his contemporary, St. John Chrysostom’s Homilies on Romans. Where Augustine’s West will ultimately harden into debates over unconditional decree, the Antiochene tradition maintained the framework of synergia (συνέργεια).",
      "Chrysostom remarks on Romans 13 that Christ puts Himself on as a vesture only where the disciple extends trembling hands. The fig tree encounter remains thoroughly sacramental: the human tear prepares the soul for the uncreated light."
    ]
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  // The Confessions (conf-4)
  {
    id: "q-conf-1",
    bookId: "conf-4",
    bookTitle: "The Confessions",
    chapter: "Book VIII, Chapter 10",
    author: "Sr. Beatrice Moreau",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
    timeAgo: "1h ago",
    topic: "Early Texts",
    title: "The conflict of two wills in Book VIII: volitional division or fractured affections?",
    body: "In VIII.10 Augustine writes: 'The mind orders itself to will, and it is the same mind, yet it does not obey.' Is this primarily a psychological diagnosis of addiction to habit (consuetudo), or a ontological description of will fractured by original sin?",
    repliesCount: 4,
    likesCount: 28,
    saved: true,
    replies: [
      {
        id: "rep-conf-1",
        author: "Julian Thorne",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUi9OF-MVkzfcBcUTZy9YIOM1-orKeKZPElgJyzkIIIs5dOVVBeTT4mZrZKNHVa4pe4PpI8Y_x4yLpdB90os_usM5F9FbDWWXbC5qYZ1u_bdcmMIzOW8dIstBL5Uh00JOMFMn0r3g-GQTcii3ZYcETOaW13oZUUOfSnvUMM09I7lbxcQJnkeasntX0P4cnUPYuhdjHJAV2GZDkC0fP4T0Td5lD9JEKBKo8FERuJPKyy38KpoKFhENp2w",
        timeAgo: "45m ago",
        text: "Notice how in VIII.9 he says 'imperat animus sibi, et resistitur'. The division is existential—habit becomes necessity because love has attached itself to transient goods.",
        likesCount: 14,
        userLiked: false,
        replies: [
          {
            id: "rep-conf-1-sub1",
            author: "Dr. Alistair Vance, O.P.",
            authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg",
            timeAgo: "32m ago",
            text: "@JulianThorne Exactly. Which is why only delectatio victrix—a more delighting beauty—can untangle what mere stoic willpower cannot command.",
            likesCount: 9,
            userLiked: true,
            replyToAuthor: "Julian Thorne",
            replies: [
              {
                id: "rep-conf-1-sub1-deep",
                author: "Julian Thorne",
                authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUi9OF-MVkzfcBcUTZy9YIOM1-orKeKZPElgJyzkIIIs5dOVVBeTT4mZrZKNHVa4pe4PpI8Y_x4yLpdB90os_usM5F9FbDWWXbC5qYZ1u_bdcmMIzOW8dIstBL5Uh00JOMFMn0r3g-GQTcii3ZYcETOaW13oZUUOfSnvUMM09I7lbxcQJnkeasntX0P4cnUPYuhdjHJAV2GZDkC0fP4T0Td5lD9JEKBKo8FERuJPKyy38KpoKFhENp2w",
                timeAgo: "18m ago",
                text: "That distinction between stoic willpower and delectatio victrix is crucial—it anchors Book VIII firmly to his theology of love in Book IX.",
                likesCount: 5,
                userLiked: false,
                replyToAuthor: "Dr. Alistair Vance, O.P."
              }
            ]
          }
        ]
      },
      {
        id: "rep-conf-2",
        author: "Rev. Timothy Kelly",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw",
        timeAgo: "20m ago",
        text: "Eastern readers would see here the paralysis of gnome (the deliberative will) until healed by communion with divine grace.",
        likesCount: 6,
        userLiked: false
      }
    ]
  },
  {
    id: "q-conf-2",
    bookId: "conf-4",
    bookTitle: "The Confessions",
    chapter: "Book VIII, Chapter 12",
    author: "Dr. Alistair Vance, O.P.",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg",
    timeAgo: "3h ago",
    topic: "Early Texts",
    title: "«Tolle, lege» beneath the fig tree: was the child's voice miraculous or everyday providence?",
    body: "Augustine cannot determine whether the singing voice ('pick up and read') belonged to a boy or girl in a nearby game. How does this ambivalence reflect Augustine's doctrine of ordinary creatures serving as instruments of divine grace?",
    repliesCount: 2,
    likesCount: 35,
    saved: false,
    replies: [
      {
        id: "rep-conf-2-1",
        author: "Sr. Beatrice Moreau",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
        timeAgo: "2h ago",
        text: "It highlights Augustine's sacramental cosmology: God speaks not solely through thunder, but through the playful singsong of children in neighbor gardens."
      }
    ]
  },
  {
    id: "q-conf-3",
    bookId: "conf-4",
    bookTitle: "The Confessions",
    chapter: "Book X, Chapter 8",
    author: "Julian Thorne",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUi9OF-MVkzfcBcUTZy9YIOM1-orKeKZPElgJyzkIIIs5dOVVBeTT4mZrZKNHVa4pe4PpI8Y_x4yLpdB90os_usM5F9FbDWWXbC5qYZ1u_bdcmMIzOW8dIstBL5Uh00JOMFMn0r3g-GQTcii3ZYcETOaW13oZUUOfSnvUMM09I7lbxcQJnkeasntX0P4cnUPYuhdjHJAV2GZDkC0fP4T0Td5lD9JEKBKo8FERuJPKyy38KpoKFhENp2w",
    timeAgo: "1d ago",
    topic: "Philosophy",
    title: "The vast fields and palaces of memory in Book X: Christian interiority vs. Platonic anamnesis",
    body: "Augustine calls memory a 'spreading, limitless room'. How does his account of finding God within memory depart from Plotinus and Plato?",
    repliesCount: 4,
    likesCount: 19,
    saved: true
  },

  // On the Incarnation (inc-1)
  {
    id: "q-inc-1",
    bookId: "inc-1",
    bookTitle: "On the Incarnation",
    chapter: "Chapter 4: The Divine Dilemma",
    author: "Rev. Timothy Kelly",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw",
    timeAgo: "4h ago",
    topic: "Early Texts",
    title: "Why does Athanasius insist that repentance alone cannot cure ontological corruption?",
    body: "In §7 Athanasius argues that if transgression were only a legal matter, repentance might suffice; but because humans had fallen into natural corruption (phthora), death held legal and ontological sway. How does this reshape modern penal theories?",
    repliesCount: 2,
    likesCount: 31,
    saved: true,
    replies: [
      {
        id: "rep-inc-1-1",
        author: "Dr. Evangeline Cross",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw",
        timeAgo: "2h ago",
        text: "It demonstrates that salvation for Athanasius is cosmological recreation: God cannot simply cancel a decree when reality itself is decomposing back into nothingness."
      }
    ]
  },
  {
    id: "q-inc-2",
    bookId: "inc-1",
    bookTitle: "On the Incarnation",
    chapter: "Chapter 14: Restoring the Portrait",
    author: "Caleb",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2K4J-k-7_9d5jZz3RsmU4GzK4jR7_g-b8J3fQ4Xp6n7tY4c3bB-w2FkP3z9pQ2m1V4o6n9_l1z8k-8s7q8m",
    timeAgo: "6h ago",
    topic: "Reflections",
    title: "The portrait analogy in §14: The Word re-sitting for the tarnished canvas",
    body: "Athanasius uses the poignant metaphor of an artist who does not throw away a stained wooden portrait, but has the original subject sit again so the portrait can be redrawn. What implications does this hold for Christian anthropology?",
    repliesCount: 1,
    likesCount: 22,
    saved: false
  },

  // The Ladder of Divine Ascent (lad-8)
  {
    id: "q-lad-1",
    bookId: "lad-8",
    bookTitle: "The Ladder of Divine Ascent",
    chapter: "Step 27: On Holy Stillness",
    author: "Alistair Vance",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFeVIMAUZLNLonDKXPpq7S1IayElXZAKzUEHZyNff7J9oJOV1QkgtYPm4eLQ6j9-UYEd_FlhOp7v8Uu5BQOdprI3JIuZsSPcz8DllKXC5CU-spYcTLBVn-kvVygFVnIpk5vb4whpGYgVesqUNqnBVwq-XUpZUohz3VlEiYgoazPdqfg6a5KQqssltiOQMBJ0DlE9K7gZVLPeFd_t0Hd2Qe8c4LBk3jFT5k-UDsckXa4H0LjZA7Uey_fw",
    timeAgo: "8h ago",
    topic: "Philosophy",
    title: "Step 27: Distinguishing between outer monastic solitude and inner hesychia",
    body: "John Climacus warns that external solitude without internal vigilance breeds delusion. How do the Sinai monks define the transition from bodily quietude to cardiac prayer?",
    repliesCount: 3,
    likesCount: 27,
    saved: true
  },
  {
    id: "q-lad-2",
    bookId: "lad-8",
    bookTitle: "The Ladder of Divine Ascent",
    chapter: "Step 7: On Joy-Making Mourning",
    author: "Sr. Beatrice Moreau",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
    timeAgo: "1d ago",
    topic: "Early Texts",
    title: "Charmolypi (joy-bearing grief): How can tears be simultaneously sorrowful and ecstatic?",
    body: "In Step 7, grief for sin is transformed by divine consolation into radiant peace. What does this reveal about asceticism as life-giving rather than morbid?",
    repliesCount: 2,
    likesCount: 16,
    saved: false
  },

  // The City of God (civ-3)
  {
    id: "q-civ-1",
    bookId: "civ-3",
    bookTitle: "The City of God",
    chapter: "Book XIV, Chapter 28",
    author: "Julian Thorne",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUi9OF-MVkzfcBcUTZy9YIOM1-orKeKZPElgJyzkIIIs5dOVVBeTT4mZrZKNHVa4pe4PpI8Y_x4yLpdB90os_usM5F9FbDWWXbC5qYZ1u_bdcmMIzOW8dIstBL5Uh00JOMFMn0r3g-GQTcii3ZYcETOaW13oZUUOfSnvUMM09I7lbxcQJnkeasntX0P4cnUPYuhdjHJAV2GZDkC0fP4T0Td5lD9JEKBKo8FERuJPKyy38KpoKFhENp2w",
    timeAgo: "1d ago",
    topic: "Philosophy",
    title: "Amor Dei vs. Amor sui: Augustine's definition of the two cities",
    body: "Book XIV.28 concludes: 'Two cities have been formed by two loves: the earthly by the love of self, even to the contempt of God; the heavenly by the love of God, even to the contempt of self.' How does this challenge Roman virtus?",
    repliesCount: 4,
    likesCount: 38,
    saved: true
  },

  // Mystical Theology (theo-2)
  {
    id: "q-theo-1",
    bookId: "theo-2",
    bookTitle: "Mystical Theology",
    chapter: "Chapter 1: The Divine Darkness",
    author: "Dr. Evangeline Cross",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw",
    timeAgo: "2d ago",
    topic: "Philosophy",
    title: "Apophatic contemplation: Ascending into the 'dazzling darkness of silence'",
    body: "Pseudo-Dionysius urges Timothy to leave behind sensations and intellectual activities. How does apophasis differ from agnosticism or philosophical skepticism?",
    repliesCount: 5,
    likesCount: 41,
    saved: false
  },

  // The Sayings of the Desert Fathers (sayings-5)
  {
    id: "q-say-1",
    bookId: "sayings-5",
    bookTitle: "The Sayings of the Desert Fathers",
    chapter: "Apophthegmata §Abba Moses",
    author: "Beatrice Moreau",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
    timeAgo: "2d ago",
    topic: "History",
    title: "Abba Moses and the basket of leaking sand: The desert ethic of non-judgment",
    body: "When summoned to judge a brother who had committed a fault, Abba Moses arrived carrying a leaking basket of sand behind his back: 'My sins run out behind me, and I do not see them; and today I am come to judge the mistakes of another.'",
    repliesCount: 3,
    likesCount: 49,
    saved: true
  },

  // General questions
  {
    id: "q-grace-romans",
    author: "Dr. Alistair Vance, O.P.",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg",
    timeAgo: "2h ago",
    topic: "History",
    title: "How did the early church fathers interpret Grace in the Book of Romans?",
    body: "In examining early patristic commentaries on Romans 3–8 (notably Ambrosiaster, Origen, and Chrysostom), grace is treated primarily as the unmerited re-creation of the broken human will rather than an impersonal forensic transfer.",
    repliesCount: 14,
    likesCount: 52,
    saved: true,
    replies: [
      {
        id: "rep-grace-1",
        author: "Sr. Beatrice Moreau",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
        timeAgo: "1h ago",
        text: "Chrysostom insists in Homily 10 that grace does not extinguish human agency but quickens it, like sunlight restoring vitality to the soil."
      },
      {
        id: "rep-grace-2",
        author: "Rev. Timothy Kelly",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw",
        timeAgo: "40m ago",
        text: "The Latin West with Ambrosiaster begins foregrounding unmerited favor apart from the ceremonial law, preparing the framework Augustine deepened."
      }
    ]
  },
  {
    id: "q-atonement-patristic",
    author: "Prof. Marcus Aurelius Sterling",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWVsnRxVXorUVb9YhYuUMfIIg811w3eXDs7auWP34totzlhPTvcw8Mz_MhHPsZgC4ChzhSjIFuoKCzueO5pusWVgD2CZa9lL2Edor_4J9ZvC19yxxIhgtEY1lV8-__qmUPNgCtDo7bH8u8EzJuYaBk_8iQXAlKIBITJHNg4UWaDRJSFWI3tcgY3EjGblw694wYpkTtczJ-lP2jpWRtIynIPyYt5HzmrqPg-Ga6Xeo7AYA3v0P0nh8WHg",
    timeAgo: "5h ago",
    topic: "Philosophy",
    title: "Understanding the teaching of Atonement in the early church",
    body: "Before late scholastic formulations of penal substitution, the dominant patristic understanding centered on Christus Victor and recapitulation—Christ restoring human nature by experiencing all its stages and swallowing mortality in His divine life.",
    repliesCount: 4,
    likesCount: 39,
    saved: true,
    replies: [
      {
        id: "rep-atonement-1",
        author: "Julian Thorne",
        authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUi9OF-MVkzfcBcUTZy9YIOM1-orKeKZPElgJyzkIIIs5dOVVBeTT4mZrZKNHVa4pe4PpI8Y_x4yLpdB90os_usM5F9FbDWWXbC5qYZ1u_bdcmMIzOW8dIstBL5Uh00JOMFMn0r3g-GQTcii3ZYcETOaW13oZUUOfSnvUMM09I7lbxcQJnkeasntX0P4cnUPYuhdjHJAV2GZDkC0fP4T0Td5lD9JEKBKo8FERuJPKyy38KpoKFhENp2w",
        timeAgo: "3h ago",
        text: "Irenaeus of Lyons in Adversus Haereses V is the classic foundational witness: Christ 'recapitulated' humanity in Himself to undo the disobedience of Adam."
      }
    ]
  },
  {
    id: "q-gen-1",
    author: "Alistair Vance",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFeVIMAUZLNLonDKXPpq7S1IayElXZAKzUEHZyNff7J9oJOV1QkgtYPm4eLQ6j9-UYEd_FlhOp7v8Uu5BQOdprI3JIuZsSPcz8DllKXC5CU-spYcTLBVn-kvVygFVnIpk5vb4whpGYgVesqUNqnBVwq-XUpZUohz3VlEiYgoazPdqfg6a5KQqssltiOQMBJ0DlE9K7gZVLPeFd_t0Hd2Qe8c4LBk3jFT5k-UDsckXa4H0LjZA7Uey_fw",
    timeAgo: "2h ago",
    topic: "Early Texts",
    title: "How did John Chrysostom reconcile foreknowledge and free will in his Romans commentary?",
    body: "Looking closely at Homily XVI, Chrysostom seems to emphasize human initiative alongside divine knowledge. How have other readers understood his balance between the two?",
    repliesCount: 18,
    likesCount: 24,
    saved: false
  }
];

export const INITIAL_PATHS: ReadingPath[] = [
  {
    id: "path-foundations",
    title: "Patristic Foundations Timeline",
    category: "Historical Timeline",
    timeLeft: "Est. 3 wks left",
    percentage: 67,
    description: "From the Apostolic Fathers through the Council of Nicaea, charting theological crystallization and creedal development.",
    currentStepLabel: "Ignatius & Polycarp Letters",
    currentLectioLabel: "Lectio 12 of 18",
    totalSteps: 6,
    completedSteps: 4,
    nextStepLabel: "Origen on First Principles",
    lastReadNote: "Last read yesterday at Compline",
    curator: {
      name: "Prof. Marcus Aurelius Sterling",
      title: "Curator · Chair of Patrology",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcmDn06-sqXxs2g1H8h8D7h5GgIYWKFqfAHtrzWTBmP7VbBOi9lsI_bJmMz6GodwQ1T633UDb0qESz_OnsLNaHieZcPaAAl1rTZwobNtseJ2y08JQzcooOHu0pV5OqwqJSkifQlL3brlbDGNvGx28jMXdQpIt6fYWVlvGb-wrxAEUVn_2aIQknuMW5ms6KhcqHCYh7spLnHOiJ6b3Fk3jbdUBGSNeTzhfbCw9K1VtMLo_ySXu4IIscAw"
    },
    stations: [
      {
        id: 1,
        numeral: "I",
        title: "On the Incarnation (De Incarnatione)",
        authorEra: "by St. Athanasius · c. 319 AD",
        weeksLabel: "Weeks 1–2",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAI_m8pecZmunIyCDggh3PutoWuuuEGb0ILqkVKycRqFYHP6qPU5PIcZc_FrC-LsRt6DP0VqAJbpvnwWMkIjR9QMoec9JNBJmsFBh44_DnKIuu4t2x7zXUiSUx3hY8U7wV7Xe-It8zMp_m9TtVq8IjwMRAg9kq0fsi5t7ZoH8m2FKe1x9HaxiuoExNK93rb6J7IUPNlgwICLILigmEo0kCpN--lQrZz_xY6U7Xpj9tbVDqULDwnU6IvXg",
        publisher: "St. Vladimir Seminary Press",
        pages: "96 Pages",
        quote: "“Pay special attention to sections 4–5 on the divine dilemma: mortality itself as an ontological slide toward non-being.”",
        completed: false,
        status: "active",
        colloquiumCount: 42,
        reviewsCount: 18
      },
      {
        id: 2,
        numeral: "II",
        title: "Life of St. Antony (Vita Antonii)",
        authorEra: "by St. Athanasius · c. 357 AD",
        weeksLabel: "Week 3",
        quote: "“The canonical blueprint of Western monasticism and desert contemplation.”",
        completed: false,
        status: "scheduled",
        reviewsCount: 9
      },
      {
        id: 3,
        numeral: "III",
        title: "Confessions (Books I–IX)",
        authorEra: "by St. Augustine · c. 400 AD",
        weeksLabel: "Week 4",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDF-ZisIhXSrC6LfIfhwXFb5Ks-stwsM_qX-PKWIPcDDipYBjFb3gJtx7qhKpHjdYGZ1MrgJ9x4Ipnw00hvNJ9LZC9hv_hJdGvVO_kyyJDGi4f24qKUL7hDoACL7kI2gtNJNZUVTVV3opnsW8owv6z6oawRU_wKpWbU-hmGXbEygD53XJx7rlg0SoMmJlyoDO66O6FxZX4MJblO7JtrmttaUC861sS99tbmmsPDNPGQ0kfYqKnaYYQbQ",
        quote: "“Observe how memory functions as an inner cathedral where God dwells.”",
        completed: false,
        status: "locked"
      }
    ]
  },
  {
    id: "path-trinity",
    title: "Early Church Fathers & The Trinity",
    category: "Curated Patristic Path",
    timeLeft: "Est. 10 days left",
    percentage: 60,
    description: "Classical trinitarian theology exploring Athanasius of Alexandria, Basil of Caesarea, and Gregory of Nyssa's homilies.",
    currentStepLabel: "De Incarnatione (Contra Arianos)",
    currentLectioLabel: "Lectio 9 of 15",
    totalSteps: 5,
    completedSteps: 3,
    nextStepLabel: "The Cappadocian Settlement",
    lastReadNote: "4 contemplative notes logged",
    stations: []
  },
  {
    id: "path-monastic",
    title: "Monastic Wisdom & Contemplation",
    category: "Monastic Lineage",
    timeLeft: "Est. 4 weeks left",
    percentage: 25,
    description: "Essential ascetic classics: Rule of Saint Benedict, Sayings of the Desert Fathers, and John Cassian’s Conferences on prayer.",
    currentStepLabel: "Apophthegmata Patrum (Desert Solitude)",
    currentLectioLabel: "Lectio 2 of 8",
    totalSteps: 4,
    completedSteps: 1,
    nextStepLabel: "The Twelve Degrees of Humility",
    lastReadNote: "Queued for Sext readings",
    stations: []
  },
  {
    id: "path-augustine-civic",
    title: "Augustinian Civic Theology",
    category: "Theology & Society",
    timeLeft: "Est. 6 weeks left",
    percentage: 17,
    description: "The two cities, temporal peace, and heavenly beatitude across Augustine’s magnum opus, select epistles, and homilies.",
    currentStepLabel: "De Civitate Dei: Books I–V",
    currentLectioLabel: "Lectio 2 of 12",
    totalSteps: 6,
    completedSteps: 1,
    nextStepLabel: "Pagan Vertu vs Christian Caritas",
    lastReadNote: "Saved from St. Victor Collection",
    stations: []
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    bookId: "conf-4",
    bookTitle: "Confessions",
    bookAuthor: "Aurelius Augustinus Hipponensis",
    tradition: "Patristic",
    rating: 5.0,
    reviewerName: "Rev. Timothy Kelly",
    reviewerAffiliation: "Holy Trinity, Dublin",
    reviewerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqGARBa2LnesEv4_RluTs_tszz32I2IZ7WxGYkKQcgVCSv13VWhwqZNDu0ofE2BTuMB_9nPb_taP519jKeVUuFI2KLKsK65XJel0yGvhi-RA9mT2OaTQH57MIb84H_uZVaNLFuGrcA6pWAbSIlM5oKKorwN621KKarC7L5FtaOkftSXBne9YASbgu0lsQEP6c2AHO-GPv2EM4RtVud_cDVWTKajQV2fPeDziTqSx6N4KsuxEpi19Ig4g",
    date: "Oct 14",
    quote: "“Augustine’s pivot in Book XI dissolves naive chronometry; time is no cosmological backdrop, but a distentio animi—the very fracture of conscious soul hungering for divine eternity.”",
    citation: "Conf. XI.xxvi.33 (CCL 27, 206)",
    discussionCount: 34,
    likesCount: 42,
    userLiked: false,
    userSaved: false,
    bookCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdAq9atrTR3DAeW72VICqn9K4gQeTGTq5i_EkEKp9xw_z6BfR65kHsmNyWDZJDg80JosDQ3gRvqwwNRBKzcvvkB7mjFRd49H-ETrGxAIXfIcxwWguELZAYCA4fx1lJ8U1sDbGw3CiNvb2lYG9hbCJnYFsGpNkkvkSAB4Uw3fc5SyNn98T2Cv8wjS32Td_xxXV3ZTdB31kNoNYLLCPfdBVjq82djYAPduVvMFFaj1nf--P168Ds3Y20ew",
    chapterFocus: "Book XI: Memory, Temporality, and the Distended Soul",
    keyThemes: ["Temporality vs. Eternity", "Distentio Animi", "Psychology of Memory", "Patristic Epistemology"],
    historicalContext: "Composed c. 397–400 AD following Augustine's episcopal consecration at Hippo Regius. It directly confronts both Manichaean cosmic determinism and late Neoplatonic speculative metaphysics.",
    fullReview: "Augustine's Confessions remains unparalleled not merely because it created the genre of theological autobiography, but because its structure systematically collapses speculative philosophy into prayerful address.\n\nIn Books I through IX, Augustine narrates the restless journey of his divided will—from childhood disobedience in Thagaste to pear-theft, Manichaean disillusionment, Milanese rhetoric, and the climactic garden conversion under the fig tree. Yet modern commentators frequently stumble over why the work concludes with four dense speculative treatises on memory (Book X), time (Book XI), and creation in Genesis (Books XII–XIII).\n\nThe answer lies in Book XI's brilliant psychological breakthrough: time is neither an astronomical wheel nor a self-subsisting container, but a distentio animi—the extension and scattering of the finite mind. Caught between memory of what has slipped into the past and anticipation of an uncertain future, human consciousness is chronically dispersed. For Augustine, true contemplation is the interior gathering of this scattered consciousness back toward the immutable presence of God.\n\nThis scholarly edition (CCL 27) preserves the precise cadence of Augustine's prayer-rhetoric. For anyone wrestling with the fragmentation of contemporary attention, Book XI offers not just an ancient philosophy of time, but an urgent therapeutic discipline."
  },
  {
    id: "rev-2",
    bookId: "inc-1",
    bookTitle: "On the Incarnation",
    bookAuthor: "St. Athanasius the Great",
    tradition: "Soteriology",
    rating: 5.0,
    reviewerName: "Prof. Marcus Aurelius Sterling",
    reviewerAffiliation: "Cambridge",
    reviewerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWVsnRxVXorUVb9YhYuUMfIIg811w3eXDs7auWP34totzlhPTvcw8Mz_MhHPsZgC4ChzhSjIFuoKCzueO5pusWVgD2CZa9lL2Edor_4J9ZvC19yxxIhgtEY1lV8-__qmUPNgCtDo7bH8u8EzJuYaBk_8iQXAlKIBITJHNg4UWaDRJSFWI3tcgY3EjGblw694wYpkTtczJ-lP2jpWRtIynIPyYt5HzmrqPg-Ga6Xeo7AYA3v0P0nh8WHg",
    date: "Sep 29",
    quote: "“Athanasius forcefully secures the ontological recreation of the corrupted imago Dei. Deliverance here is not merely forensic acquittal, but life subsuming death at the root.”",
    citation: "De Incarnatione §9 (SC 199, 298)",
    discussionCount: 52,
    likesCount: 68,
    userLiked: true,
    userSaved: false,
    bookCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu_2ww57FnXFo1rc3rspu-DqiiShr5Lsjc2hZk7L4n0wPX2MzKxwgkQCS_IsDXQPE-8KI6qlFbwetrYsbiWJK9JrjjYWwg3gyT8ziaYASuijkRtphb3IMdmay7aFelBeaoznsUdq0qgjApnCvGyYFMFyH5whfNR8AjkOzS4B4JG4MBxpVEoDzlvtYnnfH1AiuwgqDFkre6bcVrRAjfC7PxANigFH8toH1I9Ucu37Q0rxCh-nfzLjCwrQ",
    chapterFocus: "Chapters 1–4: The Divine Dilemma & Ontological Restoration",
    keyThemes: ["Christus Victor", "Ontological Re-creation", "The Divine Dilemma", "Theosis / Deification"],
    historicalContext: "Authored in Alexandria c. 318–335 AD prior to or just after the Council of Nicaea, establishing the dogmatic cornerstone of anti-Arian Nicene theology.",
    fullReview: "Athanasius of Alexandria's 'De Incarnatione Verbi Dei' is arguably the most decisive soteriological treatise in Christian history. Written with astonishing clarity and theological economy, it frames the cross not as a courtroom transaction, but as the triumphant resolution to a divine dilemma: God could neither break His word regarding mortality nor allow humanity—created in His rational image—to waste away into utter non-existence.\n\nOnly the Word through whom all things were created could recreate them. In §9, Athanasius deploys the image of a portrait painter returning to restore a stained canvas: the subject must sit once more so that the likeness can be renewed on the very same wood.\n\nDeliverance in Athanasian theology is thoroughly ontological. Because death held reign over mortal bodies, the Word assumed our physical nature, surrendered it to death on behalf of all, and by the indwelling divine life destroyed death from within like straw consumed by fire. A masterpiece of patristic realism."
  },
  {
    id: "rev-3",
    bookId: "lad-8",
    bookTitle: "The Ladder of Divine Ascent",
    bookAuthor: "St. John Climacus (Sinai)",
    tradition: "Orthodox",
    rating: 4.8,
    reviewerName: "Julian Thorne",
    reviewerAffiliation: "Oxford",
    reviewerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuApU2OvLGjTetSvhdhiKy2EMtNZtzlXQrHhnsnO6aMkKDksTXV6M12-SYBaNg62u3auYgWbirN7FAgmfjK4UNsi298Mvb9b_tkbe6POSnBytDzixvcM4q7u28K-b3_kNJe8aq2nIGhftTUVgqjtJeN23-H_lBEVHER64np3-GDix95bjMObm8MekbEV1E0sDLD4GDWKEHT-mCfEjVYbql7BWyWZUQBbUnMTVjfjr9t1eAdNFSR5s-bARg",
    date: "Aug 18",
    quote: "“Step 27 on solitude (hesychia) exposes our modern restlessness: prayer ceases to be verbal exertion and transforms into inner stillness that listens without defense.”",
    citation: "Scala Paradisi, Gradus 27",
    discussionCount: 19,
    likesCount: 29,
    userLiked: false,
    userSaved: false,
    bookCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB-z_wi-0UXawdFJ6g2TV9M84khNqOk2RgFUJA_9qrxCOLGrgQLDyIuLM6_l8njapO1uMAbCWQ4wvhbiagCkV9tqW6c7p7yVC0B2jX4jsZZjp5wTXs7_THW7KBiTYjD8eRl0LgRYjEUYPA48-kLVUJP-E629dWR7IxPpnztARzZp8TSBXGNNJ95vuswZIt_ZGLli-qOeec5-ONfwjULrHn4G9taxkffMZr-ysLDAzwCCNUBh9Nh2kR7Q",
    chapterFocus: "Step 27: Holy Stillness (Hesychia) & Custody of Thoughts",
    keyThemes: ["Hesychasm", "Vigilance (Nepsis)", "Custody of the Heart", "Spiritual Discrimination"],
    historicalContext: "Written in the late 6th century at Saint Catherine's Monastery on Mount Sinai at the request of Abbot John of Raithu.",
    fullReview: "The Ladder of Divine Ascent stands alongside the Sayings of the Desert Fathers as the preeminent textbook of Eastern Christian hesychasm. Composed of thirty rungs corresponding to the thirty hidden years of Christ's earthly life, it traces a psychological and spiritual map from initial renunciation of worldly distraction to love (agape) and dispassion (apatheia).\n\nClimacus is an incisive observer of the human heart. His dissection of despondency (acedia), vainglory (kenodoxia), and anger reads with startling psychological acuity. Unlike later scholastic treatises that categorize sins abstractly, Climacus observes how a wandering eye or an unvoiced resentment metastasizes into spiritual numbness.\n\nIn Step 27, Climacus defines hesychia not simply as external silence, but as 'the unceasing worship and standing before God of the soul and body.' For readers exploring monastic contemplation, this text provides a rigorous, uncompromising, yet compassionate mirror."
  },
  {
    id: "rev-4",
    bookId: "theo-2",
    bookTitle: "Mystical Theology",
    bookAuthor: "Pseudo-Dionysius the Areopagite",
    tradition: "Orthodox",
    rating: 4.9,
    reviewerName: "Beatrice Moreau",
    reviewerAffiliation: "Sorbonne / Sophia Fellow",
    reviewerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
    date: "Yesterday",
    quote: "“Dionysius leads the mind past speculative dialectic into radiant stillness—where the unapproachable light of the divine essence outshines all creaturely faculties.”",
    citation: "Theol. Myst. I.i (PG 3, 997A)",
    discussionCount: 8,
    likesCount: 15,
    userLiked: false,
    userSaved: true,
    bookCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdAq9atrTR3DAeW72VICqn9K4gQeTGTq5i_EkEKp9xw_z6BfR65kHsmNyWDZJDg80JosDQ3gRvqwwNRBKzcvvkB7mjFRd49H-ETrGxAIXfIcxwWguELZAYCA4fx1lJ8U1sDbGw3CiNvb2lYG9hbCJnYFsGpNkkvkSAB4Uw3fc5SyNn98T2Cv8wjS32Td_xxXV3ZTdB31kNoNYLLCPfdBVjq82djYAPduVvMFFaj1nf--P168Ds3Y20ew",
    chapterFocus: "Chapter 1: The Divine Darkness & The Cloud of Unknowing",
    keyThemes: ["Apophatic Theology", "Hyper-Essential Darkness", "Mystical Union", "Limits of Reason"],
    historicalContext: "Written c. 500 AD under the apostolic pseudonym, integrating late antique Proclean metaphysics with rigorous Christian apophaticism.",
    fullReview: "Pseudo-Dionysius's 'Mystical Theology' spans barely five brief chapters, yet it fundamentally transformed both Eastern hesychasm and Western scholasticism—from Maximus the Confessor and Gregory Palamas to Albert the Great, Thomas Aquinas, Meister Eckhart, and the author of The Cloud of Unknowing.\n\nDionysius establishes that God is neither an object of empirical observation nor an idea grasped by deductive logic. Moving beyond affirmative (kataphatic) theology, which names God as Goodness, Being, and Light, the mind must undergo apophatic stripping: denying all concepts, images, and conceptual categories because God surpasses them all.\n\nThis 'divine darkness' is not an absence of light or agnostic skepticism; it is an excess of transcendent brightness that blinds created sight. The goal is unitive knowing beyond knowing (agnosia), where intellect yields to ecstatic communion."
  },
  {
    id: "rev-civ-god",
    bookId: "civ-3",
    bookTitle: "The City of God",
    bookAuthor: "Aurelius Augustinus Hipponensis",
    tradition: "Patristic",
    rating: 5.0,
    reviewerName: "Dr. Beatrice Moreau",
    reviewerAffiliation: "Sorbonne / Sophia Fellow",
    reviewerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA",
    date: "3d ago",
    quote: "“A magnum opus that dismantled the pagan civic theology of antiquity. Augustine contrasts the city of man, built on the love of self unto contempt of God, with the city of God, built on the love of God unto contempt of self.”",
    citation: "De Civitate Dei XIV.xxviii (CCL 48, 451)",
    discussionCount: 28,
    likesCount: 47,
    userLiked: true,
    userSaved: true,
    bookCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAY-M96fKj-XJv0WwZc1p9e67_y8aK3_2o0H4-98z7j_3e7qQ5r6y9e0-1v2w3x4y5z6a7b8c9d0",
    chapterFocus: "Books XIV & XIX: The Two Loves and the Tranquillity of Order",
    keyThemes: ["Two Cities (Civitas Terrena vs Dei)", "Saeculum & Political Realism", "Tranquillitas Ordinis", "True Justice"],
    historicalContext: "Written across 413–426 AD in response to pagan accusations following the catastrophic sack of Rome by Alaric in 410 AD.",
    fullReview: "When Alaric's Visigoths sacked Rome in 410 AD, shock reverberated across the Mediterranean world. Pagans blamed Christianity for abandoning the ancestral gods who had preserved imperial hegemony. Augustine answered this existential crisis with twenty-two books of sweeping historical, philosophical, and theological counter-apologetics.\n\nThe core of Augustine's argument hinges on moral teleology: societies are defined not by race, soil, or imperial borders, but by an assembly of rational beings united in fellowship by a common love (Book XIX.24). Two loves have formed two cities: the earthly city driven by libido dominandi (lust for power) and amor sui (self-love unto contempt of God), and the heavenly city animated by caritas and amor Dei (love of God unto contempt of self).\n\nCrucially, Augustine refuses to identify either city with empirical institutions. Both cities are hopelessly entangled (permixtae) in the historical saeculum until the eschaton. Christians participate in temporal civil peace as resident aliens, cherishing order while refusing to idolize empire."
  }
];

export const INITIAL_NOTES: Note[] = [
  {
    id: "note-1",
    bookTitle: "On the Incarnation",
    timeAgo: "2d ago",
    text: "“He became what we are that He might make us what He is. Essential meditation on divine condescension and the restoration of humanity's primordial glory.”",
    tag: "Marginal Annotation",
    location: "Ch. IV · p. 42",
    accentColor: "#466550"
  },
  {
    id: "note-2",
    bookTitle: "Mystical Theology",
    timeAgo: "4d ago",
    text: "“The brilliant darkness that outshines all understanding. Apophatic prayer contrasted with intellectual analysis—entering into unseeing silence.”",
    tag: "Contemplative Insight",
    location: "Ch. II",
    accentColor: "#030406"
  },
  {
    id: "note-3",
    bookTitle: "City of God",
    timeAgo: "1w ago",
    text: "“Two loves formed two cities: the love of self, even to the contempt of God, the earthly city; and the love of God, even to the contempt of self, the heavenly.”",
    tag: "Philosophical Note",
    location: "Book XIV · p. 280",
    accentColor: "#693a30"
  },
  {
    id: "note-4",
    bookTitle: "Confessions",
    timeAgo: "2w ago",
    text: "“Tolle, lege! The hearing of the child's chant in the Milan garden. Memory as an interior sanctuary of mind and grace.”",
    tag: "Lectio Divina",
    location: "Book VIII · Ch. 12",
    accentColor: "#466550"
  },
  {
    id: "note-5",
    bookTitle: "Patristic Foundations",
    timeAgo: "3w ago",
    text: "“Synthesizing the distinction between Ousia and Hypostasis from the Cappadocian settlement. Crucial anchor for trinitarian clarity.”",
    tag: "Study Note",
    location: "Unit 3",
    accentColor: "#76777b"
  }
];

export const INITIAL_BOOKMARKS: Bookmark[] = [
  {
    id: "bm-1",
    category: "Patristics",
    source: "Confessions · Book X, 27",
    quote: "“Late have I loved you, beauty so ancient and so new, late have I loved you! Lo, you were within, but I outside, seeking there for you...”",
    author: "St. Augustine of Hippo",
    initials: "SA",
    isFavorite: true
  },
  {
    id: "bm-2",
    category: "Theology",
    source: "City of God · Book XIX, Ch. 13",
    quote: "“The peace of the celestial city is the perfectly ordered and harmonious enjoyment of God, and of one another in God.”",
    author: "St. Augustine of Hippo",
    initials: "SA",
    isFavorite: true
  },
  {
    id: "bm-3",
    category: "Christology",
    source: "On the Incarnation · Ch. IV, 1",
    quote: "“For He was made man that we might be made God; and He manifested Himself by a body that we might receive the idea of the unseen Father...”",
    author: "Athanasius of Alexandria",
    initials: "AA",
    isFavorite: true
  },
  {
    id: "bm-4",
    category: "Mystica",
    source: "Mystical Theology · Ch. I",
    quote: "“Unto this darkness which is beyond light, we pray that we may come, and through loss of sight and knowledge may see and know That which transcends vision and knowledge...”",
    author: "Pseudo-Dionysius",
    initials: "PD",
    isFavorite: true
  },
  {
    id: "bm-5",
    category: "Regula",
    source: "The Rule of St. Benedict · Prologue",
    quote: "“Listen, O my son, to the precepts of thy master, and incline the ear of thy heart; receive willingly and fulfill effectively the advice of a devoted father...”",
    author: "St. Benedict of Nursia",
    initials: "SB",
    isFavorite: true
  }
];

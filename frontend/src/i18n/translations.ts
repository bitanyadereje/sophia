export type Language = 'en' | 'am';

export interface Translations {
  // Brand & General
  'brand.title': string;
  'brand.subtitle': string;
  'brand.tagline': string;

  // Navigation
  'nav.home': string;
  'nav.paths': string;
  'nav.saved': string;
  'nav.library': string;
  'nav.discussions': string;
  'nav.reviews': string;
  'nav.colloquium': string;
  'nav.notes': string;
  'nav.profile': string;
  'nav.search': string;
  'nav.theme': string;
  'nav.language': string;
  'nav.menu': string;
  'nav.close': string;
  'nav.sanctuary': string;
  'nav.scriptoriumPaths': string;

  // Header & Search
  'header.searchPlaceholder': string;
  'header.themeMenuTitle': string;
  'header.selectStyle': string;
  'header.toggleLanguage': string;
  'header.languageName': string;

  // Saved / Library View
  'saved.title': string;
  'saved.subtitle': string;
  'saved.tabBookmarks': string;
  'saved.tabNotes': string;
  'saved.tabLibrary': string;
  'saved.filterAll': string;
  'saved.filterReading': string;
  'saved.filterTBR': string;
  'saved.filterRead': string;
  'saved.filterDnf': string;
  'saved.searchPlaceholder': string;
  'saved.addToTbr': string;
  'saved.saveToLibrary': string;
  'saved.sortBy': string;
  'saved.sortRecent': string;
  'saved.sortTitle': string;
  'saved.sortRating': string;
  'saved.sortProgress': string;
  'saved.status': string;
  'saved.statusReading': string;
  'saved.statusTbr': string;
  'saved.statusRead': string;
  'saved.statusDnf': string;
  'saved.progress': string;
  'saved.completed': string;
  'saved.pages': string;
  'saved.notesCount': string;
  'saved.circlesCount': string;
  'saved.changeStatus': string;
  'saved.viewBook': string;
  'saved.openSeminar': string;
  'saved.noBooksFound': string;
  'saved.noBooksDesc': string;
  'saved.noBookmarksFound': string;
  'saved.noBookmarksDesc': string;
  'saved.noNotesFound': string;
  'saved.noNotesDesc': string;
  'saved.newBookmark': string;
  'saved.newNote': string;
  'saved.editBookmark': string;
  'saved.editNote': string;
  'saved.copyPassage': string;
  'saved.copied': string;
  'saved.deletePrompt': string;
  'saved.quotation': string;
  'saved.author': string;
  'saved.source': string;
  'saved.category': string;
  'saved.reflection': string;
  'saved.marginalia': string;
  'saved.tag': string;
  'saved.location': string;

  // Home Feed
  'home.welcome': string;
  'home.subtitle': string;
  'home.dailyContemplation': string;
  'home.todaysLectio': string;
  'home.explorePaths': string;
  'home.browseCatalog': string;
  'home.recentDiscussions': string;
  'home.featuredReview': string;
  'home.communityFeed': string;
  'home.joinSeminar': string;
  'home.quoteOfTheDay': string;
  'home.continueReading': string;

  // Colloquium & Seminars
  'colloquium.title': string;
  'colloquium.subtitle': string;
  'colloquium.volumeDirectory': string;
  'colloquium.dialecticRoom': string;
  'colloquium.assent': string;
  'colloquium.assents': string;
  'colloquium.reply': string;
  'colloquium.replies': string;
  'colloquium.folio': string;
  'colloquium.thesisTag': string;
  'colloquium.enterSeminar': string;
  'colloquium.tableOfContents': string;
  'colloquium.addAnnotation': string;

  // Discussions & Q&A
  'discussions.title': string;
  'discussions.subtitle': string;
  'discussions.askQuestion': string;
  'discussions.searchPlaceholder': string;
  'discussions.allTopics': string;
  'discussions.earlyTexts': string;
  'discussions.philosophy': string;
  'discussions.reflections': string;
  'discussions.history': string;
  'discussions.answers': string;
  'discussions.likes': string;
  'discussions.submitAnswer': string;
  'discussions.writeReply': string;
  'discussions.noDiscussions': string;

  // Reviews
  'reviews.title': string;
  'reviews.subtitle': string;
  'reviews.writeReview': string;
  'reviews.filterTradition': string;
  'reviews.allTraditions': string;
  'reviews.peerReviewed': string;
  'reviews.rating': string;
  'reviews.helpful': string;
  'reviews.ratingsBreakdown': string;
  'reviews.readReview': string;

  // Reading Paths
  'paths.title': string;
  'paths.subtitle': string;
  'paths.activeCurriculum': string;
  'paths.allCurricula': string;
  'paths.stations': string;
  'paths.weeks': string;
  'paths.curator': string;
  'paths.startPath': string;
  'paths.continuePath': string;
  'paths.completed': string;

  // Profile
  'profile.title': string;
  'profile.annualGoal': string;
  'profile.booksRead': string;
  'profile.notesRecorded': string;
  'profile.dayStreak': string;
  'profile.topicsOfInterest': string;
  'profile.preferences': string;
  'profile.languageSetting': string;
  'profile.themeSetting': string;
  'profile.memberSince': string;

  // Common UI
  'common.save': string;
  'common.cancel': string;
  'common.close': string;
  'common.edit': string;
  'common.delete': string;
  'common.back': string;
  'common.read': string;
  'common.view': string;
  'common.search': string;
  'common.filter': string;
  'common.all': string;
  'common.loading': string;
  'common.add': string;
  'common.confirm': string;
  'common.share': string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Brand & General
    'brand.title': 'Sophia',
    'brand.subtitle': 'Historical Library',
    'brand.tagline': 'A digital haven for contemplative reading and classical inquiry.',

    // Navigation
    'nav.home': 'Home',
    'nav.paths': 'Paths',
    'nav.saved': 'Saved',
    'nav.library': 'Library',
    'nav.discussions': 'Discussions',
    'nav.reviews': 'Reviews',
    'nav.colloquium': 'Book Discussions',
    'nav.notes': 'Private Notes',
    'nav.profile': 'Reader Profile',
    'nav.search': 'Search',
    'nav.theme': 'Manuscript Themes',
    'nav.language': 'Language',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.sanctuary': 'Home',
    'nav.scriptoriumPaths': 'Sophia Paths',

    // Header & Search
    'header.searchPlaceholder': 'Search Catalog and Texts (Press / or tap)',
    'header.themeMenuTitle': 'Manuscript Themes',
    'header.selectStyle': 'Select style',
    'header.toggleLanguage': 'Switch language (English / አማርኛ)',
    'header.languageName': 'English',

    // Saved / Library View
    'saved.title': 'Saved',
    'saved.subtitle': 'Manage your personal library, private reading notes, and illuminated bookmarks.',
    'saved.tabBookmarks': 'Bookmarks',
    'saved.tabNotes': 'Notes',
    'saved.tabLibrary': 'Books',
    'saved.filterAll': 'All',
    'saved.filterReading': 'Reading',
    'saved.filterTBR': 'TBR',
    'saved.filterRead': 'Read',
    'saved.filterDnf': 'DNF',
    'saved.searchPlaceholder': 'Search saved books, authors, or categories...',
    'saved.addToTbr': 'Add to TBR',
    'saved.saveToLibrary': 'Save to Library',
    'saved.sortBy': 'Sort by:',
    'saved.sortRecent': 'Recently Added',
    'saved.sortTitle': 'Title (A-Z)',
    'saved.sortRating': 'Highest Rated',
    'saved.sortProgress': 'Reading Progress',
    'saved.status': 'Status',
    'saved.statusReading': 'Currently Reading',
    'saved.statusTbr': 'Want to Read (TBR)',
    'saved.statusRead': 'Read / Finished',
    'saved.statusDnf': 'Did Not Finish',
    'saved.progress': 'Progress',
    'saved.completed': 'completed',
    'saved.pages': 'pages',
    'saved.notesCount': 'notes',
    'saved.circlesCount': 'in discussion',
    'saved.changeStatus': 'Update status',
    'saved.viewBook': 'View Book Details',
    'saved.openSeminar': 'Open Seminar',
    'saved.noBooksFound': 'No books matching this filter',
    'saved.noBooksDesc': 'Try choosing another shelf tab or search query.',
    'saved.noBookmarksFound': 'No bookmarks found',
    'saved.noBookmarksDesc': 'Save meaningful passages from books and discussions to view them here.',
    'saved.noNotesFound': 'No private notes found',
    'saved.noNotesDesc': 'Record reflections and theological insights while reading.',
    'saved.newBookmark': 'Save Passage',
    'saved.newNote': 'New Reflection Note',
    'saved.editBookmark': 'Edit Bookmark',
    'saved.editNote': 'Edit Reflection',
    'saved.copyPassage': 'Copy passage',
    'saved.copied': 'Passage copied to clipboard',
    'saved.deletePrompt': 'Are you sure you want to remove this item?',
    'saved.quotation': 'Quotation',
    'saved.author': 'Author / Father',
    'saved.source': 'Source / Chapter citation',
    'saved.category': 'Tradition / Category',
    'saved.reflection': 'Reflection / Note',
    'saved.marginalia': 'Notes',
    'saved.tag': 'Theological Topic Tag',
    'saved.location': 'Book / Chapter location',

    // Home Feed
    'home.welcome': 'Welcome to Sophia',
    'home.subtitle': 'A digital haven for contemplative study, classical wisdom, and communal inquiry.',
    'home.dailyContemplation': 'Daily Contemplation',
    'home.todaysLectio': "Today's Lectio Divina",
    'home.explorePaths': 'Explore Reading Paths',
    'home.browseCatalog': 'Browse All Volumes',
    'home.recentDiscussions': 'Recent Community Q&A',
    'home.featuredReview': 'Book Review',
    'home.communityFeed': 'Communal Feed',
    'home.joinSeminar': 'Enter Reading Room',
    'home.quoteOfTheDay': 'Scripture & Ancient Wisdom',
    'home.continueReading': 'Continue Reading',

    // Colloquium & Seminars
    'colloquium.title': 'Book Discussions',
    'colloquium.subtitle': 'Line-by-line communal contemplation and dialectic inquiry across classical codices.',
    'colloquium.volumeDirectory': 'Volumes Directory',
    'colloquium.dialecticRoom': 'Reading Seminar',
    'colloquium.assent': 'Assent',
    'colloquium.assents': 'assents',
    'colloquium.reply': 'Reply',
    'colloquium.replies': 'replies',
    'colloquium.folio': 'Folio Ref',
    'colloquium.thesisTag': 'Thesis',
    'colloquium.enterSeminar': 'Enter Reading Room',
    'colloquium.tableOfContents': 'Table of Chapters',
    'colloquium.addAnnotation': 'Add Annotation',

    // Discussions & Q&A
    'discussions.title': 'Dialectic Inquiries',
    'discussions.subtitle': 'Seek insight, submit theological questions, and deliberate upon enduring paradoxes.',
    'discussions.askQuestion': 'Ask a Question',
    'discussions.searchPlaceholder': 'Search questions and discussions...',
    'discussions.allTopics': 'All Topics',
    'discussions.earlyTexts': 'Early Texts',
    'discussions.philosophy': 'Philosophy',
    'discussions.reflections': 'Reflections',
    'discussions.history': 'History',
    'discussions.answers': 'Replies',
    'discussions.likes': 'Likes',
    'discussions.submitAnswer': 'Submit Response',
    'discussions.writeReply': 'Write your contribution...',
    'discussions.noDiscussions': 'No inquiries found in this category.',

    // Reviews
    'reviews.title': 'Book Reviews',
    'reviews.subtitle': 'Critical reviews and evaluations of classical editions.',
    'reviews.writeReview': 'Write Review',
    'reviews.filterTradition': 'Filter Tradition',
    'reviews.allTraditions': 'All Traditions',
    'reviews.peerReviewed': 'Peer Reviewed',
    'reviews.rating': 'Rating',
    'reviews.helpful': 'Found Helpful',
    'reviews.ratingsBreakdown': 'Ratings Breakdown',
    'reviews.readReview': 'Read Review',

    // Reading Paths
    'paths.title': 'Curated Reading Paths',
    'paths.subtitle': 'Guided thematic reading plans through centuries of classical texts and monastic wisdom.',
    'paths.activeCurriculum': 'In Progress',
    'paths.allCurricula': 'All Reading Plans',
    'paths.stations': 'Stations',
    'paths.weeks': 'Weeks',
    'paths.curator': 'Curated by',
    'paths.startPath': 'Begin Path',
    'paths.continuePath': 'Continue Reading',
    'paths.completed': 'Completed',

    // Profile
    'profile.title': 'Reader Sophia Profile',
    'profile.annualGoal': 'Annual Reading Goal',
    'profile.booksRead': 'Books Read',
    'profile.notesRecorded': 'Notes Recorded',
    'profile.dayStreak': 'Day Streak',
    'profile.topicsOfInterest': 'Topics of Inquiry',
    'profile.preferences': 'Preferences',
    'profile.languageSetting': 'Interface Language',
    'profile.themeSetting': 'Active Theme',
    'profile.memberSince': 'Member since',

    // Common UI
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.read': 'Read',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.loading': 'Loading...',
    'common.add': 'Add',
    'common.confirm': 'Confirm',
    'common.share': 'Share'
  },

  am: {
    // Brand & General
    'brand.title': 'ሶፊያ',
    'brand.subtitle': 'ታሪካዊ ቤተ-መጻሕፍት',
    'brand.tagline': 'ለጥንታዊ መንፈሳዊ ጥናት፣ ለማሰላሰል እና ለምሁራዊ ውይይት የተዘጋጀ ዲጂታል ቤተ-መጻሕፍት።',

    // Navigation
    'nav.home': 'መነሻ',
    'nav.paths': 'መንገዶች',
    'nav.saved': 'የተቀመጡ',
    'nav.library': 'ቤተ-መጻሕፍት',
    'nav.discussions': 'ውይይቶች',
    'nav.reviews': 'መጽሐፍ ዳሰሳ',
    'nav.colloquium': 'የመጽሐፍ ውይይቶች',
    'nav.notes': 'የግል ማስታወሻዎች',
    'nav.profile': 'የአንባቢ መገለጫ',
    'nav.search': 'ፈልግ',
    'nav.theme': 'የብራና ገጽታዎች',
    'nav.language': 'ቋንቋ',
    'nav.menu': 'ምናሌ',
    'nav.close': 'ዝጋ',
    'nav.sanctuary': 'መነሻ',
    'nav.scriptoriumPaths': 'የሶፊያ መንገዶች',

    // Header & Search
    'header.searchPlaceholder': 'ካታሎግ እና ጽሑፎችን ፈልግ (/ ወይም መታ ያድርጉ)',
    'header.themeMenuTitle': 'የብራና ገጽታዎች',
    'header.selectStyle': 'ቅጥ ምረጥ',
    'header.toggleLanguage': 'ቋንቋ ቀይር (English / አማርኛ)',
    'header.languageName': 'አማርኛ',

    // Saved / Library View
    'saved.title': 'የተቀመጡ',
    'saved.subtitle': 'የግል ቤተ-መጻሕፍትዎን፣ የግል ማስታወሻዎችዎን እና የተቀመጡ ጥቅሶችን ያስተዳድሩ።',
    'saved.tabBookmarks': 'ምልክቶች',
    'saved.tabNotes': 'ማስታወሻዎች',
    'saved.tabLibrary': 'መጻሕፍት',
    'saved.filterAll': 'ሁሉም',
    'saved.filterReading': 'በማንበብ ላይ',
    'saved.filterTBR': 'TBR',
    'saved.filterRead': 'የተነበበ',
    'saved.filterDnf': 'ያልተጠናቀቀ',
    'saved.searchPlaceholder': 'በተቀመጡ መጻሕፍት፣ ደራሲያን ወይም ክፍሎች ውስጥ ፈልግ...',
    'saved.addToTbr': 'ወደ TBR ጨምር',
    'saved.saveToLibrary': 'ወደ ቤተ-መጻሕፍት አስቀምጥ',
    'saved.sortBy': 'ደርድር በ:',
    'saved.sortRecent': 'በቅርቡ የተጨመረ',
    'saved.sortTitle': 'ርዕስ (ከሀ-ፐ)',
    'saved.sortRating': 'ከፍተኛ ደረጃ',
    'saved.sortProgress': 'የንባብ ሂደት',
    'saved.status': 'ሁኔታ',
    'saved.statusReading': 'በማንበብ ላይ',
    'saved.statusTbr': 'ሊነበብ የታሰበ (TBR)',
    'saved.statusRead': 'የተነበበ / የተጠናቀቀ',
    'saved.statusDnf': 'ያልተጠናቀቀ',
    'saved.progress': 'ሂደት',
    'saved.completed': 'ተጠናቋል',
    'saved.pages': 'ገጾች',
    'saved.notesCount': 'ማስታወሻዎች',
    'saved.circlesCount': 'በውይይት ላይ',
    'saved.changeStatus': 'ሁኔታ ቀይር',
    'saved.viewBook': 'የመጽሐፍ ዝርዝር እይ',
    'saved.openSeminar': 'ውይይቱን ክፈት',
    'saved.noBooksFound': 'በዚህ ማጣሪያ የተገኘ መጽሐፍ የለም',
    'saved.noBooksDesc': 'እባክዎ ሌላ ክፍል ይምረጡ ወይም ፍለጋዎን ይቀይሩ።',
    'saved.noBookmarksFound': 'ምንም የተቀመጡ ምልክቶች የሉም',
    'saved.noBookmarksDesc': 'ጠቃሚ ጥቅሶችን ከመጻሕፍት በማስቀመጥ እዚህ ማየት ይችላሉ።',
    'saved.noNotesFound': 'ምንም የግል ማስታወሻዎች የሉም',
    'saved.noNotesDesc': 'በሚያነቡበት ጊዜ የግል አስተያየቶችን እና ማሰላሰያዎችን ይመዝግቡ።',
    'saved.newBookmark': 'ጥቅስ አስቀምጥ',
    'saved.newNote': 'አዲስ ማስታወሻ',
    'saved.editBookmark': 'ምልክት አስተካክል',
    'saved.editNote': 'ማስታወሻ አስተካክል',
    'saved.copyPassage': 'ጥቅሱን ገልብጥ',
    'saved.copied': 'ጥቅሱ ተገልብጧል',
    'saved.deletePrompt': 'ይህን ንጥል በእርግጥ መሰረዝ ይፈልጋሉ?',
    'saved.quotation': 'ጥቅስ',
    'saved.author': 'ደራሲ / አባት',
    'saved.source': 'ምንጭ / ምዕራፍ',
    'saved.category': 'ክፍል / ትውፊት',
    'saved.reflection': 'ማሰላሰያ / ማስታወሻ',
    'saved.marginalia': 'የግል ማስታወሻ',
    'saved.tag': 'የስነ-መለኮት መለያ',
    'saved.location': 'የመጽሐፍ / ምዕራፍ ስፍራ',

    // Home Feed
    'home.welcome': 'እንኳን ወደ ሶፊያ በደህና መጡ',
    'home.subtitle': 'ለጥንታዊ ጥበብ፣ ለማሰላሰል እና ለማህበረሰብ ጥናት የተዘጋጀ መንፈሳዊ ቤተ-መጻሕፍት።',
    'home.dailyContemplation': 'የዕለቱ ማሰላሰያ',
    'home.todaysLectio': 'የዕለቱ መንፈሳዊ ንባብ',
    'home.explorePaths': 'የንባብ መንገዶችን ያስሱ',
    'home.browseCatalog': 'ሁሉንም ጥራዞች ያስሱ',
    'home.recentDiscussions': 'የቅርብ ጊዜ ጥያቄዎች እና መልሶች',
    'home.featuredReview': 'መጽሐፍ ዳሰሳ',
    'home.communityFeed': 'የማህበረሰብ እንቅስቃሴ',
    'home.joinSeminar': 'ወደ ንባብ ክፍል ግባ',
    'home.quoteOfTheDay': 'ጥንታዊ መንፈሳዊ ጥበብ',
    'home.continueReading': 'ንባብ ቀጥል',

    // Colloquium & Seminars
    'colloquium.title': 'የመጽሐፍ ውይይቶች',
    'colloquium.subtitle': 'በጥንታዊ መጻሕፍት ላይ የተመሠረተ የጋራ ውይይት እና ጥልቅ ምርምር።',
    'colloquium.volumeDirectory': 'የጥራዞች ማውጫ',
    'colloquium.dialecticRoom': 'የንባብ ሴሚናር',
    'colloquium.assent': 'እስማማለሁ',
    'colloquium.assents': 'ስምምነቶች',
    'colloquium.reply': 'መልስ ስጥ',
    'colloquium.replies': 'መልሶች',
    'colloquium.folio': 'የገጽ ማጣቀሻ',
    'colloquium.thesisTag': 'አንኳር ሃሳብ',
    'colloquium.enterSeminar': 'ወደ ንባብ ክፍል ግባ',
    'colloquium.tableOfContents': 'የምዕራፎች ዝርዝር',
    'colloquium.addAnnotation': 'ማስታወሻ ጻፍ',

    // Discussions & Q&A
    'discussions.title': 'የማህበረሰብ ውይይቶች',
    'discussions.subtitle': 'ጥያቄዎችን ያቅርቡ፣ ከምሁራን ጋር ይወያዩ፣ እና እውቀትን ያጋሩ።',
    'discussions.askQuestion': 'ጥያቄ ጠይቅ',
    'discussions.searchPlaceholder': 'ጥያቄዎችን እና ውይይቶችን ፈልግ...',
    'discussions.allTopics': 'ሁሉም ርዕሶች',
    'discussions.earlyTexts': 'ቀደምት ጽሑፎች',
    'discussions.philosophy': 'ፍልስፍና',
    'discussions.reflections': 'ማሰላሰያዎች',
    'discussions.history': 'ታሪክ',
    'discussions.answers': 'መልሶች',
    'discussions.likes': 'መውደዶች',
    'discussions.submitAnswer': 'መልስ አስገባ',
    'discussions.writeReply': 'የእርስዎን ሃሳብ እዚህ ይጻፉ...',
    'discussions.noDiscussions': 'በዚህ ክፍል ምንም ጥያቄ አልተገኘም።',

    // Reviews
    'reviews.title': 'መጽሐፍ ዳሰሳ',
    'reviews.subtitle': 'ስለ መጻሕፍት የተሰጡ ምሁራዊ ዳሰሳዎች፣ ማብራሪያዎች እና ሂሶች።',
    'reviews.writeReview': 'መጽሐፍ ዳሰሳ ጻፍ',
    'reviews.filterTradition': 'በትውፊት አጣራ',
    'reviews.allTraditions': 'ሁሉም ወጎች',
    'reviews.peerReviewed': 'በምሁራን የተገመገመ',
    'reviews.rating': 'ደረጃ',
    'reviews.helpful': 'ጠቃሚ ሆኖ አግኝቼዋለሁ',
    'reviews.ratingsBreakdown': 'የደረጃዎች ዝርዝር',
    'reviews.readReview': 'ሙሉውን መጽሐፍ ዳሰሳ አንብብ',

    // Reading Paths
    'paths.title': 'የተመረጡ የንባብ መንገዶች',
    'paths.subtitle': 'በዘመናት ጥንታዊ መጻሕፍት እና ገዳማዊ ጥበብ ውስጥ የተዘጋጁ የንባብ መርሃ-ግብሮች።',
    'paths.activeCurriculum': 'በሂደት ላይ ያለ',
    'paths.allCurricula': 'ሁሉም የንባብ እቅዶች',
    'paths.stations': 'ደረጃዎች',
    'paths.weeks': 'ሳምንታት',
    'paths.curator': 'ያዘጋጀው',
    'paths.startPath': 'መንገዱን ጀምር',
    'paths.continuePath': 'ንባብ ቀጥል',
    'paths.completed': 'ተጠናቋል',

    // Profile
    'profile.title': 'የአንባቢ ሶፊያ መገለጫ',
    'profile.annualGoal': 'ዓመታዊ የንባብ ግብ',
    'profile.booksRead': 'የተነበቡ መጻሕፍት',
    'profile.notesRecorded': 'የተመዘገቡ ማስታወሻዎች',
    'profile.dayStreak': 'የተከታታይ ቀናት ንባብ',
    'profile.topicsOfInterest': 'የፍላጎት መስኮች',
    'profile.preferences': 'ምርጫዎች',
    'profile.languageSetting': 'የመተግበሪያ ቋንቋ',
    'profile.themeSetting': 'ገባሪ ገጽታ',
    'profile.memberSince': 'አባል የሆነበት ጊዜ',

    // Common UI
    'common.save': 'አስቀምጥ',
    'common.cancel': 'ሰርዝ',
    'common.close': 'ዝጋ',
    'common.edit': 'አስተካክል',
    'common.delete': 'አጥፋ',
    'common.back': 'ተመለስ',
    'common.read': 'አንብብ',
    'common.view': 'እይ',
    'common.search': 'ፈልግ',
    'common.filter': 'አጣራ',
    'common.all': 'ሁሉም',
    'common.loading': 'በመጫን ላይ...',
    'common.add': 'ጨምር',
    'common.confirm': 'አረጋግጥ',
    'common.share': 'አጋራ'
  }
};

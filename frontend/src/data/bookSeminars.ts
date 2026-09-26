import { Book, DialecticComment } from '../types';

export interface BookSeminarData {
  bookId: string;
  categoryTag: string;
  citationLabel: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  thesisTitle: string;
  thesisSubtitle: string;
  narrativeText: string[];
  scriptureQuote: string;
  scriptureCitation: string;
  concludingPrompt: string;
  citationsCount: number;
  initialComments: DialecticComment[];
}

export const BOOK_SEMINARS_MAP: Record<string, BookSeminarData> = {
  // 1. The Confessions (conf-4)
  'conf-4': {
    bookId: 'conf-4',
    categoryTag: 'Soteriology & Grace',
    citationLabel: 'Confessions VIII.12',
    authorName: 'Dr. Alistair Vance, O.P.',
    authorTitle: 'Patristic Scholar · Yesterday at Vespers',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg',
    thesisTitle: 'Grace and Assent in Confessions VIII.12',
    thesisSubtitle: 'Beneath the fig tree: divine grace, irresistible volition, and illuminated assent.',
    narrativeText: [
      'In examining the climactic resolution beneath the fig tree in the Milanese garden, we encounter the mysterious chanting child—«tolle, lege; tolle, lege». Opening the codex of the Apostle to Romans 13:13-14, Augustine recounts an immediate infusion of serenity where "all the shadows of doubt dispersed".',
      'The heart of this Master Book Discussion rests on reconciling this moment against contemporary Pelagian assertions of raw self-determination. Does Augustine witness his own agency being sovereignly superseded through an irresistible impulse of divine decree, or is his fragmented will healed through victorious delight (delectatio victrix), rendering assent spontaneous, ecstatic, and authentically human?'
    ],
    scriptureQuote: 'Not in rioting and drunkenness, not in chambering and wantonness, not in strife and envying: but put ye on the Lord Jesus Christ, and make not provision for the flesh, to fulfil the lusts thereof.',
    scriptureCitation: 'Epistola ad Romanos XIII, xiii-xiv (Vulgata)',
    concludingPrompt: 'How does Augustine’s psychology of the affections reconcile sovereign divine initiative with an authentic, unforced human will?',
    citationsCount: 24,
    initialComments: [
      {
        id: 'beatrice-1',
        author: 'Sr. Beatrice Moreau',
        role: 'Church History Fellow',
        timeLocation: 'Yesterday at Compline · Paris',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqQDrweYA7aylfdT-KU_qWLg3X4_HYipYi8tSU4nHp8YgKzipSfQJUdmNtXR6G9ZDG--VxVsG159QovhhymqoEBQ_VwDrpY6rPG9ytvlKASa88fqA0iX-1jhGjAOjD1UYsvwX3hTPPe65PtrpdfzLv1oUULvE9ZSeN2T3zT2MoaXuROg3iPqkzgUxdajVrjAg50eV8w7CFvUYS1EIhkORtGgAdKNRxbbT9gUeS3DSu66mHWhNB4TM0Cw',
        assents: 18,
        userAssented: false,
        referenceFolio: 'Augustine, Tract. in Io. Evang. 26.4: «Trahitur animus amore...»',
        content: [
          'Father Alistair poses the indispensable question. However, casting this as a binary between irresistible volition and illuminated assent misreads Augustine’s psychology of the affections.',
          'In De Civitate Dei and his later tracts against Julian of Eclanum, Augustine makes evident that grace does not extinguish the faculty of choice, but cures its atrophy through delectatio victrix. Grace presents the Supreme Beauty with such luminous clarity that the will freely desires what it previously fled. It is irresistible not by brute compulsion, but by triumphant loveliness.'
        ],
        replies: [
          {
            id: 'julian-1-1',
            author: 'Julian Thorne',
            role: 'Oxford Theological Fellow',
            timeLocation: 'Today at Matins · Oxford',
            thesisTag: 'Dialectic 1.1',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiaSzRXfIQWejuIS2XFujc37b0JC1AA5-PgPSAlKYkoNVtfUq1ugt8Q-CIxOrXLkDgmGF0HARuAepg9gQ2zw4SulxJqr317YRb9I8FfwV5Bw4P05XQ4zBSrbepXS8stQlyeaMfCZu9KlvOD72cQ_gy1rhBaAUrsKaTicPdysnSmNm0g8-fA6sG9jRTprw6nMnjuNLGZtGi-6AIfCie-hzlolB7mGQ8NHPFcoxSwe6LZwQlL4qAI03Vg',
            assents: 9,
            userAssented: false,
            content: [
              '@SrBeatriceMoreau Indeed, Sister, but notice how in the preceding chapter (Confessions VIII.10) the will is described as divided against itself: "It wills not entirely; therefore it commands not entirely."',
              'If the will itself is fractured by the penalty of original sin, is the delectatio truly operative on an autonomous assent, or must there be a monergistic reconstitution of the volitional capacity beforehand?'
            ]
          },
          {
            id: 'evangeline-1-2',
            author: 'Dr. Evangeline Cross',
            role: 'Leuven Dogmatics Chair',
            timeLocation: 'Today at Prime · Leuven',
            thesisTag: 'Dialectic 1.2',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw',
            assents: 12,
            userAssented: false,
            content: [
              'Julian’s observation mirrors Augustine’s own words in VIII.9: «Imperat animus corpori, et paret statim: imperat animus sibi, et resistitur.» The division is existential, not merely theoretical. Assent here is given under divine medicinal rehabilitation (gratia sanans), which restores human freedom to its authentic teleological telos rather than obliterating it.'
            ]
          }
        ]
      },
      {
        id: 'timothy-2',
        author: 'Rev. Timothy Kelly',
        role: 'Eastern Patristics Chair',
        timeLocation: 'Today at Terce · Dublin',
        thesisTag: 'Thesis #2',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw',
        assents: 11,
        userAssented: false,
        content: [
          'It is instructive to contrast Augustine’s internal monologue here with his contemporary, St. John Chrysostom’s Homilies on Romans. Where Augustine’s West will ultimately harden into debates over unconditional decree, the Antiochene tradition maintained the framework of synergia (συνέργεια).',
          'Chrysostom remarks on Romans 13 that Christ puts Himself on as a vesture only where the disciple extends trembling hands. The fig tree encounter remains thoroughly sacramental: the human tear prepares the soul for the uncreated light.'
        ]
      }
    ]
  },

  // 2. On the Incarnation (inc-1)
  'inc-1': {
    bookId: 'inc-1',
    categoryTag: 'Christology & Theosis',
    citationLabel: 'De Incarnatione §4–9',
    authorName: 'Mother Macrina OSB',
    authorTitle: 'Alexandrian Theology Fellow · Yesterday at Sext',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqQDrweYA7aylfdT-KU_qWLg3X4_HYipYi8tSU4nHp8YgKzipSfQJUdmNtXR6G9ZDG--VxVsG159QovhhymqoEBQ_VwDrpY6rPG9ytvlKASa88fqA0iX-1jhGjAOjD1UYsvwX3hTPPe65PtrpdfzLv1oUULvE9ZSeN2T3zT2MoaXuROg3iPqkzgUxdajVrjAg50eV8w7CFvUYS1EIhkORtGgAdKNRxbbT9gUeS3DSu66mHWhNB4TM0Cw',
    thesisTitle: 'The Divine Dilemma & Ontological Restoration in On the Incarnation',
    thesisSubtitle: 'God could neither let corruptibility swallow mankind nor break His word: the logic of cosmic recreation.',
    narrativeText: [
      'In §4-9 of De Incarnatione Verbi Dei, St. Athanasius formulates what patristic scholars call the "Divine Dilemma". Having fallen through transgression, humanity was slipping back into nothingness—the ontological void out of which creation was summoned.',
      'Athanasius asks: What was God to do? To permit humanity to perish into non-being would be monstrous and unworthy of the Goodness that created them; yet for God to merely waive the penalty without healing the corruptible nature would leave mankind infected with mortality and falsehood. The only resolution was for the Logos Himself—the Image after which humanity was crafted—to enter creation bodily.'
    ],
    scriptureQuote: 'For the Word, realizing that in no other way could the corruption of men be undone save through death, took to Himself a body capable of death, that it, partaking of the Word Who is above all, might be worthy to die in the stead of all.',
    scriptureCitation: 'Athanasius Alexandrinus, De Incarnatione Verbi Dei §9',
    concludingPrompt: 'How does Athanasius understand salvation as ontological healing from non-being, rather than a purely judicial or forensic transaction?',
    citationsCount: 31,
    initialComments: [
      {
        id: 'inc-comm-1',
        author: 'Dr. Evangeline Cross',
        role: 'Leuven Dogmatics Chair',
        timeLocation: 'Today at Matins · Leuven',
        thesisTag: 'Dialectic 1.1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw',
        assents: 15,
        userAssented: false,
        referenceFolio: 'De Incarnatione §14: The re-painting of the soiled portrait',
        content: [
          'Athanasius’s portrait analogy in §14 is the definitive refutation of any merely penal schema. If a fresco on wood is obscured by grime, the master craftsman does not discard the timber; the subject comes in person to sit again so the portrait can be renewed.',
          'The body of Christ is the locus where corruptibility is consumed by Life itself. Resurrection is ontological inoculation, not legal acquittal.'
        ]
      },
      {
        id: 'inc-comm-2',
        author: 'Rev. Timothy Kelly',
        role: 'Eastern Patristics Chair',
        timeLocation: 'Today at Prime · Dublin',
        thesisTag: 'Dialectic 1.2',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw',
        assents: 19,
        userAssented: false,
        content: [
          'Precisely. C.S. Lewis in his famous preface to Behr’s translation notes that to modern readers this reads like the freshest spring water precisely because it has not yet been complicated by post-Reformation disputations. The Incarnation here is cosmic recapitulation.'
        ]
      }
    ]
  },

  // 3. The Rule of Saint Benedict (ben-7)
  'ben-7': {
    bookId: 'ben-7',
    categoryTag: 'Monastic Wisdom & Ascesis',
    citationLabel: 'Regula Benedicti, Prologue & Ch. 7',
    authorName: 'Prior Anselm Guéranger',
    authorTitle: 'Subiaco Monastic Studies · Yesterday at Matins',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw',
    thesisTitle: 'The Twelve Steps of Humility and the Listening Ear of the Heart',
    thesisSubtitle: 'Benedictine discretion: how fraternal obedience becomes the gateway to perfect love casting out fear.',
    narrativeText: [
      'The Regula Sancti Benedicti begins not with legal statutes, but with a paternal imperative: «Ausculta, o fili, praecepta magistri, et inclina aurem cordis tui»—"Listen, my son, to the instructions of the master, and incline the ear of your heart."',
      'In Chapter 7, Benedict sets forth the twelve steps of humility descending and ascending like Jacob’s ladder. Far from self-abnegation for its own sake, Benedict promises that upon scaling these steps, the monk arrives at that love of God which, being perfect, casts out all dread, so that all observance is done not through fear of punishment, but out of delightful love for Christ.'
    ],
    scriptureQuote: 'Having therefore ascended all these rungs of humility, the monk will soon arrive at that love of God which, being perfect, casts out all fear.',
    scriptureCitation: 'Regula Sancti Benedicti, Caput VII: De Humilitate',
    concludingPrompt: 'How does St. Benedict balance absolute obedience with the discretion (discretio) that protects the weak from being broken?',
    citationsCount: 28,
    initialComments: [
      {
        id: 'ben-comm-1',
        author: 'Sr. Beatrice Moreau',
        role: 'Church History Fellow',
        timeLocation: 'Today at Terce · Paris',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqQDrweYA7aylfdT-KU_qWLg3X4_HYipYi8tSU4nHp8YgKzipSfQJUdmNtXR6G9ZDG--VxVsG159QovhhymqoEBQ_VwDrpY6rPG9ytvlKASa88fqA0iX-1jhGjAOjD1UYsvwX3hTPPe65PtrpdfzLv1oUULvE9ZSeN2T3zT2MoaXuROg3iPqkzgUxdajVrjAg50eV8w7CFvUYS1EIhkORtGgAdKNRxbbT9gUeS3DSu66mHWhNB4TM0Cw',
        assents: 14,
        userAssented: false,
        referenceFolio: 'RB 64.19: «temperet sic omnia ut et fortes cupiant et infirmi non refugiant»',
        content: [
          'The genius of the Rule is Benedict’s insistence in chapter 64 that the Abbot temper everything so that the strong have something to strive for, and the weak are not discouraged or driven away. That moderation saved Western monasticism from collapsing under extreme desert severities.'
        ]
      }
    ]
  },

  // 4. The Ladder of Divine Ascent (lad-8)
  'lad-8': {
    bookId: 'lad-8',
    categoryTag: 'Hesychia & Ascesis',
    citationLabel: 'Klimax Step 27 & 30',
    authorName: 'Father Sophrony of Sinai',
    authorTitle: 'Eastern Patristics Fellow · Today at Prime',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiaSzRXfIQWejuIS2XFujc37b0JC1AA5-PgPSAlKYkoNVtfUq1ugt8Q-CIxOrXLkDgmGF0HARuAepg9gQ2zw4SulxJqr317YRb9I8FfwV5Bw4P05XQ4zBSrbepXS8stQlyeaMfCZu9KlvOD72cQ_gy1rhBaAUrsKaTicPdysnSmNm0g8-fA6sG9jRTprw6nMnjuNLGZtGi-6AIfCie-hzlolB7mGQ8NHPFcoxSwe6LZwQlL4qAI03Vg',
    thesisTitle: 'Hesychia and the Crown of Dispassion in The Ladder of Divine Ascent',
    thesisSubtitle: 'Thirty steps corresponding to Christ’s thirty hidden years: from detachment to holy stillness and love.',
    narrativeText: [
      'Composed at Saint Catherine’s Monastery at the foot of Mount Sinai, John Climacus’s Ladder constructs a spiritual architectural ascent across thirty rungs. The climax of this ascent in Steps 27 and 30 culminates in Holy Stillness (hesychia) and Dispassion (apatheia), crowned by Agape.',
      'Far from a cold Stoic unfeelingness, apatheia is understood by Climacus as the resurrection of the soul prior to the general resurrection—a state where the passions have been so transfigured by grace that the intellect stands before God in continuous, tearful contemplation.'
    ],
    scriptureQuote: 'Hesychia is the unceasing worship and standing before God. The friend of stillness draws near to God and, conversing with Him in secret, is illumined by His uncreated light.',
    scriptureCitation: 'St. John Climacus, Scala Paradisi, Gradus XXVII',
    concludingPrompt: 'How does Climacus distinguish between emotional apathy and authentic patristic dispassion (apatheia)?',
    citationsCount: 22,
    initialComments: [
      {
        id: 'lad-comm-1',
        author: 'Rev. Timothy Kelly',
        role: 'Eastern Patristics Chair',
        timeLocation: 'Today at Matins · Dublin',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArR8OvVJQ6TFhNO-BwnA5owdAnxo1azdbH3DAkioa0mTlkvcI2W7W7OSVcBDG18NPlPpu1jTMnLwFMtVbI6H6k44jjCwqpg_PA-TTJAORHS7QubWhyQGBi3z8cr_jtElYu6tSUN9BHVCgHN3i-ClOer_3XVsKeUOGjNow49MdEzXphzGZ44Xj6o06schfErH7oEem7Ul8CQB9WDLt7R0NIyBHw9ANCR32GdP6e-erSozPqihsRfk3Ujw',
        assents: 17,
        userAssented: false,
        content: [
          'Climacus emphasizes that passion must be fought with spiritual passion: «Let holy love take the place of lust, let holy compunction take the place of bitterness.» Apatheia is overflowing divine love, not an inert stoic stone.'
        ]
      }
    ]
  },

  // 5. The City of God (civ-3)
  'civ-3': {
    bookId: 'civ-3',
    categoryTag: 'Philosophy of History & Peace',
    citationLabel: 'De Civitate Dei XIV.28 & XIX.13',
    authorName: 'Dr. Evangeline Cross',
    authorTitle: 'Leuven Dogmatics Chair · Yesterday at Vespers',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw',
    thesisTitle: 'The Two Cities and the Tranquillity of Order in The City of God',
    thesisSubtitle: 'Love of self unto contempt of God versus love of God unto contempt of self in the collapsing Empire.',
    narrativeText: [
      'In response to pagan accusations that Christianity caused the sack of Rome in 410 AD, Augustine reinterprets the entire sweep of human history through the lens of two divergent loves: the Earthly City animated by amor sui (love of self) unto the contempt of God, and the Heavenly City animated by amor Dei (love of God) unto the contempt of self.',
      'In Book XIX, Augustine offers his timeless definition of peace: «Pax omnium rerum tranquillitas ordinis»—"The peace of all things is the tranquillity of order." This order allots things equal and unequal each to their proper place under the sovereignty of the Creator.'
    ],
    scriptureQuote: 'Two cities then have been created by two loves: the earthly by love of self, even to the contempt of God; the heavenly by love of God, even to the contempt of self.',
    scriptureCitation: 'Augustinus, De Civitate Dei, Lib. XIV, Cap. XXVIII',
    concludingPrompt: 'How can citizens of the Heavenly City live faithfully as pilgrims within the Earthly City while using its temporal peace for the common good?',
    citationsCount: 26,
    initialComments: [
      {
        id: 'civ-comm-1',
        author: 'Julian Thorne',
        role: 'Oxford Theological Fellow',
        timeLocation: 'Today at Sext · Oxford',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiaSzRXfIQWejuIS2XFujc37b0JC1AA5-PgPSAlKYkoNVtfUq1ugt8Q-CIxOrXLkDgmGF0HARuAepg9gQ2zw4SulxJqr317YRb9I8FfwV5Bw4P05XQ4zBSrbepXS8stQlyeaMfCZu9KlvOD72cQ_gy1rhBaAUrsKaTicPdysnSmNm0g8-fA6sG9jRTprw6nMnjuNLGZtGi-6AIfCie-hzlolB7mGQ8NHPFcoxSwe6LZwQlL4qAI03Vg',
        assents: 11,
        userAssented: false,
        content: [
          'Augustine’s political realism is striking here. He refuses both utopian political messianism and cynical despair. The earthly state is an interim vehicle of provisional order, which Christian citizens support for the quietude it secures.'
        ]
      }
    ]
  },

  // 6. Sayings of the Desert Fathers (say-5)
  'say-5': {
    bookId: 'say-5',
    categoryTag: 'Desert Monasticism & Stillness',
    citationLabel: 'Apophthegmata Patrum §6 & §84',
    authorName: 'Abba Moses Scholar Circle',
    authorTitle: 'Coptic & Desert Monastic Studies · Today at Matins',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIS3Fq6lYbGU-zJDfsH-d1KDlh18QWlmfvFXF44UGMx27EkUERoWn7CtlstUYJBWzMVSXjX3zk0D3A1FmGfhzGVsAFem9ULBNwmp3-6AnRo3-cVWucjvfxijHi2oncS5mDBF6FNjiJ602m3V7d7DfidG0uKDmN2KUuchsuIq0lWefLpvL7hUXaWm7A_Jv3fA_w-F6upqCUcsGviEjapUMQ8UWwVHYYc_dTcAcmvPPhwLSq06gBSGFieA',
    thesisTitle: 'The Cell, the Tongue, and Interior Vigilance in the Desert Fathers',
    thesisSubtitle: '«Go, sit in your cell, and your cell will teach you everything»: silence as radical purification.',
    narrativeText: [
      'The desert mothers and fathers who fled 4th-century Roman urban centers into the wastes of Scetis, Nitria, and the Thebaid left behind no theoretical philosophical compendia. Instead, they transmitted pithy, piercing encounter apophthegms.',
      'Abba Moses famously said to a questioning brother: "Go, sit in your cell, and your cell will teach you everything." In the radical silence of the desert, the illusions of ego, pride, and garrulous speech are stripped away, forcing the soul to confront its own passions before the mirror of divine mercy.'
    ],
    scriptureQuote: 'A brother asked Abba Moses: "Father, give me a word." The old man said to him: "Go, sit in your cell, and your cell will teach you everything."',
    scriptureCitation: 'Apophthegmata Patrum (Systematic Collection), De Quietudine §6',
    concludingPrompt: 'Why did the desert solitaries insist that control of the tongue and patient dwelling in one’s cell precede all theoretical knowledge?',
    citationsCount: 20,
    initialComments: [
      {
        id: 'say-comm-1',
        author: 'Sr. Beatrice Moreau',
        role: 'Church History Fellow',
        timeLocation: 'Today at None · Paris',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqQDrweYA7aylfdT-KU_qWLg3X4_HYipYi8tSU4nHp8YgKzipSfQJUdmNtXR6G9ZDG--VxVsG159QovhhymqoEBQ_VwDrpY6rPG9ytvlKASa88fqA0iX-1jhGjAOjD1UYsvwX3hTPPe65PtrpdfzLv1oUULvE9ZSeN2T3zT2MoaXuROg3iPqkzgUxdajVrjAg50eV8w7CFvUYS1EIhkORtGgAdKNRxbbT9gUeS3DSu66mHWhNB4TM0Cw',
        assents: 16,
        userAssented: false,
        content: [
          'Because in the cell there is nowhere to hide. As Henri Nouwen noted in his reflections on the desert, speech and movement are usually our defense mechanisms to avoid encountering our profound poverty before God.'
        ]
      }
    ]
  },

  // 7. Mystical Theology (theo-2)
  'theo-2': {
    bookId: 'theo-2',
    categoryTag: 'Apophatic Contemplation',
    citationLabel: 'Theologia Mystica Caput I',
    authorName: 'Brother Thomas of Cluny',
    authorTitle: 'Medieval Neoplatonism Fellow · Yesterday at Sext',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw',
    thesisTitle: 'The Dazzling Obscurity of the Divine Darkness in Mystical Theology',
    thesisSubtitle: 'Transcending intellect and concepts to plunge into the luminous darkness beyond being.',
    narrativeText: [
      'In Pseudo-Dionysius the Areopagite’s brief treatise The Mystical Theology, Christian prayer ascends beyond kataphasis (affirmation) into apophasis (negation). Like Moses entering the thick cloud atop Mount Sinai, the soul strips away all images, symbols, and intelligible notions.',
      'God is not an entity among entities; He is beyond being, beyond light, and beyond understanding. The soul unites with God not through cognitive deduction, but by entering the "dazzling darkness of the secret silence".'
    ],
    scriptureQuote: 'Trinity! Higher than any being, any divinity, any goodness! Guide of Christians in the wisdom of heaven! Direct our way to the summit of mystical oracles, which is above light and above knowledge...',
    scriptureCitation: 'Pseudo-Dionysius Areopagita, De Mystica Theologia I.1',
    concludingPrompt: 'How does apophatic negation differ from agnosticism, and why is negation considered the highest praise of God?',
    citationsCount: 19,
    initialComments: [
      {
        id: 'theo-comm-1',
        author: 'Julian Thorne',
        role: 'Oxford Theological Fellow',
        timeLocation: 'Today at Matins · Oxford',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiaSzRXfIQWejuIS2XFujc37b0JC1AA5-PgPSAlKYkoNVtfUq1ugt8Q-CIxOrXLkDgmGF0HARuAepg9gQ2zw4SulxJqr317YRb9I8FfwV5Bw4P05XQ4zBSrbepXS8stQlyeaMfCZu9KlvOD72cQ_gy1rhBaAUrsKaTicPdysnSmNm0g8-fA6sG9jRTprw6nMnjuNLGZtGi-6AIfCie-hzlolB7mGQ8NHPFcoxSwe6LZwQlL4qAI03Vg',
        assents: 13,
        userAssented: false,
        content: [
          'Agnosticism says: "God is too distant for us to know." Dionysian apophasis says: "God is so radiant and near that our finite concepts are blinded by His superabundant light." It is hyper-knowing, not skepticism.'
        ]
      }
    ]
  },

  // 8. The Cloud of Unknowing (cloud-6)
  'cloud-6': {
    bookId: 'cloud-6',
    categoryTag: 'Middle English Mysticism',
    citationLabel: 'The Cloud of Unknowing Ch. 6 & 9',
    authorName: 'Dame Julian Hermitage Circle',
    authorTitle: 'Carthusian & Fourteenth-Century Studies · Today at Sext',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqQDrweYA7aylfdT-KU_qWLg3X4_HYipYi8tSU4nHp8YgKzipSfQJUdmNtXR6G9ZDG--VxVsG159QovhhymqoEBQ_VwDrpY6rPG9ytvlKASa88fqA0iX-1jhGjAOjD1UYsvwX3hTPPe65PtrpdfzLv1oUULvE9ZSeN2T3zT2MoaXuROg3iPqkzgUxdajVrjAg50eV8w7CFvUYS1EIhkORtGgAdKNRxbbT9gUeS3DSu66mHWhNB4TM0Cw',
    thesisTitle: 'The Sharp Dart of Longing Love in The Cloud of Unknowing',
    thesisSubtitle: '«By love He may be gotten and holden, but by thought never»: affective contemplation in 14th-century England.',
    narrativeText: [
      'The anonymous 14th-century English spiritual director advises a young novice that while human intellect cannot comprehend the uncreated God, human love can grasp Him completely: "By love He may be gotten and holden, but by thought never."',
      'The practitioner is instructed to place all thoughts, images, and creaturely concerns beneath a "cloud of forgetting", while continually aiming at God through the "cloud of unknowing" with a sharp dart of longing love (a naked intent directed solely unto God).'
    ],
    scriptureQuote: 'Strike upon that thick cloud of unknowing with a sharp dart of longing love; and do not cease, no matter what happens.',
    scriptureCitation: 'The Cloud of Unknowing, Chapter IX',
    concludingPrompt: 'How does the author distinguish between holy contemplation and intellectual meditation on biblical stories or virtues?',
    citationsCount: 25,
    initialComments: [
      {
        id: 'cloud-comm-1',
        author: 'Dr. Alistair Vance, O.P.',
        role: 'Patristic & Medieval Studies Chair',
        timeLocation: 'Today at None · Oxford',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg',
        assents: 18,
        userAssented: false,
        content: [
          'The Cloud author makes clear that discursive meditation on the Passion and virtues is noble and necessary for beginners; but contemplation proper begins when discursive reasoning gives way to naked love.'
        ]
      }
    ]
  }
};

export const getBookSeminarData = (book: Book): BookSeminarData => {
  if (BOOK_SEMINARS_MAP[book.id]) {
    return BOOK_SEMINARS_MAP[book.id];
  }

  // Fallback generator for any book
  return {
    bookId: book.id,
    categoryTag: book.categoryTag || book.category || 'Theology & Philosophy',
    citationLabel: `${book.title} Seminar`,
    authorName: 'Scholarly Colloquium Chair',
    authorTitle: 'Academic & Patristic Fellow · Active Seminar',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg',
    thesisTitle: `Dialectic Colloquium on ${book.title}`,
    thesisSubtitle: `Scholarly investigation and fraternal inquiry into ${book.author}'s masterwork (${book.era || 'Classical'}).`,
    narrativeText: [
      `In examining ${book.title} by ${book.author}, we enter into the core dialectic of ${book.categoryTag || book.category}. ${book.summary || ''}`,
      `This seminar brings together monastic fellows, university scholars, and contemplative readers to examine the fundamental theological, philosophical, and interior principles set forth in this treatise.`
    ],
    scriptureQuote: book.quotes && book.quotes.length > 0 ? book.quotes[0].quote : `In ${book.title}, we are called to deep contemplation and theological discernment.`,
    scriptureCitation: book.quotes && book.quotes.length > 0 ? `${book.author}, ${book.quotes[0].citation}` : `${book.author}, ${book.title}`,
    concludingPrompt: `What central truth or spiritual insight in ${book.title} remains most urgent for contemporary theological and contemplative inquiry?`,
    citationsCount: 16,
    initialComments: [
      {
        id: `comm-${book.id}-1`,
        author: 'Dr. Alistair Vance, O.P.',
        role: 'Patristic & Historical Studies',
        timeLocation: 'Today at Matins · Oxford',
        thesisTag: 'Thesis #1',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg',
        assents: 12,
        userAssented: false,
        content: [
          `Welcome to the dedicated seminar room for ${book.title}. We encourage participants to cite chapter and paragraph folios as we work through the key arguments of ${book.author}.`
        ]
      }
    ]
  };
};

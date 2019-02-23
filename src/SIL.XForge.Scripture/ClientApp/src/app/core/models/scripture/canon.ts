import { BookSet } from './book-set';

/**
 * Canon information. Also, contains static information on complete list of books and localization.
 *
 * Partially converted from https://github.com/sillsdev/libpalaso/blob/master/SIL.Scripture/Canon.cs
 */
export class Canon {
  /**
   * Array of all book ids.
   * BE SURE TO UPDATE ISCANONICAL above whenever you change this array.
   */
  static readonly allBookIds: string[] = [
    'GEN',
    'EXO',
    'LEV',
    'NUM',
    'DEU',
    'JOS',
    'JDG',
    'RUT',
    '1SA',
    '2SA', // 10

    '1KI',
    '2KI',
    '1CH',
    '2CH',
    'EZR',
    'NEH',
    'EST',
    'JOB',
    'PSA',
    'PRO', // 20

    'ECC',
    'SNG',
    'ISA',
    'JER',
    'LAM',
    'EZK',
    'DAN',
    'HOS',
    'JOL',
    'AMO', // 30

    'OBA',
    'JON',
    'MIC',
    'NAM',
    'HAB',
    'ZEP',
    'HAG',
    'ZEC',
    'MAL',
    'MAT', // 40

    'MRK',
    'LUK',
    'JHN',
    'ACT',
    'ROM',
    '1CO',
    '2CO',
    'GAL',
    'EPH',
    'PHP', // 50

    'COL',
    '1TH',
    '2TH',
    '1TI',
    '2TI',
    'TIT',
    'PHM',
    'HEB',
    'JAS',
    '1PE', // 60

    '2PE',
    '1JN',
    '2JN',
    '3JN',
    'JUD',
    'REV',
    'TOB',
    'JDT',
    'ESG',
    'WIS', // 70

    'SIR',
    'BAR',
    'LJE',
    'S3Y',
    'SUS',
    'BEL',
    '1MA',
    '2MA',
    '3MA',
    '4MA', // 80

    '1ES',
    '2ES',
    'MAN',
    'PS2',
    'ODA',
    'PSS',
    'JSA', // actual variant text for JOS, now in LXA text
    'JDB', // actual variant text for JDG, now in LXA text
    'TBS', // actual variant text for TOB, now in LXA text
    'SST', // actual variant text for SUS, now in LXA text // 90

    'DNT', // actual variant text for DAN, now in LXA text
    'BLT', // actual variant text for BEL, now in LXA text
    'XXA',
    'XXB',
    'XXC',
    'XXD',
    'XXE',
    'XXF',
    'XXG',
    'FRT', // 100

    'BAK',
    'OTH',
    '3ES', // Used previously but really should be 2ES
    'EZA', // Used to be called 4ES, but not actually in any known project
    '5EZ', // Used to be called 5ES, but not actually in any known project
    '6EZ', // Used to be called 6ES, but not actually in any known project
    'INT',
    'CNC',
    'GLO',
    'TDX', // 110

    'NDX',
    'DAG',
    'PS3',
    '2BA',
    'LBA',
    'JUB',
    'ENO',
    '1MQ',
    '2MQ',
    '3MQ', // 120

    'REP',
    '4BA',
    'LAO'
  ];

  static readonly nonCanonicalIds: string[] = [
    'XXA',
    'XXB',
    'XXC',
    'XXD',
    'XXE',
    'XXF',
    'XXG',
    'FRT',
    'BAK',
    'OTH',
    'INT',
    'CNC',
    'GLO',
    'TDX',
    'NDX'
  ];

  /**
   * Index of the first book. Abstracting this makes code less fragile.
   */
  static readonly firstBook = 1;

  /**
   * Number of the last book (1-based).
   */
  static readonly lastBook = Canon.allBookIds.length;

  static readonly extraBooks: string[] = ['XXA', 'XXB', 'XXC', 'XXD', 'XXE', 'XXF', 'XXG'];

  /**
   * Array of the English names of all books
   */
  private static readonly allBookEnglishNames: string[] = [
    'Genesis',
    'Exodus',
    'Leviticus',
    'Numbers',
    'Deuteronomy',
    'Joshua',
    'Judges',
    'Ruth',
    '1 Samuel',
    '2 Samuel',

    '1 Kings',
    '2 Kings',
    '1 Chronicles',
    '2 Chronicles',
    'Ezra',
    'Nehemiah',
    'Esther (Hebrew)',
    'Job',
    'Psalms',
    'Proverbs',

    'Ecclesiastes',
    'Song of Songs',
    'Isaiah',
    'Jeremiah',
    'Lamentations',
    'Ezekiel',
    'Daniel (Hebrew)',
    'Hosea',
    'Joel',
    'Amos',

    'Obadiah',
    'Jonah',
    'Micah',
    'Nahum',
    'Habakkuk',
    'Zephaniah',
    'Haggai',
    'Zechariah',
    'Malachi',
    'Matthew',

    'Mark',
    'Luke',
    'John',
    'Acts',
    'Romans',
    '1 Corinthians',
    '2 Corinthians',
    'Galatians',
    'Ephesians',
    'Philippians',

    'Colossians',
    '1 Thessalonians',
    '2 Thessalonians',
    '1 Timothy',
    '2 Timothy',
    'Titus',
    'Philemon',
    'Hebrews',
    'James',
    '1 Peter',

    '2 Peter',
    '1 John',
    '2 John',
    '3 John',
    'Jude',
    'Revelation',
    'Tobit',
    'Judith',
    'Esther Greek',
    'Wisdom of Solomon',

    'Sirach (Ecclesiasticus)',
    'Baruch',
    'Letter of Jeremiah',
    'Song of 3 Young Men',
    'Susanna',
    'Bel and the Dragon',
    '1 Maccabees',
    '2 Maccabees',
    '3 Maccabees',
    '4 Maccabees',

    '1 Esdras (Greek)',
    '2 Esdras (Latin)',
    'Prayer of Manasseh',
    'Psalm 151',
    'Odes',
    'Psalms of Solomon',
    // WARNING, if you change the spelling of the *obsolete* tag be sure to update
    // IsObsolete routine
    'Joshua A. *obsolete*',
    'Judges B. *obsolete*',
    'Tobit S. *obsolete*',
    'Susanna Th. *obsolete*',

    'Daniel Th. *obsolete*',
    'Bel Th. *obsolete*',
    'Extra A',
    'Extra B',
    'Extra C',
    'Extra D',
    'Extra E',
    'Extra F',
    'Extra G',
    'Front Matter',

    'Back Matter',
    'Other Matter',
    '3 Ezra *obsolete*',
    'Apocalypse of Ezra',
    '5 Ezra (Latin Prologue)',
    '6 Ezra (Latin Epilogue)',
    'Introduction',
    'Concordance ',
    'Glossary ',
    'Topical Index',

    'Names Index',
    'Daniel Greek',
    'Psalms 152-155',
    '2 Baruch (Apocalypse)',
    'Letter of Baruch',
    'Jubilees',
    'Enoch',
    '1 Meqabyan',
    '2 Meqabyan',
    '3 Meqabyan',
    'Reproof (Proverbs 25-31)',

    '4 Baruch (Rest of Baruch)',
    'Laodiceans'
  ];

  // Used for fast look up of book IDs to the book number
  private static readonly bookNumbers: BookNumbers = Canon.createBookNumbers();
  private static scriptureBooks: BookSet;
  private static allBooks: BookSet;

  /**
   * Gets the 1-based number of the specified book
   * This is a fairly performance-critical method.
   * @param id
   * @param ignoreCase
   * @returns book number, or 0 if id doesn't exist
   */
  static bookIdToNumber(id: string, ignoreCase: boolean = true): number {
    if (ignoreCase) {
      id = id.toUpperCase();
    }
    if (!(id in this.bookNumbers)) {
      return 0;
    }
    return this.bookNumbers[id];
  }

  /**
   * Check if a book id is valid
   * @param id id to check
   * @returns true if book id is valid
   */
  static isBookIdValid(id: string): boolean {
    return this.bookIdToNumber(id) > 0;
  }

  /**
   * Check if book id is in western NT
   * @param idOrNum book Id or book number
   */
  static isBookNT(idOrNum: string | number): boolean {
    const num: number = typeof idOrNum === 'number' ? idOrNum : this.bookIdToNumber(idOrNum as string);
    return num >= 40 && num <= 66;
  }

  /**
   * Check if book id is in Protestant OT
   * @param idOrNum book Id or book number
   */
  static isBookOT(idOrNum: string | number): boolean {
    const num: number = typeof idOrNum === 'number' ? idOrNum : this.bookIdToNumber(idOrNum as string);
    return num <= 39;
  }

  static isBookOTNT(idOrNum: string | number): boolean {
    const num: number = typeof idOrNum === 'number' ? idOrNum : this.bookIdToNumber(idOrNum as string);
    return num <= 66;
  }

  /**
   * Check if book is in Deutero Canon
   * @param idOrNum book Id or book number
   */
  static isBooDC(idOrNum: string | number): boolean {
    const num: number = typeof idOrNum === 'number' ? idOrNum : this.bookIdToNumber(idOrNum as string);
    return this.isCanonical(num) && !this.isBookOTNT(num);
  }
  /* CS methods remaining to be converted. They rely on class BookSet.
  /// <summary>
  /// Enumerates all book numbers
  /// </summary>
  static get allBookNumbers():
  {
    get
    {
      for (int i = 1; i <= AllBookIds.Length; i++)
        yield return i;
    }
  }

  /// <summary>
  /// Gets a bookset containing only scripture books, i.e. not XXA, etc.
  /// </summary>
  public static BookSet ScriptureBooks
  {
    get
    {
      if (scriptureBooks == null)
      {
        // This must be lazy as the BookSet constructor depends on Canon. If we try to initialize scriptureBooks
        // in the constructor, then we have a chicken-and-egg problem where the Canon can not initialize without a
        // BookSet and a BookSet can not initialize without a Canon.
        scriptureBooks = new BookSet();
        foreach (int bookNum in AllBookNumbers.Where(bookNum => IsCanonical(bookNum) && !IsObsolete(bookNum)))
          scriptureBooks.Add(bookNum);
      }
      return scriptureBooks;
    }
  }

  /// <summary>
  /// Gets a bookset containing all books that are not obsolete.
  /// </summary>
  public static BookSet AllBooks
  {
    get
    {
      if (allBooks == null)
      {
        allBooks = new BookSet();
        foreach (int bookNum in AllBookNumbers.Where(bookNum => !IsObsolete(bookNum)))
          allBooks.Add(bookNum);
      }
      return allBooks;
    }
  }
*/
  /**
   * Gets the id if a book based on its 1-based number
   * @param num Book number (this is 1-based, not an index)
   * @param errorValue The string to return if the book number does not correspond to a valid book
   */
  static bookNumberToId(num: number, errorValue: string = '***'): string {
    const index: number = num - 1;

    if (index < 0 || index >= Canon.allBookIds.length) {
      return errorValue;
    }

    return Canon.allBookIds[index];
  }

  /**
   * @param idOrNum book Id or book number
   */
  static bookNumberToEnglishName(idOrNum: string | number): string {
    const num: number = typeof idOrNum === 'number' ? idOrNum : this.bookIdToNumber(idOrNum as string);
    // FB 36586 restored check for bad data that was removed earlier in 7.5
    if (num <= 0 || num > this.lastBook) {
      return '******';
    }

    return this.allBookEnglishNames[num - 1];
  }

  /**
   * True if this is a canonical book id, as opposed to front matter etc.
   * @param idOrNum book Id or book number
   */
  static isCanonical(idOrNum: string | number): boolean {
    const id: string = typeof idOrNum === 'string' ? idOrNum : this.bookNumberToId(idOrNum as number);
    return this.isBookIdValid(id) && !this.nonCanonicalIds.includes(id);
  }

  static isExtraMaterial(idOrNum: string | number): boolean {
    const id: string = typeof idOrNum === 'string' ? idOrNum : this.bookNumberToId(idOrNum as number);
    return this.isBookIdValid(id) && this.nonCanonicalIds.includes(id);
  }

  static isObsolete(bookNum: number): boolean {
    const name: string = this.allBookEnglishNames[bookNum - 1];
    return name.includes('*obsolete*');
  }

  private static createBookNumbers(): BookNumbers {
    const bookNumbers: BookNumbers = {};
    for (let i = 0; i < this.allBookIds.length; i++) {
      bookNumbers[this.allBookIds[i]] = i + 1;
    }
    return bookNumbers;
  }
}

interface BookNumbers {
  [key: string]: number;
}

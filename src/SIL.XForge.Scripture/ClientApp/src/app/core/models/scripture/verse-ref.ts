import { Canon } from './canon';
import { ScrVers } from './scr-vers';

/**
 * Stores a reference to a specific verse in Scripture.
 *
 * Partially converted from https://github.com/sillsdev/libpalaso/blob/master/SIL.Scripture/VerseRef.cs
 */
export class VerseRef {
  static readonly defaultVersification: ScrVers = ScrVers.English;
  static readonly verseRangeSeparator = '-';
  static readonly verseSequenceIndicator = ',';
  static readonly verseRangeSeparators: RegExp = /[VerseRef.verseRangeSeparator]+/;
  static readonly verseSequenceIndicators: RegExp = /[VerseRef.verseSequenceIndicator]+/;

  private static readonly chapterDigitShifter: number = 1000;
  private static readonly bookDigitShifter: number = VerseRef.chapterDigitShifter * VerseRef.chapterDigitShifter;
  private static readonly bcvMaxValue: number = VerseRef.chapterDigitShifter - 1;
  private static readonly rtlMark: string = '\u200f';

  /**
   * Tries to parse the specified string into a verse reference
   * @param str The string to attempt to parse
   * @returns success: True if the specified string was successfully parsed, false otherwise
   * @returns vref: The result of the parse if successful, or empty VerseRef if it failed
   */
  static tryParse(str: string): { success: boolean; vref: VerseRef } {
    let vref: VerseRef;
    try {
      vref = VerseRef.fromStr(str);
      return { success: true, vref };
    } catch (error) {
      if (error instanceof VerseRefException) {
        vref = new VerseRef();
        return { success: false, vref };
      }
      throw error;
    }
  }

  /**
   * Parses a verse string and gets the leading numeric portion as a number.
   * @param verseStr
   * @returns true if the entire string could be parsed as a single, simple verse number (1-999);
   *    false if the verse string represented a verse bridge, contained segment letters, or was invalid
   */
  static tryGetVerseNum(verseStr: string): { success: boolean; vNum: number } {
    let vNum: number;
    if (!verseStr) {
      vNum = -1;
      return { success: true, vNum };
    }

    vNum = 0;
    let ch: string;
    for (let i = 0; i < verseStr.length; i++) {
      ch = verseStr[i];
      if (ch < '0' || ch > '9') {
        if (i === 0) {
          vNum = -1;
        }
        return { success: false, vNum };
      }

      vNum = vNum * 10 + +ch - +'0';
      if (vNum > VerseRef.bcvMaxValue) {
        // whoops, we got too big!
        vNum = -1;
        return { success: false, vNum };
      }
    }
    return { success: true, vNum };
  }

  /**
   * Gets the reference as a comparable integer where the book, chapter, and verse each occupy three digits.
   * @param bookNum
   * @param chapterNum
   * @param verseNum
   */
  static getBBBCCCVVV(bookNum: number, chapterNum: number, verseNum: number): number {
    return (
      (bookNum % VerseRef.bcvMaxValue) * VerseRef.bookDigitShifter +
      (chapterNum >= 0 ? (chapterNum % VerseRef.bcvMaxValue) * VerseRef.chapterDigitShifter : 0) +
      (verseNum >= 0 ? verseNum % VerseRef.bcvMaxValue : 0)
    );
  }

  /**
   * Determines if the verse string is in a valid format (does not consider versification).
   */
  static isVerseParseable(verse: string): boolean {
    return (
      verse.length !== 0 &&
      '0123456789'.includes(verse[0]) &&
      verse[verse.length - 1] !== this.verseRangeSeparator &&
      verse[verse.length - 1] !== this.verseSequenceIndicator
    );
  }

  /* Constructors */

  /**
   * Creates an empty reference with the specified versification
   * @param versification
   */
  static fromVersification(versification: ScrVers): VerseRef {
    return new VerseRef(undefined, undefined, undefined, versification);
  }

  /**
   * Creates a reference by parsing the specified string
   * @param verseStr verse string to parse (e.g. "MAT 3:11")
   * @param versification
   * @throws VerseRefException
   */
  static fromStr(verseStr: string, versification: ScrVers = VerseRef.defaultVersification): VerseRef {
    let vref = new VerseRef(undefined, undefined, undefined, versification);
    try {
      vref.parse(verseStr);
    } catch (error) {
      vref = new VerseRef(undefined, undefined, undefined, versification);
    } finally {
      return vref;
    }
  }

  isExcluded?: boolean;
  hasSegmentsDefined?: boolean;
  text?: string;
  BBBCCCVVVS?: string;
  longHashCode?: number;
  versificationStr?: string;

  private _bookNum: number;
  private _chapterNum: number;
  private _verseNum: number;
  private _verse: string;
  private _versification: ScrVers;

  constructor(
    book?: number | string | VerseRef,
    chapter?: number | string,
    verse?: number | string,
    versification?: ScrVers
  ) {
    if (!book && !chapter && !verse && !versification) {
      this._bookNum = 0;
      this._chapterNum = 0;
      this._verseNum = 0;
      this._verse = null;
      versification = null;
    } else if (!book && !chapter && !verse) {
      this._bookNum = 0;
      this._chapterNum = -1;
      this._verseNum = -1;
      this._verse = null;
    } else if (typeof book === 'string' && typeof chapter === 'string' && typeof verse === 'string') {
      this.updateInternal(book, chapter, verse);
    } else if (book instanceof VerseRef && !chapter && !verse && !versification) {
      const vref: VerseRef = book;
      this._bookNum = vref._bookNum;
      this._chapterNum = vref._chapterNum;
      this._verseNum = vref._verseNum;
      this._verse = vref._verse;
      this._versification = vref._versification;
    } else {
      this._bookNum = book as number;
      this._chapterNum = chapter as number;
      this._verseNum = verse as number;
    }

    if (versification === undefined) {
      versification = VerseRef.defaultVersification;
    }
    this._versification = versification;
  }

  /**
   * Checks to see if a VerseRef hasn't been set - all values are the default.
   */
  get isDefault(): boolean {
    return this.bookNum === 0 && this.chapterNum === 0 && this.verseNum === 0 && this.versification == null;
  }

  /**
   * Number of first chapter.
   * TODO bro Do we need to make this 0 for intro material?
   */
  get firstChapter(): number {
    return 1;
  }

  get lastChapter(): number {
    return this._versification.getLastChapter(this.bookNum);
  }

  get lastVerse(): number {
    return this._versification.getLastVerse(this.bookNum, this.chapterNum);
  }

  /**
   * Gets whether the verse contains multiple verses.
   */
  get hasMultiple(): boolean {
    return (
      this._verse != null &&
      (this._verse.includes(VerseRef.verseRangeSeparator) || this._verse.includes(VerseRef.verseSequenceIndicator))
    );
  }

  /**
   * Gets or sets the book of the reference. Book is the three letter abbreviation in capital letters. e.g. "MAT"
   */
  get book(): string {
    return Canon.bookNumberToId(this.bookNum, '');
  }
  set book(value: string) {
    this.bookNum = Canon.bookIdToNumber(value);
  }

  /**
   * Gets or sets the chapter of the reference. e.g. "3"
   */
  get chapter(): string {
    return this.isDefault || this._chapterNum < 0 ? '' : this._chapterNum.toString();
  }
  set chapter(value: string) {
    const chapter: number = +value;
    this._chapterNum = Number.isInteger(chapter) ? chapter : -1;
  }

  /**
   * Gets or sets the verse of the reference e.g. "11"
   */
  get verse(): string {
    if (this._verse != null) {
      return this._verse;
    }
    return this.isDefault || this._verseNum < 0 ? '' : this._verseNum.toString();
  }
  set verse(value: string) {
    const { success, vNum } = VerseRef.tryGetVerseNum(value);
    this._verse = !success ? value.replace(VerseRef.rtlMark, '') : null;
    this._verseNum = vNum;
    if (this._verseNum >= 0) {
      return;
    }

    const { vNum: verseNum } = VerseRef.tryGetVerseNum(this._verse);
    this._verseNum = verseNum;
  }

  /**
   * Gets the reference as a comparable integer where the book, chapter, and verse each occupy three digits and the
   * verse is 0.
   */
  get BBBCCC(): number {
    return VerseRef.getBBBCCCVVV(this._bookNum, this._chapterNum, 0);
  }

  /**
   * Gets the reference as a comparable integer where the book, chapter, and verse each occupy three digits. If verse is
   * not null (i.e., this reference represents a complex reference with verse segments or bridge) this cannot be used
   * for an exact comparison.
   */
  get BBBCCCVVV(): number {
    return VerseRef.getBBBCCCVVV(this._bookNum, this._chapterNum, this._verseNum);
  }

  /**
   * Determines if the reference is valid
   */
  get valid(): boolean {
    return this.validStatus === ValidStatusType.Valid;
  }

  /**
   * Get the valid status for this reference.
   */
  get validStatus(): ValidStatusType {
    return this.validateVerse(VerseRef.verseRangeSeparators, VerseRef.verseSequenceIndicators);
  }

  /**
   * Makes a clone of the reference
   */
  clone(): VerseRef {
    // Leaving this for now to reduce code changes. Isn't really nessary when VerseRef is a struct since a=b is a copy.
    return new VerseRef(this);
  }

  /**
   * Parses the reference in the specified string.
   * Optionally versification can follow reference as in GEN 3:11/4
   * Throw an exception if
   * - invalid book name
   * - chapter number is missing or not a number
   * - verse number is missing or does not start with a number
   * - versifcation is invalid
   * @param verseStr string to parse e.g. "MAT 3:11"
   */
  parse(verseStr: string): void {
    verseStr = verseStr.replace(VerseRef.rtlMark, '');
    if (verseStr.includes('/')) {
      const parts: string[] = verseStr.split('/');
      verseStr = parts[0];
      if (parts.length > 1) {
        try {
          const scrVerseCode: number = +parts[1].trim();
          this.versification = new ScrVers(ScrVersType[scrVerseCode]);
        } catch (error) {
          throw new VerseRefException('Invalid reference : ' + verseStr);
        }
      }
    }

    const b_cv: string[] = verseStr.trim().split(' ');
    if (b_cv.length !== 2) {
      throw new VerseRefException('Invalid reference : ' + verseStr);
    }

    const c_v: string[] = b_cv[1].split(':');

    const cnum: number = +c_v[0];
    if (
      c_v.length !== 2 ||
      Canon.bookIdToNumber(b_cv[0]) === 0 ||
      !Number.isInteger(cnum) ||
      cnum < 0 ||
      !VerseRef.isVerseParseable(c_v[1])
    ) {
      throw new VerseRefException('Invalid reference : ' + verseStr);
    }

    this.updateInternal(b_cv[0], c_v[0], c_v[1]);
  }

  toString(): string {
    const book: string = this.book;
    if (book.length === 0) {
      return ''; // Handle empty book by just returning empty string - works around a bug in Mono 3.
    }

    return book + ' ' + this.chapter + ':' + this.verse;
  }

  /**
   * .e.g GEN 3:11/4. Parse understands this format.
   */
  toStringWithVersification(): string {
    return this.toString() + '/' + this.versification.type;
  }

  get bookNum(): number {
    return this._bookNum;
  }
  set bookNum(value: number) {
    if (value <= 0 || value > Canon.lastBook) {
      throw new VerseRefException('BookNum must be greater than zero and less than or equal to last book');
    }
    this._bookNum = value;
  }

  get chapterNum(): number {
    return this._chapterNum;
  }
  set chapterNum(value: number) {
    // ToDo: replace or remove this placeholder
    this.chapterNum = value;
  }

  get verseNum(): number {
    return this._verseNum;
  }
  set verseNum(value: number) {
    // ToDo: replace or remove this placeholder
    this._verseNum = value;
  }

  get versification(): ScrVers {
    return this._versification;
  }
  set versification(value: ScrVers) {
    this._versification = value;
  }

  /**
   * Enumerate all individual verses contained in a VerseRef.
   * Verse ranges are indicated by "-" and consecutive verses by ","s.
   * Examples:
   *   GEN 1:2 returns GEN 1:2
   *   GEN 1:1a-3b,5 returns GEN 1:1a, GEN 1:2, GEN 1:3b, GEN 1:5
   *   GEN 1:2a-2c returns //! ??????
   * @param specifiedVersesOnly if set to <c>true</c> return only verses that are explicitly specified only, not verses
   *   within a range.
   * @param verseRangeSeparators
   * @param verseSequenceSeparators
   */
  *allVerses(
    specifiedVersesOnly: boolean = false,
    verseRangeSeparators: RegExp = VerseRef.verseRangeSeparators,
    verseSequenceSeparators: RegExp = VerseRef.verseSequenceIndicators
  ): IterableIterator<VerseRef> {
    if (this._verse == null || this.chapterNum <= 0) {
      yield this.clone();
    } else {
      let vref: VerseRef;
      const book: number = this.bookNum;
      const chapter: number = this.chapterNum;

      const parts: string[] = this._verse.split(verseSequenceSeparators);
      for (const pieces of parts.filter(part => part.split(verseRangeSeparators))) {
        vref = this.clone();
        vref.verse = pieces[0];
        const startVerse: number = vref.verseNum;
        yield vref;

        if (pieces.length > 1) {
          const vlast: VerseRef = this.clone();
          vlast.verse = pieces[1];

          if (!specifiedVersesOnly) {
            // get all verses within a range
            for (let verseNum = startVerse + 1; verseNum < vlast.verseNum; verseNum++) {
              const verseInRange: VerseRef = new VerseRef(book, chapter, verseNum, this._versification);
              if (!verseInRange.isExcluded) {
                yield new VerseRef(book, chapter, verseNum, this._versification);
              }
            }
          }
          yield vlast;
        }
      }
    }
  }

  /**
   * Gets the single verses or verse ranges that are represented in this verse.
   */
  *getRanges(): IterableIterator<VerseRef> {
    if (this._verse == null || this.chapterNum <= 0) {
      yield this.clone();
    } else {
      const ranges: string[] = this._verse.split(',');
      for (const range of ranges) {
        const vRef: VerseRef = this.clone();
        vRef.verse = range;
        yield vRef;
      }
    }
  }

  /**
   * Validates a verse number using the supplied separators rather than the defaults.
   */
  validateVerse(verseRangeSeparators: RegExp, verseSequenceSeparators: RegExp): ValidStatusType {
    if (!this.verse) {
      return this.internalValid;
    }
    /*
    let prevVerse: number = 0;
    foreach (VerseRef vRef in AllVerses(true, verseRangeSeparators, verseSequenceSeparators)) {
      ValidStatusType validStatus = vRef.InternalValid;
      if (validStatus != ValidStatusType.Valid)
        return validStatus;

      int bbbcccvvv = vRef.BBBCCCVVV;
      if (prevVerse > bbbcccvvv)
        return ValidStatusType.VerseOutOfOrder;
      if (prevVerse == bbbcccvvv)
        return ValidStatusType.VerseRepeated;
      prevVerse = bbbcccvvv;
    }*/
    return ValidStatusType.Valid; // TODO: make Valid tests Valid Status tests
  }

  /**
   * Gets whether a single verse reference is valid.
   */
  private get internalValid(): ValidStatusType {
    // Unknown versification is always invalid
    if (this._versification == null) {
      return ValidStatusType.UnknownVersification;
    }

    // If invalid book, reference is invalid
    if (this._bookNum <= 0 || this._bookNum > Canon.lastBook) {
      return ValidStatusType.OutOfRange;
    }

    // If non-biblical book, any chapter/verse is valid
    /*
    if (!Canon.isCanonical(this._bookNum)) {
      return ValidStatusType.Valid;
    }

    if (this._bookNum > this._versification.getLastBook() || this._chapterNum <= 0 ||
      this._chapterNum > this._versification.getLastChapter(this._bookNum) || this.verseNum < 0 ||
      this.verseNum > this._versification.getLastVerse(this._bookNum, this._chapterNum)
    ) {
      return ValidStatusType.OutOfRange;
    }

    return this._versification.isExcluded(this.BBBCCCVVV) ? ValidStatusType.OutOfRange : ValidStatusType.Valid;
    */
    return ValidStatusType.Valid;
  }

  private updateInternal(bookStr: string, chapterStr: string, verseStr: string): void {
    this.bookNum = Canon.bookIdToNumber(bookStr);
    this.chapter = chapterStr;
    this.verse = verseStr;
  }
}

export class VerseRefException extends Error {}

/**
 * The valid status of the VerseRef
 */
export enum ValidStatusType {
  Valid,
  UnknownVersification,
  OutOfRange,
  VerseOutOfOrder,
  VerseRepeated
}

// note: elsewhere this is a string enum
enum ScrVersType {
  Unknown,
  Original,
  Septuagint,
  Vulgate,
  English,
  RussianProtestant,
  RussianOrthodox
}

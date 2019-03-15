/* tslint:disable:ordered-imports max-line-length */
// <auto-generated>
//     Generated with CodeGeneratorApp v9.12.0.0 (Newtonsoft.Json v11.0.0.0) (http://NJsonSchema.org)
//     Last Generated on 192019-3-15 17:59
// </auto-generated>

import { Project } from 'xforge-common/models/project';
import { ProjectRef } from 'xforge-common/models/project';
import { ProjectUser } from 'xforge-common/models/project-user';
import { ProjectUserRef } from 'xforge-common/models/project-user';
import { ProjectData } from 'xforge-common/models/project-data';
import { ProjectDataRef } from 'xforge-common/models/project-data';

/** --- Generated Interface */
export interface TaskConfig {
  enabled?: boolean;
}

/** --- Generated Interface */
export interface CheckingConfig extends TaskConfig {
  enabled?: boolean;
  usersSeeEachOthersResponses?: boolean;
}

/** --- Generated Interface */
export interface TranslateConfig extends TaskConfig {
  enabled?: boolean;
  sourceParatextId?: string;
  sourceInputSystem?: InputSystem;
  isTranslationDataShared?: boolean;
  confidenceThreshold?: number;
  metrics?: TranslateMetrics;
}

/** --- Generated Interface */
export interface InputSystem {
  abbreviation?: string;
  tag?: string;
  languageName?: string;
  isRightToLeft?: boolean;
}

/** --- Generated Interface */
export interface TranslateMetrics {
  activeEditTimeout?: number;
  editingTimeout?: number;
}

export abstract class SyncJobBase extends ProjectData {
  /** type identifier string for domain type mapping */
  static readonly TYPE: string = 'syncJob';
  percentCompleted?: number;
  state?: string;
  constructor(init?: Partial<SyncJobBase>) {
    super(SyncJobBase.TYPE, init);
  }
}

/** ResourceRef class for SyncJobBase **/
export class SyncJobRef extends ProjectDataRef {
  static readonly TYPE: string = SyncJobBase.TYPE;

  constructor(id: string) {
    super(SyncJobRef.TYPE, id);
  }
}

export abstract class TextBase extends ProjectData {
  /** type identifier string for domain type mapping */
  static readonly TYPE: string = 'text';
  name?: string;
  bookId?: string;
  chapters?: Chapter[];
  constructor(init?: Partial<TextBase>) {
    super(TextBase.TYPE, init);
  }
}

/** ResourceRef class for TextBase **/
export class TextRef extends ProjectDataRef {
  static readonly TYPE: string = TextBase.TYPE;

  constructor(id: string) {
    super(TextRef.TYPE, id);
  }
}

/** --- Generated Interface */
export interface Chapter {
  number?: number;
  lastVerse?: number;
}

export abstract class SFProjectUserBase extends ProjectUser {
  /** type identifier string for domain type mapping */
  static readonly TYPE: string = 'projectUser';
  selectedTask?: string;
  translateConfig?: TranslateProjectUserConfig;
  constructor(init?: Partial<SFProjectUserBase>) {
    super(SFProjectUserBase.TYPE, init);
  }
}

/** ResourceRef class for SFProjectUserBase **/
export class SFProjectUserRef extends ProjectUserRef {
  static readonly TYPE: string = SFProjectUserBase.TYPE;

  constructor(id: string) {
    super(SFProjectUserRef.TYPE, id);
  }
}

/** --- Generated Interface */
export interface TranslateProjectUserConfig {
  isTargetTextRight?: boolean;
  confidenceThreshold?: number;
  selectedTextRef?: string;
  selectedChapter?: number;
  selectedSegment?: string;
  selectedSegmentChecksum?: number;
}

export abstract class SFProjectBase extends Project {
  /** type identifier string for domain type mapping */
  static readonly TYPE: string = 'project';
  paratextId?: string;
  checkingConfig?: CheckingConfig;
  translateConfig?: TranslateConfig;
  lastSyncedDate?: Date;
  activeSyncJob?: SyncJobRef;
  texts?: TextRef[];
  constructor(init?: Partial<SFProjectBase>) {
    super(SFProjectBase.TYPE, init);
  }
}

/** ResourceRef class for SFProjectBase **/
export class SFProjectRef extends ProjectRef {
  static readonly TYPE: string = SFProjectBase.TYPE;

  constructor(id: string) {
    super(SFProjectRef.TYPE, id);
  }
}

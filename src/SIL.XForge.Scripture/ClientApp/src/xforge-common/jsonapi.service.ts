import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Coordinator, {
  ConnectionStrategy, LogTruncationStrategy, RequestStrategy, SyncStrategy
} from '@orbit/coordinator';
import { Exception } from '@orbit/core';
import {
  buildQuery, ClientError, FindRecord, NetworkError, Operation, Query, QueryOrExpression, Record, RecordIdentity,
  ReplaceRecordOperation, Schema, SchemaSettings, Transform, TransformOrOperations
} from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import Store from '@orbit/store';
import { clone, Dict } from '@orbit/utils';
import { ObjectId } from 'bson';
import { from, fromEventPattern, merge, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { XForgeJSONAPISource } from './jsonapi/xforge-jsonapi-source';
import { LiveQueryObservable } from './live-query-observable';

@Injectable({
  providedIn: 'root'
})
export class JSONAPIService {
  private static readonly STORE = 'store';
  private static readonly REMOTE = 'remote';
  private static readonly BACKUP = 'backup';
  private static readonly RETRY_TIMEOUT = 5000;

  private schema: Schema;
  private bucket: IndexedDBBucket;
  private store: Store;
  private remote: XForgeJSONAPISource;
  private backup: IndexedDBSource;
  private coordinator: Coordinator;

  constructor(private readonly http: HttpClient) { }

  async init(accessToken: string): Promise<void> {
    const schemaDef = await this.http.get<SchemaSettings>('api/schema',
      { headers: { 'Content-Type': 'application/json' } }).toPromise();
    schemaDef.generateId = () => new ObjectId().toHexString();
    this.schema = new Schema(schemaDef);

    this.bucket = new IndexedDBBucket({
      namespace: 'xforge-state'
    });

    this.store = new Store({
      schema: this.schema,
      bucket: this.bucket
    });

    this.remote = new XForgeJSONAPISource({
      schema: this.schema,
      bucket: this.bucket,
      name: JSONAPIService.REMOTE,
      host: window.location.origin,
      namespace: 'api'
    });

    this.backup = new IndexedDBSource({
      schema: this.schema,
      bucket: this.bucket,
      name: JSONAPIService.BACKUP,
      namespace: 'xforge'
    });

    this.coordinator = new Coordinator({
      sources: [this.store, this.remote, this.backup],
      strategies: [
        // Do not queue queries that fail
        new RequestStrategy({
          source: JSONAPIService.STORE,
          on: 'queryFail',

          action: () => this.store.requestQueue.skip(),

          blocking: true
        }),
        // Purge a deleted resource from the cache when get() is called on it
        new RequestStrategy({
          source: JSONAPIService.REMOTE,
          on: 'pullFail',

          action: (q: Query, e: Exception) => this.purgeDeletedResource(q, e),

          blocking: true
        }),
        // Purge deleted resources from the cache when getAll() is called
        new ConnectionStrategy({
          source: JSONAPIService.REMOTE,
          on: 'pull',

          action: (q: Query, t: Transform[]) => this.purgeDeletedResources(q, t),
          filter: (q: Query) => q.expression.op === 'findRecords'
        }),
        // Retry sending updates to server when push fails
        new RequestStrategy({
          source: JSONAPIService.REMOTE,
          on: 'pushFail',

          action: (t: Transform, e: Exception) => this.handleFailedPush(t, e),

          blocking: true
        }),
        // Query the remote server whenever the store is queried
        new RequestStrategy({
          source: JSONAPIService.STORE,
          on: 'beforeQuery',

          target: JSONAPIService.REMOTE,
          action: 'pull',

          blocking: (q: Query) => q.options.blocking,

          catch: (e: Exception) => {
            this.store.requestQueue.skip();
            this.remote.requestQueue.skip();
            throw e;
          }
        }),
        // Update the remote server whenever the store is updated
        new RequestStrategy({
          source: JSONAPIService.STORE,
          on: 'beforeUpdate',

          target: JSONAPIService.REMOTE,
          filter: (t: Transform) => this.shouldUpdate(t, JSONAPIService.REMOTE),
          action: 'push',

          blocking: (t: Transform) => t.options.blocking
        }),
        // Sync all changes received from the remote server to the store
        new SyncStrategy({
          source: JSONAPIService.REMOTE,

          target: JSONAPIService.STORE,

          blocking: false
        }),
        // Sync all changes to the store to IndexedDB
        new SyncStrategy({
          source: JSONAPIService.STORE,

          target: JSONAPIService.BACKUP,
          filter: (t: Transform) => this.shouldUpdate(t, JSONAPIService.BACKUP),

          blocking: true
        }),
        new LogTruncationStrategy()
      ]
    });

    this.setAccessToken(accessToken);

    // restore backup
    const transforms = await this.backup.pull(q => q.findRecords());
    await this.store.sync(transforms);
    await this.coordinator.activate();
  }

  liveQuery(queryOrExpression: QueryOrExpression, persist = true): LiveQueryObservable<any> {
    const query = buildQuery(queryOrExpression, this.getOptions(persist, false), undefined, this.store.queryBuilder);

    const patch$ = fromEventPattern(
      handler => this.store.cache.on('patch', handler),
      handler => this.store.cache.off('patch', handler),
    );

    const reset$ = fromEventPattern(
      handler => this.store.cache.on('reset', handler),
      handler => this.store.cache.off('reset', handler),
    );

    const source$ = merge(patch$, reset$).pipe(
      map(() => this.getCurrentResource(query)),
      startWith(this.getCurrentResource(query))
    );

    const observable = new LiveQueryObservable(source$, this.store, query);
    observable.update();
    return observable;
  }

  query(queryOrExpression: QueryOrExpression, persist = true): Observable<any> {
    return from(this.store.query(queryOrExpression, this.getOptions(persist, true))).pipe(map(r => clone(r)));
  }

  async create(resource: Record, persist = true, blocking = false): Promise<string> {
    this.schema.initializeRecord(resource);
    await this.update(t => t.addRecord(clone(resource)), persist, blocking);
    return resource.id;
  }

  replace(resource: Record, persist = true, blocking = false): Promise<void> {
    return this.update(t => t.replaceRecord(resource), persist, blocking);
  }

  updateAttributes(resource: RecordIdentity, attrs: Dict<any>, persist = true, blocking = false): Promise<void> {
    return this.update(t => {
      const ops: Operation[] = [];
      for (const [name, value] of Object.entries(attrs)) {
        ops.push(t.replaceAttribute(resource, name, value));
      }
      return ops;
    }, persist, blocking);
  }

  delete(resource: RecordIdentity, persist = true, blocking = false): Promise<void> {
    return this.update(t => t.removeRecord(resource), persist, blocking);
  }

  addRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity, persist = true, blocking = false
  ): Promise<void> {
    return this.update(t => t.addToRelatedRecords(resource, relationship, related), persist, blocking);
  }

  removeRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity, persist = true,
    blocking = false
  ): Promise<void> {
    return this.update(t => t.removeFromRelatedRecords(resource, relationship, related), persist, blocking);
  }

  replaceAllRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity[], persist = true,
    blocking = false
  ): Promise<void> {
    return this.update(t => t.replaceRelatedRecords(resource, relationship, related), persist, blocking);
  }

  setRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity, persist = true, blocking = false
  ): Promise<void> {
    return this.update(t => t.replaceRelatedRecord(resource, relationship, related), persist, blocking);
  }

  private update(transformOrOperations: TransformOrOperations, persist = true, blocking: boolean): Promise<any> {
    return this.store.update(transformOrOperations, this.getOptions(persist, blocking));
  }

  private getOptions(persist: boolean, blocking: boolean): any {
    const update = [JSONAPIService.REMOTE];
    if (persist) {
      update.push(JSONAPIService.BACKUP);
    }

    return { update, blocking };
  }

  setAccessToken(accessToken: string): void {
    this.remote.defaultFetchSettings.headers['Authorization'] = 'Bearer ' + accessToken;
  }

  private getCurrentResource(query: Query): any {
    try {
      return clone(this.store.cache.query(query));
    } catch (ex) {
      return null;
    }
  }

  private shouldUpdate(transform: Transform, source: string): boolean {
    if (transform.options == null || transform.options.update == null) {
      return true;
    }
    const update: string[] = transform.options.update;
    return update.includes(source);
  }

  private purgeDeletedResource(query: Query, ex: Exception): void {
    if (ex instanceof ClientError) {
      const response: Response = (ex as any).response;
      if (response.status === 404 && query.expression.op === 'findRecord') {
        this.removeFromBackup([(query.expression as FindRecord).record]);
      }
    }
  }

  private purgeDeletedResources(query: Query, result: Transform[]): void {
    const cachedResources: Record[] = this.store.cache.query(query);
    if (cachedResources.length === 0) {
      return;
    }

    const transform = result[0];
    const remoteResourceIds = new Set<string>();
    for (const op of transform.operations) {
      remoteResourceIds.add((op as ReplaceRecordOperation).record.id);
    }

    const deletedResources: Record[] = [];
    for (const cachedResource of cachedResources) {
      if (!remoteResourceIds.has(cachedResource.id)) {
        deletedResources.push(cachedResource);
      }
    }

    this.removeFromBackup(deletedResources);
  }

  private handleFailedPush(transform: Transform, ex: Exception): Promise<void> {
    if (ex instanceof NetworkError && this.shouldUpdate(transform, JSONAPIService.BACKUP)) {
      setTimeout(() => this.remote.requestQueue.retry(), JSONAPIService.RETRY_TIMEOUT);
    } else {
      if (this.store.transformLog.contains(transform.id)) {
        this.store.rollback(transform.id, -1);
      }
      return this.remote.requestQueue.skip();
    }
  }

  private removeFromBackup(resources: Record[]): void {
    if (resources.length === 0) {
      return;
    }

    this.store.update(t => {
      const ops: Operation[] = [];
      for (const resource of resources) {
        ops.push(t.removeRecord(resource));
      }
      return ops;
    }, { update: [JSONAPIService.BACKUP] });
  }
}
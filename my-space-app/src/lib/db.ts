import Dexie, { type Table } from 'dexie';
import type { DocumentRecord,BoardRecord } from './models';
export class SpaceDatabase extends Dexie {
 documents!:Table<DocumentRecord,string>;
 boards!:Table<BoardRecord,string>;
 constructor(name='my-space') {super(name);this.version(1).stores({documents:'id, title, updatedAt',boards:'id, title, updatedAt'});}
}
export const db=new SpaceDatabase();

import {getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TextStyle,Color} from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import type {DocumentRecord} from './models';
export function validateDocuments(documents:DocumentRecord[]){const schema=getSchema([StarterKit,TextStyle,Color,Highlight.configure({multicolor:true})]);for(const doc of documents)schema.nodeFromJSON(doc.content).check();}

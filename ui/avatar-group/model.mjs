export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length ? (Array.from(words[0])[0] + (words.length > 1 ? Array.from(words.at(-1))[0] : '')).toLocaleUpperCase() : '?';
}

export function membersFromPresence(state) {
  const people = new Map();
  for (const sessions of Object.values(state)) {
    for (const person of sessions) {
      if (typeof person.id !== 'string' || !person.id) continue;
      const previous = people.get(person.id);
      if (!previous || String(person.updated_at || '') > String(previous.updated_at || '')) people.set(person.id, person);
    }
  }
  return [...people.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function safePicture(value) {
  return typeof value === 'string' && (/^https:\/\//i.test(value) || /^data:image\/(png|jpeg|webp);base64,/i.test(value)) ? value : undefined;
}

export default function sortKeys<T>(obj: T, keys: (keyof T)[]): T {
  const result: any = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  for (const key of Object.keys(obj).sort()) {
    if (!keys.includes(key as keyof T)) {
      result[key] = obj[key as keyof T];
    }
  }
  return result;
}

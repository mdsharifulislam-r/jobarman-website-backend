export const cleanObject = (obj: any): any => {
  const excludedValues = ["", null, "null", "undefined", "Invalid Date"];

  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanObject(item))
      .filter(item => item !== undefined);
  }

  if (obj === null || typeof obj !== "object") {
    if (Number.isNaN(obj)) return undefined;
    if (excludedValues.includes(obj)) return undefined;
    if (obj === 0) return undefined;
    return obj;
  }

  const cleaned: any = {};

  for (const key in obj) {
    const value = cleanObject(obj[key]);
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
};
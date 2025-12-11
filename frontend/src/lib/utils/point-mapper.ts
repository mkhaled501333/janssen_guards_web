/**
 * Point mapping utilities for patrol points
 */

// Normalize point number (remove leading zeros)
export function normalizePoint(point: string): string {
  try {
    return parseInt(point, 10).toString();
  } catch {
    return point;
  }
}

// Get Arabic point name
export function getPointName(point: string): string {
  const pointNames: Record<string, string> = {
    '1': 'محطه مياه',
    '2': 'غرفة محول',
    '3': 'غرفة طلمبات',
    '4': 'م كيماويات',
    '5': 'م تانكات',
    '6': 'المعمل',
    '7': 'الصبه',
    '8': 'المنشر',
    '9': 'م البلوكات',
    '10': 'المقصات',
    '11': 'البسكول',
    '12': 'ش خلفى',
  };

  return pointNames[point] || `Point ${point}`;
}


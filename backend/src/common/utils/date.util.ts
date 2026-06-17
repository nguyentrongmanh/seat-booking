export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isExpired(date: Date): boolean {
  return date < new Date();
}

export function minutesFromNow(minutes: number): Date {
  return addMinutes(new Date(), minutes);
}

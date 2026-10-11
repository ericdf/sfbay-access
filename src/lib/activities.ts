/** Ways people use the Bay. Order is the order shown in the composer. */
export const ACTIVITIES = [
  { id: 'swimming', label: 'Open-water swimming' },
  { id: 'windsurfing', label: 'Windsurfing' },
  { id: 'kitesurfing', label: 'Kitesurfing' },
  { id: 'wingfoiling', label: 'Wingfoiling' },
  { id: 'kayaking', label: 'Kayaking' },
  { id: 'sup', label: 'Stand-up paddling (SUP)' },
  { id: 'rowing', label: 'Rowing' },
  { id: 'sailing', label: 'Sailing' },
  { id: 'fishing', label: 'Fishing' },
  { id: 'beach', label: 'Beach visits / walking' },
  { id: 'other', label: 'Other' },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]['id'];

export const ACTIVITY_IDS = ACTIVITIES.map((a) => a.id) as [ActivityId, ...ActivityId[]];

export function activityLabel(id: string): string {
  return ACTIVITIES.find((a) => a.id === id)?.label ?? id;
}

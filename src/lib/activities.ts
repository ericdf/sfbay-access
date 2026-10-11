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

/** "How does this decision affect your access?" options. */
export const ACCESS_FACTORS = [
  { id: 'safe_entry', label: 'Getting in and out of the water safely' },
  { id: 'water_quality', label: 'Water quality' },
  { id: 'beach_width', label: 'How much beach is left' },
  { id: 'parking', label: 'Parking' },
  { id: 'unloading', label: 'Unloading and carrying gear' },
  { id: 'launch_space', label: 'Launch and landing space' },
  { id: 'abilities', label: 'Access for people of different abilities' },
] as const;

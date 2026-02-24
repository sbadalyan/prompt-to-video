export interface Template {
  id: string;
  name: string;
  description: string;
  mood: string;
  accentColor: string;
  styleHint: string;
  type?: "promo" | "chart";
}

export const TEMPLATES: Template[] = [
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Narrative arc with atmospheric imagery and dramatic pacing',
    mood: 'Cinematic',
    accentColor: '#d97706',
    styleHint:
      'Cinematic storytelling style: use split-left and split-right for at least 70% of middle scenes; at most 2 text-only scenes. Use scale animations for dramatic title scenes, fade for reflective moments. Longer scene durations (160–180 frames). Write atmospheric, evocative body text with 4–6 full sentences per split scene. Never use bullet points — prose only.',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Clear structure and professional hierarchy for business audiences',
    mood: 'Professional',
    accentColor: '#059669',
    styleHint:
      'Corporate professional style: use split-left and split-right for at least 70% of middle scenes; at most 2 text-only scenes. Medium font weights (fontWeight 400–500). Consistent fade animations. Body text should include structured bullet points (\\n• item format) with 4–6 items per scene. Direct, concise titles without embellishment.',
  },
  {
    id: 'chart',
    name: 'Bar Chart Race',
    description: 'Animated racing bar chart showing rankings change over time',
    mood: 'Data',
    accentColor: '#6366f1',
    type: 'chart',
    styleHint: '',
  },
];

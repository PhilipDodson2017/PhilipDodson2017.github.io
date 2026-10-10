// All portfolio content lives here. Edit this file to change what's "showing" —
// the components read from it and never need to change for content updates.

export const person = {
  name: 'Philip Dodson',
  role: 'Senior Backend Python Engineer',
  links: {
    linkedin: 'https://www.linkedin.com/in/philip-dodson-473159267/',
    github: 'https://github.com/PhilipDodson2017',
  },
}

export const films = [
  {
    id: 'opening',
    kind: 'title', // rendered as a title card instead of a poster image
    title: 'Philip Dodson',
    short: 'Opening credits',
    tagline: person.role,
    // DRAFT copy — replace with your own voice.
    blurb:
      "I'm a senior backend Python engineer. Grab a seat: the reel shows a few things I've built, from a timer app you can use today to an AI skill for interview prep.",
    links: [
      { label: 'LinkedIn', href: person.links.linkedin, primary: true },
      { label: 'GitHub', href: person.links.github },
    ],
  },
  {
    id: 'squaretimer',
    kind: 'project',
    title: 'Square Timer',
    short: 'Square Timer',
    poster: '/posters/squaretimer.png',
    posterAlt:
      'Square Timer: three chained timers labelled Warm up, Deep work and Break, with the first counting down.',
    blurb:
      'A sequential task timer. Chain timers into a routine and each one hands off to the next, so you can run a warm-up, a focus block and a break without touching anything.',
    features: [
      'Chain any number of timers',
      'Auto-start the next timer',
      'Collapse inactive timers',
      'Advanced UI mode',
    ],
    tags: ['Web app', 'Live'],
    links: [
      { label: 'Visit squaretimer.com', href: 'https://squaretimer.com', primary: true },
    ],
  },
  {
    id: 'ai-tools',
    kind: 'project',
    title: 'AI Tools: Story Matrix',
    short: 'Story Matrix',
    poster: '/posters/story-matrix.png',
    posterAlt:
      'Story Matrix: a dark grid with behavioral interview topics as rows and specific projects as columns, filled with evidence bullets.',
    blurb:
      'A Claude Code skill that turns notes, performance reviews and tickets into a browsable interview-story matrix, so every behavioral answer is backed by a real, sourced example.',
    features: [
      'Rows are the six behavioral interview topics',
      'Columns are specific projects and incidents',
      'Every bullet keeps its source',
      'Outputs a dependency-free static web app',
    ],
    tags: ['Claude Code skill', 'JavaScript', 'Python', 'Static web app'],
    links: [
      { label: 'View on GitHub', href: 'https://github.com/PhilipDodson2017/ai-tools', primary: true },
    ],
  },
]

type DiagramMode = 'MUD' | 'TOTE' | 'HYBRID' | 'GENERIC';

export const getAvailableTools = (mode: DiagramMode) => {
  switch (mode) {
    case 'MUD':
      return ['select', 'vocabulary', 'practice', 'edge'] as const;
    case 'TOTE':
      return ['select', 'test', 'operate', 'edge', 'entry', 'exit'] as const;
    case 'HYBRID':
      return ['select', 'vocabulary', 'practice', 'test', 'operate', 'edge', 'entry', 'exit'] as const;
    case 'GENERIC':
      return ['select', 'custom', 'edge'] as const;
  }
};

export const getModeDescription = (mode: DiagramMode) => {
  switch (mode) {
    case 'MUD':
      return 'Meaning-Use Diagram mode - visualize relationships between vocabularies and practices';
    case 'TOTE':
      return 'TOTE Cycle mode - create Test-Operate-Test-Exit behavioral loops';
    case 'HYBRID':
      return 'Hybrid mode - combine MUD and TOTE elements in a single diagram';
    case 'GENERIC':
      return 'Generic mode - create any type of graph with custom shapes and labels';
  }
};
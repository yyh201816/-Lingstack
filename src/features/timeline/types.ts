export interface TimelineEvent { id: string; type: 'goal'|'analysis'|'tool-call'|'diff'|'status'; timestamp: string; title: string; content: string; status?: 'running'|'success'|'failed'|'pending'; }

import { defineStore } from 'pinia'
import { ref } from 'vue'

interface TimelineEvent { id: string; type: 'goal'|'analysis'|'tool-call'|'diff'|'status'; timestamp: string; title: string; content: string; status?: string; }

export const useTimelineStore = defineStore('timeline', () => {
  const events = ref<TimelineEvent[]>([])
  const isStreaming = ref(false)
  function addEvent(event: TimelineEvent) { events.value.push(event) }
  return { events, isStreaming, addEvent }
})

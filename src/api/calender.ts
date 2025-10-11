import { useMemo } from 'react';

// third-party
import useSWR, { mutate } from 'swr';

// types
import { EventInput } from '@fullcalendar/common';

// ==============================|| CALENDAR API ||============================== //

const endpoints = {
  key: 'api/calendar/events',
  add: '/add', // server URL
  udpate: '/update', // server URL
  delete: '/delete' // server URL
};

// Local storage key for events
const LOCAL_STORAGE_KEY = 'calendar_events';

// Get events from localStorage
function getLocalEvents(): EventInput[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading events from localStorage:', error);
    return [];
  }
}

// Save events to localStorage
function saveLocalEvents(events: EventInput[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Error saving events to localStorage:', error);
  }
}

export function useGetEvents() {
  // Use localStorage for event storage
  const {
    data,
    isLoading,
    error,
    isValidating
  } = useSWR(endpoints.key, () => getLocalEvents(), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    fallbackData: []
  });

  const memoizedValue = useMemo(
    () => ({
      events: data as EventInput[],
      eventsLoading: isLoading,
      eventsError: error,
      eventsValidating: isValidating,
      eventsEmpty: !isLoading && (!data || data.length === 0)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function createEvent(newEvent: Omit<EventInput, 'id'>) {
  const currentEvents = getLocalEvents();
  const eventWithId = { ...newEvent, id: `${Date.now()}-${Math.random()}` };
  const updatedEvents = [...currentEvents, eventWithId];

  // Save to localStorage
  saveLocalEvents(updatedEvents);

  // Update SWR cache
  mutate(endpoints.key, updatedEvents, false);
}

export async function updateEvent(
  eventId: string,
  updatedEvent: Partial<{
    allDay: boolean;
    start: Date | null;
    end: Date | null;
    title?: string;
    description?: string;
    color?: string;
    textColor?: string;
  }>
) {
  const currentEvents = getLocalEvents();
  const updatedEvents = currentEvents.map((event: EventInput) => (event.id === eventId ? { ...event, ...updatedEvent } : event));

  // Save to localStorage
  saveLocalEvents(updatedEvents);

  // Update SWR cache
  mutate(endpoints.key, updatedEvents, false);
}

export async function deleteEvent(eventId: string) {
  const currentEvents = getLocalEvents();
  const filteredEvents = currentEvents.filter((event: EventInput) => event.id !== eventId);

  // Save to localStorage
  saveLocalEvents(filteredEvents);

  // Update SWR cache
  mutate(endpoints.key, filteredEvents, false);
}

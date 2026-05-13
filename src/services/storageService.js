import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';

const KEYS = {
  PEOPLE: 'tend_people',
  LOG_ENTRIES: 'tend_log_entries',
  TASKS: 'tend_tasks',
  USER_SETTINGS: 'tend_user_settings',
  APP_STATE: 'tend_app_state',
};

export const loadInitialData = async () => {
  try {
    // Check if data exists, if not create empty collections
    const people = await AsyncStorage.getItem(KEYS.PEOPLE);
    if (!people) {
      await AsyncStorage.setItem(KEYS.PEOPLE, JSON.stringify([]));
    }

    const logEntries = await AsyncStorage.getItem(KEYS.LOG_ENTRIES);
    if (!logEntries) {
      await AsyncStorage.setItem(KEYS.LOG_ENTRIES, JSON.stringify([]));
    }

    const tasks = await AsyncStorage.getItem(KEYS.TASKS);
    if (!tasks) {
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify([]));
    }

    const settings = await AsyncStorage.getItem(KEYS.USER_SETTINGS);
    if (!settings) {
      const defaultSettings = {
        defaultTone: 'warm',
        theme: 'sunday',
        weeklyCheckIn: {
          enabled: true,
          dayOfWeek: 5, // Saturday
          timeOfDay: 'afternoon',
        },
        tendingSince: new Date().toISOString(),
        userName: 'Friend',
      };
      await AsyncStorage.setItem(KEYS.USER_SETTINGS, JSON.stringify(defaultSettings));
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
};

// People
export const getPeople = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PEOPLE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting people:', error);
    return [];
  }
};

export const addPerson = async (personData) => {
  try {
    const people = await getPeople();
    const newPerson = {
      id: uuid(),
      ...personData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    people.push(newPerson);
    await AsyncStorage.setItem(KEYS.PEOPLE, JSON.stringify(people));
    return newPerson;
  } catch (error) {
    console.error('Error adding person:', error);
  }
};

export const updatePerson = async (personId, updates) => {
  try {
    const people = await getPeople();
    const index = people.findIndex(p => p.id === personId);
    if (index !== -1) {
      people[index] = {
        ...people[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(KEYS.PEOPLE, JSON.stringify(people));
      return people[index];
    }
  } catch (error) {
    console.error('Error updating person:', error);
  }
};

export const deletePerson = async (personId) => {
  try {
    const people = await getPeople();
    const filtered = people.filter(p => p.id !== personId);
    await AsyncStorage.setItem(KEYS.PEOPLE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting person:', error);
  }
};

export const movePerson = async (personId, toStatus) => {
  return updatePerson(personId, { status: toStatus });
};

// Log Entries
export const getLogEntries = async (personId = null) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.LOG_ENTRIES);
    const entries = data ? JSON.parse(data) : [];
    if (personId) {
      return entries.filter(e => e.personId === personId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting log entries:', error);
    return [];
  }
};

export const addLogEntry = async (personId, entryData) => {
  try {
    const entries = await getLogEntries();
    const newEntry = {
      id: uuid(),
      personId,
      ...entryData,
      createdAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    await AsyncStorage.setItem(KEYS.LOG_ENTRIES, JSON.stringify(entries));
    return newEntry;
  } catch (error) {
    console.error('Error adding log entry:', error);
  }
};

// Tasks
export const getTasks = async (status = null) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    const tasks = data ? JSON.parse(data) : [];
    if (status) {
      return tasks.filter(t => t.status === status).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const addTask = async (taskData) => {
  try {
    const tasks = await getTasks();
    const newTask = {
      id: uuid(),
      ...taskData,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  } catch (error) {
    console.error('Error adding task:', error);
  }
};

export const updateTask = async (taskId, updates) => {
  try {
    const tasks = await getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = {
        ...tasks[index],
        ...updates,
      };
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
      return tasks[index];
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const tasks = await getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

// User Settings
export const getUserSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_SETTINGS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting user settings:', error);
    return {};
  }
};

export const updateUserSettings = async (updates) => {
  try {
    const settings = await getUserSettings();
    const updated = { ...settings, ...updates };
    await AsyncStorage.setItem(KEYS.USER_SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error updating user settings:', error);
  }
};

// Urgency calculation
export const calculateUrgency = async (personId) => {
  try {
    const entries = await getLogEntries(personId);
    if (entries.length === 0) return 'urgent';

    const lastEntry = entries[0];
    const now = new Date();
    const lastDate = new Date(lastEntry.createdAt);
    const daysSinceContact = (now - lastDate) / (1000 * 60 * 60 * 24);

    if (daysSinceContact > 180) return 'urgent';
    if (daysSinceContact > 90) return 'warm';
    if (daysSinceContact > 30) return 'mid';
    return 'cool';
  } catch (error) {
    console.error('Error calculating urgency:', error);
    return 'mid';
  }
};

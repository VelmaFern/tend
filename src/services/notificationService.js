import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPeople } from './storageService';

// Initialize notification permissions
export const initializeNotifications = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
    }

    // Listen for notification responses
    Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

// Handle notification taps
const handleNotificationResponse = (response) => {
  const { notification } = response;
  const data = notification.request.content.data;

  // This will be handled by each screen that needs notification navigation
  console.log('Notification tapped:', data);
};

// Schedule a reminder for a person
export const schedulePersonReminder = async (personId, personName, reminderType = 'check-in') => {
  try {
    // Cancel existing reminders for this person
    await Notifications.cancelNotificationAsync(`remind_${personId}`);

    // Schedule new reminder
    const trigger = {
      seconds: 60 * 60 * 24 * 30, // 30 days default
      type: 'interval',
    };

    await Notifications.scheduleNotificationAsync({
      identifier: `remind_${personId}`,
      content: {
        title: 'Time to check in ✦',
        body: `Remember ${personName}?`,
        data: { personId, type: 'person-reminder' },
        sound: 'default',
      },
      trigger,
    });
  } catch (error) {
    console.error('Error scheduling person reminder:', error);
  }
};

// Schedule weekly circle check-in
export const scheduleWeeklyCheckIn = async () => {
  try {
    const people = await getPeople();
    const activePeople = people.filter(p => p.status === 'active');

    if (activePeople.length === 0) return;

    // Default Saturday afternoon
    const trigger = {
      weekday: 6, // Saturday
      hour: 14,
      minute: 0,
      type: 'weekly',
    };

    const names = activePeople.slice(0, 3).map(p => p.name).join(', ');
    const moreCount = activePeople.length > 3 ? ` and ${activePeople.length - 3} others` : '';

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_checkin',
      content: {
        title: 'Your Circle ✦',
        body: `Check in with ${names}${moreCount}?`,
        data: { type: 'weekly-checkin' },
        sound: 'default',
      },
      trigger,
    });
  } catch (error) {
    console.error('Error scheduling weekly check-in:', error);
  }
};

// Cancel all reminders
export const cancelAllReminders = async () => {
  try {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    for (const notif of notifications) {
      await Notifications.dismissNotificationAsync(notif.request.identifier);
    }
  } catch (error) {
    console.error('Error canceling reminders:', error);
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

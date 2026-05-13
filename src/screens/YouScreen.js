import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import Orb from '../components/Orb';
import { getUserSettings, updateUserSettings, getPeople } from '../services/storageService';

const YouScreen = () => {
  const [theme, setTheme] = useState('sunday');
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ circle: 0, kept: 0, logs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTonePicker, setShowTonePicker] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const colors = COLORS[theme];

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);

      const savedSettings = await getUserSettings();
      setSettings(savedSettings);

      const allPeople = await getPeople();
      setStats({
        circle: allPeople.filter(p => p.status === 'active').length,
        kept: allPeople.filter(p => p.status === 'kept').length,
        logs: 0, // Would need to calculate from log entries
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
    await updateUserSettings({ theme: newTheme });
    setShowThemePicker(false);
  };

  const handleToneChange = async (newTone) => {
    await updateUserSettings({ defaultTone: newTone });
    setSettings(prev => ({ ...prev, defaultTone: newTone }));
    setShowTonePicker(false);
  };

  if (isLoading || !settings) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Profile section */}
        <View style={styles.profileSection}>
          <Orb initial="A" size={70} urgency="warm" theme={theme} />
          <Text style={[styles.userName, { color: colors.text, fontFamily: FONTS.cormorant }]}>
            You
          </Text>
          <Text style={[styles.tendingSince, { color: colors.textLight }]}>
            Tending since {new Date(settings.tendingSince).toLocaleDateString()}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {stats.circle}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>In Circle</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {stats.kept}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Kept</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {stats.logs}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Moments</Text>
          </View>
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>

          <Pressable
            style={[styles.settingRow, { borderBottomColor: colors.accentLight }]}
            onPress={() => Alert.alert('Reminders', 'Enabled on all people')}
          >
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Your reminders</Text>
              <Text style={[styles.settingDescription, { color: colors.textLight }]}>
                Set on each person · always on
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#4ADE80' }]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.settingRow}
            onPress={() => setShowNotificationSettings(!showNotificationSettings)}
          >
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Weekly Circle check-in
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textLight }]}>
                {settings.weeklyCheckIn.enabled
                  ? `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][settings.weeklyCheckIn.dayOfWeek]} at ${settings.weeklyCheckIn.timeOfDay}`
                  : 'Off'}
              </Text>
            </View>
            <Text style={[styles.toggle, { color: colors.accent }]}>
              {settings.weeklyCheckIn.enabled ? '✓' : '◯'}
            </Text>
          </Pressable>

          {showNotificationSettings && (
            <NotificationSettingsPanel
              settings={settings}
              colors={colors}
              onSave={async (newSettings) => {
                await updateUserSettings({ weeklyCheckIn: newSettings });
                setSettings(prev => ({ ...prev, weeklyCheckIn: newSettings }));
                setShowNotificationSettings(false);
              }}
            />
          )}
        </View>

        {/* Appearance section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

          {showThemePicker ? (
            <View style={styles.themePicker}>
              {Object.entries(COLORS).map(([themeKey, themeColors]) => (
                <Pressable
                  key={themeKey}
                  onPress={() => handleThemeChange(themeKey)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themeColors.background,
                      borderColor: theme === themeKey ? colors.accent : themeColors.border,
                      borderWidth: theme === themeKey ? 2 : 1,
                    },
                  ]}
                >
                  {theme === themeKey && (
                    <Text style={[styles.themeCheck, { color: colors.accent }]}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              style={[styles.themePreview, { borderColor: colors.border }]}
              onPress={() => setShowThemePicker(true)}
            >
              <View
                style={[
                  styles.themeSwatch,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.accent,
                  },
                ]}
              />
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                {COLORS[theme].name}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tone section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Default Tone</Text>

          {showTonePicker ? (
            <View style={styles.tonePicker}>
              {['warm', 'gentle', 'light', 'unhinged', 'serious'].map(tone => (
                <Pressable
                  key={tone}
                  onPress={() => handleToneChange(tone)}
                  style={[
                    styles.toneOption,
                    {
                      backgroundColor:
                        settings.defaultTone === tone ? colors.accent : 'transparent',
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toneOptionText,
                      {
                        color:
                          settings.defaultTone === tone ? '#FFFFFF' : colors.text,
                      },
                    ]}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              style={[styles.tonePreview, { borderColor: colors.border }]}
              onPress={() => setShowTonePicker(true)}
            >
              <Text style={[styles.toneLabel, { color: colors.text }]}>
                {settings.defaultTone.charAt(0).toUpperCase() +
                  settings.defaultTone.slice(1)}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

          <Pressable style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Tend Plus
            </Text>
          </Pressable>
          <Pressable style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Privacy
            </Text>
          </Pressable>
          <Pressable style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Send Feedback
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const NotificationSettingsPanel = ({ settings, colors, onSave }) => {
  const [dayOfWeek, setDayOfWeek] = useState(settings.weeklyCheckIn.dayOfWeek);
  const [timeOfDay, setTimeOfDay] = useState(settings.weeklyCheckIn.timeOfDay);
  const [enabled, setEnabled] = useState(settings.weeklyCheckIn.enabled);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const times = ['morning', 'afternoon', 'evening'];

  return (
    <View style={[styles.notificationPanel, { backgroundColor: colors.accentLight + '20' }]}>
      <View style={styles.panelSection}>
        <Text style={[styles.panelLabel, { color: colors.text }]}>Day</Text>
        <View style={styles.daySelector}>
          {days.map((day, index) => (
            <Pressable
              key={day}
              onPress={() => setDayOfWeek(index)}
              style={[
                styles.dayButton,
                {
                  backgroundColor: dayOfWeek === index ? colors.accent : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  {
                    color: dayOfWeek === index ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {day}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panelSection}>
        <Text style={[styles.panelLabel, { color: colors.text }]}>Time</Text>
        <View style={styles.timeSelector}>
          {times.map(time => (
            <Pressable
              key={time}
              onPress={() => setTimeOfDay(time)}
              style={[
                styles.timeButton,
                {
                  backgroundColor: timeOfDay === time ? colors.accent : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  {
                    color: timeOfDay === time ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, { backgroundColor: colors.accent }]}
        onPress={() =>
          onSave({
            ...settings.weeklyCheckIn,
            enabled,
            dayOfWeek,
            timeOfDay,
          })
        }
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: '400',
    marginTop: 12,
  },
  tendingSince: {
    fontSize: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.dmSans,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: FONTS.dmSans,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontFamily: FONTS.dmSans,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.dmSans,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    fontSize: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  themePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCheck: {
    fontSize: 24,
  },
  themePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 12,
  },
  themeSwatch: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
  },
  themeLabel: {
    fontSize: 14,
    fontFamily: FONTS.dmSans,
  },
  tonePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toneOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toneOptionText: {
    fontSize: 13,
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
  },
  tonePreview: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  toneLabel: {
    fontSize: 14,
    fontFamily: FONTS.dmSans,
  },
  notificationPanel: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  panelSection: {
    marginBottom: 16,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayButton: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dayButtonText: {
    fontSize: 12,
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  timeButtonText: {
    fontSize: 12,
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
  },
});

export default YouScreen;

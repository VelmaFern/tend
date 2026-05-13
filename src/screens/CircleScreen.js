import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import Orb from '../components/Orb';
import VoiceLogModal from '../components/VoiceLogModal';
import {
  getPeople,
  addPerson,
  addLogEntry,
  calculateUrgency,
  deletePerson,
  movePerson,
  updatePerson,
} from '../services/storageService';
import PersonProfileBottomSheet from '../components/PersonProfileBottomSheet';

const { width, height } = Dimensions.get('window');

const CircleScreen = ({ navigation }) => {
  const [people, setPeople] = useState([]);
  const [theme, setTheme] = useState('sunday');
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

      const allPeople = await getPeople();
      const activePeople = allPeople.filter(p => p.status === 'active');

      // Calculate urgency for each person
      const withUrgency = await Promise.all(
        activePeople.map(async (person) => ({
          ...person,
          urgency: await calculateUrgency(person.id),
        }))
      );

      // Sort by urgency: urgent > warm > mid > cool
      const urgencyOrder = { urgent: 0, warm: 1, mid: 2, cool: 3 };
      const sorted = withUrgency.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      setPeople(sorted);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading circle:', error);
      setIsLoading(false);
    }
  };

  const handleVoiceLogSave = async (data) => {
    const { transcript, parsed } = data;

    // Check if person exists by name
    let personId = null;
    if (parsed.name) {
      const existing = people.find(p => p.name.toLowerCase() === parsed.name.toLowerCase());
      if (existing) {
        personId = existing.id;
      }
    }

    // If person doesn't exist, create them
    if (!personId) {
      if (!parsed.name) {
        Alert.alert('Who is this about?', 'Please mention their name in your log');
        return;
      }

      const newPerson = await addPerson({
        name: parsed.name,
        initial: parsed.name.charAt(0).toUpperCase(),
        reminderCadence: {
          type: 'months',
          interval: parsed.suggestedTiming === '1 month' ? 1 : 3,
        },
      });
      personId = newPerson.id;
    }

    // Add log entry
    await addLogEntry(personId, {
      transcript,
      context: parsed.context,
      suggestedTiming: parsed.suggestedTiming,
      category: parsed.category,
    });

    // Refresh data
    loadData();

    // Show confirmation
    const personName = parsed.name || 'Friend';
    Alert.alert('✦ Logged', `Your moment with ${personName} is saved.`);
  };

  const handleOrbLongPress = (person) => {
    setSelectedPerson(person);
    setMenuOpen(person.id);
  };

  const handleMoveToPerson = (status) => {
    if (!selectedPerson) return;

    movePerson(selectedPerson.id, status);
    setMenuOpen(null);
    setSelectedPerson(null);
    loadData();
  };

  const handleDeletePerson = () => {
    if (!selectedPerson) return;

    Alert.alert(
      'Remove from Circle?',
      `${selectedPerson.name} will be moved to Kept (your permanent record).`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Move to Kept',
          onPress: () => {
            movePerson(selectedPerson.id, 'kept');
            setMenuOpen(null);
            setSelectedPerson(null);
            loadData();
          },
        },
      ]
    );
  };

  if (isLoading) {
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

  // Position orbs in a spiral pattern
  const positionOrbs = (peopleList) => {
    return peopleList.map((person, index) => {
      const angle = (index / Math.max(peopleList.length, 1)) * Math.PI * 2;
      const distance = 80 + index * 15; // Spiral outward
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      return {
        person,
        x,
        y,
      };
    });
  };

  const positioned = positionOrbs(people);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Vignette background */}
      <View style={[styles.vignetteOverlay, { backgroundColor: colors.backgroundDark }]} />

      {/* Orbs canvas */}
      <ScrollView
        style={styles.canvas}
        contentContainerStyle={styles.canvasContent}
        scrollEnabled={false}
      >
        {people.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text, fontFamily: FONTS.cormorant }]}>
              Your circle is empty
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textLight, fontFamily: FONTS.cormorant }]}>
              Add the people you love by logging a moment with them
            </Text>
          </View>
        ) : (
          positioned.map(({ person, x, y }, index) => (
            <View
              key={person.id}
              style={[
                styles.orbWrapper,
                {
                  left: width / 2 - 40 + x,
                  top: height / 2 - 100 + y,
                },
              ]}
            >
              <Orb
                initial={person.initial}
                name={person.name}
                urgency={person.urgency}
                theme={theme}
                size={80}
                isPulsing={index === 0 && person.urgency === 'urgent'}
                onPress={() => {
                  setSelectedPerson(person);
                  setProfileSheetVisible(true);
                }}
                onLongPress={() => handleOrbLongPress(person)}
              />

              {/* Context menu */}
              {menuOpen === person.id && (
                <View style={[styles.contextMenu, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Pressable style={styles.menuItem} onPress={() => handleMoveToPerson('kept')}>
                    <Text style={[styles.menuText, { color: colors.text }]}>Move to Kept</Text>
                  </Pressable>
                  <Pressable style={styles.menuItem} onPress={handleDeletePerson}>
                    <Text style={[styles.menuText, { color: '#E85D5D' }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.background }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.orbUrgent }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>needs love</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.orbMid }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>soon</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.orbTended }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>tended</Text>
        </View>
      </View>

      {/* Voice FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setVoiceModalVisible(true)}
      >
        <Text style={styles.fabIcon}>♪</Text>
      </Pressable>

      {/* Modals */}
      <VoiceLogModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSave={handleVoiceLogSave}
        theme={theme}
        type="person"
      />

      <PersonProfileBottomSheet
        visible={profileSheetVisible}
        person={selectedPerson}
        onClose={() => {
          setProfileSheetVisible(false);
          setSelectedPerson(null);
        }}
        theme={theme}
        onUpdate={loadData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  vignetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    width: width * 2,
    height: height * 2,
    position: 'relative',
  },
  orbWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    position: 'absolute',
    top: 100,
    left: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 150,
    zIndex: 100,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontFamily: FONTS.dmSans,
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FONTS.dmSans,
    fontWeight: '400',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    fontWeight: '300',
  },
});

export default CircleScreen;

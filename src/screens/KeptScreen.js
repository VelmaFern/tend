import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import Orb from '../components/Orb';
import { getPeople, movePerson } from '../services/storageService';

const { width, height } = Dimensions.get('window');

const KeptScreen = () => {
  const [people, setPeople] = useState([]);
  const [theme, setTheme] = useState('sunday');
  const [viewMode, setViewMode] = useState('orb'); // 'orb' or 'list'
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);

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
      const keptPeople = allPeople.filter(p => p.status === 'kept');

      setPeople(keptPeople);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading kept people:', error);
      setIsLoading(false);
    }
  };

  const handleMoveToCircle = async (personId) => {
    await movePerson(personId, 'active');
    loadData();
    setSelectedSheet(null);
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

  if (viewMode === 'orb') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.cormorant }]}>
            Kept
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight, fontFamily: FONTS.cormorant }]}>
            every person you've tended — held safely
          </Text>

          {/* View toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[
                styles.toggleButton,
                {
                  backgroundColor: viewMode === 'orb' ? colors.accent : 'transparent',
                },
              ]}
              onPress={() => setViewMode('orb')}
            >
              <Text style={[styles.toggleText, { color: viewMode === 'orb' ? '#FFFFFF' : colors.text }]}>
                Orb View
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                {
                  backgroundColor: viewMode === 'list' ? colors.accent : 'transparent',
                },
              ]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, { color: viewMode === 'list' ? '#FFFFFF' : colors.text }]}>
                List View
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Orb canvas */}
        {people.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text, fontFamily: FONTS.cormorant }]}>
              No one kept yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textLight }]}>
              Move people here when you've tended them well
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.canvas}
            contentContainerStyle={styles.canvasContent}
            scrollEnabled={false}
          >
            {people.map((person, index) => {
              const angle = (index / Math.max(people.length, 1)) * Math.PI * 2;
              const distance = 60 + index * 10;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;

              return (
                <View
                  key={person.id}
                  style={[
                    styles.orbWrapper,
                    {
                      left: width / 2 - 40 + x,
                      top: height / 3 + y,
                    },
                  ]}
                >
                  <Orb
                    initial={person.initial}
                    name={person.name}
                    urgency="cool"
                    theme={theme}
                    size={70}
                    opacity={0.65}
                    onPress={() => setSelectedSheet(person.id)}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Bottom sheet */}
        {selectedSheet && (
          <BottomSheet
            person={people.find(p => p.id === selectedSheet)}
            colors={colors}
            onMoveToCircle={handleMoveToCircle}
            onClose={() => setSelectedSheet(null)}
            theme={theme}
          />
        )}
      </View>
    );
  }

  // List view
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.cormorant }]}>
          Kept
        </Text>

        {/* View toggle */}
        <View style={styles.viewToggle}>
          <Pressable
            style={[
              styles.toggleButton,
              {
                backgroundColor: viewMode === 'orb' ? colors.accent : 'transparent',
              },
            ]}
            onPress={() => setViewMode('orb')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'orb' ? '#FFFFFF' : colors.text }]}>
              Orb View
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              {
                backgroundColor: viewMode === 'list' ? colors.accent : 'transparent',
              },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'list' ? '#FFFFFF' : colors.text }]}>
              List View
            </Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      <ScrollView style={styles.listContainer}>
        {people.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No one kept yet
            </Text>
          </View>
        ) : (
          people.map((person) => (
            <Pressable
              key={person.id}
              style={[styles.listItem, { borderBottomColor: colors.accentLight }]}
              onPress={() => setSelectedSheet(person.id)}
            >
              <Orb initial={person.initial} size={40} urgency="cool" theme={theme} />
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemName, { color: colors.text }]}>
                  {person.name}
                </Text>
                <Text style={[styles.listItemDate, { color: colors.textLight }]}>
                  Tended recently
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Bottom sheet */}
      {selectedSheet && (
        <BottomSheet
          person={people.find(p => p.id === selectedSheet)}
          colors={colors}
          onMoveToCircle={handleMoveToCircle}
          onClose={() => setSelectedSheet(null)}
          theme={theme}
        />
      )}
    </View>
  );
};

const BottomSheet = ({ person, colors, onMoveToCircle, onClose, theme }) => {
  return (
    <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
      <Pressable onPress={onClose} style={styles.closeHandle} />

      <View style={styles.sheetContent}>
        <Orb initial={person.initial} size={60} urgency="cool" theme={theme} />
        <Text style={[styles.sheetName, { color: colors.text, fontFamily: FONTS.cormorant }]}>
          {person.name}
        </Text>
        <Text style={[styles.sheetDate, { color: colors.textLight }]}>
          Last tended: recently
        </Text>

        <Pressable
          style={[styles.sheetButton, { backgroundColor: colors.accent }]}
          onPress={() => onMoveToCircle(person.id)}
        >
          <Text style={styles.sheetButtonText}>Move to Circle</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '400',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    width: '100%',
    height: height * 0.6,
    position: 'relative',
  },
  orbWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '400',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
  },
  listItemDate: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 200,
  },
  closeHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetContent: {
    alignItems: 'center',
  },
  sheetName: {
    fontSize: 20,
    fontWeight: '400',
    marginTop: 12,
  },
  sheetDate: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  sheetButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
  },
});

export default KeptScreen;

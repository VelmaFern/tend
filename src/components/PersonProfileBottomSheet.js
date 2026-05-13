import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import Orb from './Orb';
import { getLogEntries, generateMessage } from '../services/anthropicService';
import { getLogEntries as getStoredLogEntries } from '../services/storageService';
import SuggestedMessageScreen from '../screens/SuggestedMessageScreen';

const PersonProfileBottomSheet = ({ visible, person, onClose, theme = 'sunday', onUpdate }) => {
  const colors = COLORS[theme];
  const [logEntries, setLogEntries] = useState([]);
  const [showMessageFlow, setShowMessageFlow] = useState(false);
  const [messageContext, setMessageContext] = useState('');

  useEffect(() => {
    if (visible && person) {
      loadLogEntries();
    }
  }, [visible, person]);

  const loadLogEntries = async () => {
    if (!person) return;
    const entries = await getStoredLogEntries(person.id);
    setLogEntries(entries);
  };

  const handleTextPress = () => {
    if (logEntries.length > 0) {
      setMessageContext(logEntries[0].context);
      setShowMessageFlow(true);
    } else {
      Alert.alert('No context yet', 'Log a moment with this person first');
    }
  };

  const handleCheckIn = async () => {
    // Mark as tended and show tending flow
    onClose();
    // Navigate to tending flow (handled in main flow)
  };

  if (!person) return null;

  if (showMessageFlow) {
    return (
      <SuggestedMessageScreen
        context={messageContext}
        personName={person.name}
        onBack={() => setShowMessageFlow(false)}
        theme={theme}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Orb initial={person.initial} size={60} urgency="warm" theme={theme} />
            <Text style={[styles.personName, { color: colors.text, fontFamily: FONTS.cormorant }]}>
              {person.name}
            </Text>
            <Text style={[styles.urgencyBadge, { color: colors.accent }]}>
              ✦ needs love
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={handleTextPress}
            >
              <Text style={styles.actionButtonText}>Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accent }]}
              onPress={() => {
                // Trigger phone call
                Alert.alert('Call', `Call ${person.name}`);
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accent }]}
              onPress={() => {
                setShowMessageFlow(true);
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Log</Text>
            </TouchableOpacity>
          </View>

          {/* Log history */}
          <ScrollView style={styles.logList}>
            <Text style={[styles.logTitle, { color: colors.text, fontFamily: FONTS.dmSans }]}>
              History
            </Text>
            {logEntries.length === 0 ? (
              <Text style={[styles.noLogs, { color: colors.textLight, fontFamily: FONTS.cormorant }]}>
                No moments logged yet
              </Text>
            ) : (
              logEntries.map((entry, index) => (
                <View key={entry.id} style={styles.logEntry}>
                  <View style={[styles.entryDot, { backgroundColor: colors.orbMid }]} />
                  <View style={styles.entryContent}>
                    <Text
                      style={[
                        styles.entryText,
                        { color: colors.text, fontFamily: FONTS.cormorant },
                      ]}
                    >
                      {entry.context}
                    </Text>
                    <Text style={[styles.entryDate, { color: colors.textLight }]}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {index < logEntries.length - 1 && (
                    <View style={[styles.entryLine, { backgroundColor: colors.accentLight }]} />
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeArea} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.textLight }]}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  personName: {
    fontSize: 24,
    fontWeight: '400',
    marginTop: 12,
  },
  urgencyBadge: {
    fontSize: 12,
    fontFamily: FONTS.dmSans,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
  },
  logList: {
    maxHeight: 300,
    marginBottom: 24,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  logEntry: {
    marginBottom: 16,
    position: 'relative',
  },
  entryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    left: 0,
    top: 4,
  },
  entryContent: {
    marginLeft: 24,
    paddingBottom: 16,
  },
  entryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  entryDate: {
    fontSize: 12,
    marginTop: 4,
  },
  entryLine: {
    position: 'absolute',
    left: 4,
    top: 12,
    width: 2,
    height: 16,
  },
  noLogs: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  closeArea: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    fontFamily: FONTS.dmSans,
  },
});

export default PersonProfileBottomSheet;

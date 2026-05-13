import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import { generateMessage } from '../services/anthropicService';

const TONES = ['warm', 'gentle', 'light', 'unhinged', 'serious'];
const TONE_LABELS = {
  warm: 'Warm',
  gentle: 'Gentle',
  light: 'Light',
  unhinged: 'Unhinged 💀',
  serious: 'Serious',
};

const SuggestedMessageScreen = ({ context, personName, onBack, theme = 'sunday' }) => {
  const colors = COLORS[theme];
  const [selectedTone, setSelectedTone] = useState('warm');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [affirmation, setAffirmation] = useState('They\'re lucky to have you thinking of them.');

  useEffect(() => {
    generateInitialMessage();
  }, []);

  const generateInitialMessage = async () => {
    setIsGenerating(true);
    const generated = await generateMessage(context, 'warm');
    setMessage(generated);
    setIsGenerating(false);
  };

  const handleToneChange = async (newTone) => {
    setSelectedTone(newTone);
    setIsGenerating(true);
    const generated = await generateMessage(context, newTone);
    setMessage(generated);
    setIsGenerating(false);
  };

  const handleSendMessage = async () => {
    const encodedMessage = encodeURIComponent(message);
    const url = `sms:?body=${encodedMessage}`;

    try {
      await Linking.openURL(url);
      Alert.alert('✦ Sent', `Your message to ${personName} is on its way.`);
      onBack();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEdit = () => {
    // Open edit modal (simplified for now)
    Alert.alert('Edit message', 'Swipe to edit', [
      { text: 'Done', onPress: () => {} },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={[styles.backButton, { color: colors.text }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Message</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Context section */}
        <View style={[styles.contextBox, { borderLeftColor: colors.accent }]}>
          <Text style={[styles.contextLabel, { color: colors.textLight }]}>Context</Text>
          <Text style={[styles.contextText, { color: colors.text, fontFamily: FONTS.cormorant }]}>
            {context}
          </Text>
        </View>

        {/* Affirmation */}
        <Text style={[styles.affirmation, { color: colors.accent, fontFamily: FONTS.cormorant }]}>
          {affirmation}
        </Text>

        {/* Tone selector */}
        <View style={styles.toneSelector}>
          {TONES.map((tone) => (
            <Pressable
              key={tone}
              onPress={() => handleToneChange(tone)}
              style={[
                styles.tonePill,
                {
                  backgroundColor: selectedTone === tone ? colors.accent : 'transparent',
                  borderColor: colors.accent,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.tonePillText,
                  {
                    color: selectedTone === tone ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {TONE_LABELS[tone]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Generated message */}
        <View style={[styles.messageBox, { backgroundColor: colors.accentLight + '20' }]}>
          {isGenerating ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text
              style={[
                styles.messageText,
                { color: colors.text, fontFamily: FONTS.dmSans },
              ]}
            >
              {message}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.sendButton, { backgroundColor: colors.accent, flex: 0.67 }]}
            onPress={handleSendMessage}
            disabled={isGenerating}
          >
            <Text style={styles.sendButtonText}>Send in Messages</Text>
          </Pressable>
          <Pressable
            style={[
              styles.editButton,
              {
                backgroundColor: colors.textLight,
                borderColor: colors.textLight,
                flex: 0.33,
              },
            ]}
            onPress={handleEdit}
          >
            <Text style={[styles.editButtonText, { color: colors.background }]}>Edit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 14,
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  contextBox: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginBottom: 20,
  },
  contextLabel: {
    fontSize: 12,
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contextText: {
    fontSize: 14,
    lineHeight: 20,
  },
  affirmation: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '300',
  },
  toneSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  tonePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tonePillText: {
    fontFamily: FONTS.dmSans,
    fontSize: 12,
    fontWeight: '500',
  },
  messageBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    minHeight: 100,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.dmSans,
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontFamily: FONTS.dmSans,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SuggestedMessageScreen;

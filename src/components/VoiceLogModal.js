import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import Orb from './Orb';
import { parseVoiceTranscript } from '../services/anthropicService';

const VoiceLogModal = ({ visible, onClose, onSave, type = 'person', theme = 'sunday' }) => {
  const colors = COLORS[theme];
  const insets = useSafeAreaInsets();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(0));

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.setValue(0);
  };

  useEffect(() => {
    if (visible && isRecording) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [isRecording, visible]);

  const handleStartRecording = async () => {
    setIsRecording(true);
    setTranscript('');
    // In a real implementation, you'd use expo-speech-recognition
    // For now, we'll simulate with a mock transcript
    setTimeout(() => {
      setTranscript('I ran into Sarah at the coffee shop today and we talked about her new job...');
    }, 2000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    try {
      // Parse transcript using Anthropic
      const parsed = await parseVoiceTranscript(transcript);

      // Call parent save handler
      onSave({
        transcript,
        parsed,
      });

      // Reset and close
      setTranscript('');
      onClose();
    } catch (error) {
      console.error('Error saving voice log:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const micScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(12, 14, 24, 0.95)' }]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          scrollEnabled={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mic orb */}
          <View style={styles.micContainer}>
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <Orb
                initial="♪"
                size={100}
                urgency="warm"
                theme={theme}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
              />
            </Animated.View>

            {/* Status text */}
            <Text style={[styles.statusText, { color: colors.text, marginTop: 16 }]}>
              {isRecording ? 'Listening...' : 'Tap to record'}
            </Text>
          </View>

          {/* Transcript */}
          {transcript && (
            <View style={[styles.transcriptBox, { borderLeftColor: colors.accent }]}>
              <Text style={[styles.transcriptText, { color: colors.text, fontFamily: FONTS.cormorant }]}>
                {transcript}
              </Text>
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.accent,
                opacity: transcript.trim() ? 1 : 0.5,
              },
            ]}
            onPress={handleSave}
            disabled={!transcript.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                Looks right — {type === 'person' ? 'save & remind me' : 'save'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    fontSize: 32,
    fontWeight: '300',
  },
  micContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  statusText: {
    fontSize: 16,
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
  },
  transcriptBox: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginVertical: 20,
    maxWidth: '100%',
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  saveButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.dmSans,
    fontWeight: '600',
  },
});

export default VoiceLogModal;

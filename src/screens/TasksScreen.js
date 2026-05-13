import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme/colors';
import Orb from '../components/Orb';
import VoiceLogModal from '../components/VoiceLogModal';
import { getTasks, addTask, updateTask, deleteTask } from '../services/storageService';
import { parseTaskTranscript } from '../services/anthropicService';

const { width, height } = Dimensions.get('window');

const CATEGORY_COLORS = {
  errand: { base: '#C4785A', light: '#E8A98A' },
  creative: { base: '#9B7FA0', light: '#C4A8CA' },
  'life admin': { base: '#7A9E8C', light: '#A8C9B5' },
  'self care': { base: '#D4A853', light: '#FFD89B' },
};

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [theme, setTheme] = useState('sunday');
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());

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

      const allTasks = await getTasks('active');
      setTasks(allTasks);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setIsLoading(false);
    }
  };

  const handleVoiceLogSave = async (data) => {
    const { transcript, parsed } = data;

    try {
      await addTask({
        text: parsed.text || transcript,
        category: parsed.category || 'life admin',
        suggestedTiming: parsed.suggestedTiming,
      });

      loadData();
      Alert.alert('✦ Task added', 'Keep going!');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletedTaskIds(prev => new Set([...prev, taskId]));

    setTimeout(async () => {
      await updateTask(taskId, { status: 'done', completedAt: new Date().toISOString() });
      loadData();

      Alert.alert('Done!', 'Want to keep this task or let it go?', [
        { text: 'Let it go', onPress: () => {} },
        {
          text: 'Save to Kept',
          onPress: () => {
            updateTask(taskId, { status: 'kept' });
            loadData();
          },
        },
      ]);
    }, 1500);
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

  const positionTasks = (taskList) => {
    return taskList.map((task, index) => {
      const angle = (index / Math.max(taskList.length, 1)) * Math.PI * 2;
      const distance = 80 + index * 15;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      return { task, x, y };
    });
  };

  const positioned = positionTasks(tasks);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Canvas */}
      <ScrollView
        style={styles.canvas}
        contentContainerStyle={styles.canvasContent}
        scrollEnabled={false}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text, fontFamily: FONTS.cormorant }]}>
              No tasks right now
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textLight }]}>
              Add tasks by logging moments
            </Text>
          </View>
        ) : (
          positioned.map(({ task, x, y }, index) => {
            const categoryColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS['life admin'];
            const isCompleted = completedTaskIds.has(task.id);

            return (
              <View
                key={task.id}
                style={[
                  styles.taskWrapper,
                  {
                    left: width / 2 - 40 + x,
                    top: height / 2 - 100 + y,
                  },
                ]}
              >
                <Pressable
                  onPress={() => handleCompleteTask(task.id)}
                  disabled={isCompleted}
                >
                  <Orb
                    initial={task.text.charAt(0).toUpperCase()}
                    name={task.text.substring(0, 12)}
                    taskCategory={task.category}
                    size={80}
                    urgency="warm"
                    theme={theme}
                    opacity={isCompleted ? 0.3 : 1}
                    showBadge={isCompleted}
                  />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Voice FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setVoiceModalVisible(true)}
      >
        <Text style={styles.fabIcon}>♪</Text>
      </Pressable>

      {/* Voice modal */}
      <VoiceLogModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSave={handleVoiceLogSave}
        theme={theme}
        type="task"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    width: width * 2,
    height: height * 2,
    position: 'relative',
  },
  taskWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default TasksScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/app-store';
import { JobLog } from '@/types/service';
import { PRODUCTION_CONFIG } from '@/utils/firebase-config';
import * as Icons from 'lucide-react-native';

interface WorkTimerProps {
  jobId: string;
  jobTitle: string;
  onWorkComplete: (jobId: string, workLog: JobLog) => void;
}

export function WorkTimer({ jobId, jobTitle, onWorkComplete }: WorkTimerProps) {
  const { getActiveJobTimer, addJobLog, updateJobLog, logEvent } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number>(0);

  const activeTimer = getActiveJobTimer(jobId);
  const isTimerActive = !!activeTimer && !isPaused;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  const formatDuration = (startTime: Date, endTime: Date = new Date(), pausedDuration: number = 0) => {
    const diffMs = endTime.getTime() - startTime.getTime() - pausedDuration;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!activeTimer) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - activeTimer.startTime.getTime() - pausedTime) / (1000 * 60));
  };

  const handleStartTimer = () => {
    // Production validation
    if (PRODUCTION_CONFIG.requireWorkTimer) {
      logEvent('work_timer_started', { 
        jobId, 
        mechanicId: 'mechanic-cody',
        timestamp: new Date().toISOString()
      });
    }

    const newLog: JobLog = {
      id: `${jobId}-${Date.now()}`,
      jobId,
      mechanicId: 'mechanic-cody', // Production: Cody only
      mechanicName: 'Cody Owner', // Production: Cody only
      startTime: new Date(),
      createdAt: new Date(),
    };

    addJobLog(newLog);
    setIsPaused(false);
    setPausedTime(0);
    Alert.alert('Timer Started', 'Work timer has been started for this job.');
  };

  const handlePauseTimer = () => {
    if (!activeTimer) return;
    
    setPauseStartTime(Date.now());
    setIsPaused(true);
    logEvent('work_timer_paused', { 
      jobId, 
      mechanicId: 'mechanic-cody',
      duration: getTotalDuration()
    });
    Alert.alert('Timer Paused', 'Work timer has been paused. Press resume to continue.');
  };

  const handleResumeTimer = () => {
    if (!activeTimer) return;
    
    // Accumulate pause time
    if (pauseStartTime > 0) {
      const pauseDuration = Date.now() - pauseStartTime;
      setPausedTime(prev => prev + pauseDuration);
      setPauseStartTime(0);
    }
    
    setIsPaused(false);
    logEvent('work_timer_resumed', { 
      jobId, 
      mechanicId: 'mechanic-cody',
      duration: getTotalDuration()
    });
    Alert.alert('Timer Resumed', 'Work timer has been resumed.');
  };

  const handleStopTimer = () => {
    if (!activeTimer) return;

    const duration = getTotalDuration();
    
    // Production validation: Minimum work time
    if (PRODUCTION_CONFIG.strictValidation && duration < 5) {
      Alert.alert(
        'Minimum Work Time',
        'Work timer must run for at least 5 minutes to ensure accurate labor tracking.',
        [{ text: 'Continue Working' }]
      );
      return;
    }

    Alert.alert(
      'Stop Timer',
      `Stop work timer? Total time: ${duration} minutes`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Timer',
          style: 'destructive',
          onPress: () => {
            const endTime = new Date();
            
            const updatedLog: Partial<JobLog> = {
              endTime,
              duration,
              description: notes.trim() || undefined,
            };

            updateJobLog(activeTimer.id, updatedLog);
            
            const completedLog: JobLog = {
              ...activeTimer,
              ...updatedLog,
            } as JobLog;

            logEvent('work_timer_stopped', { 
              jobId, 
              mechanicId: 'mechanic-cody',
              duration,
              totalTime: duration
            });

            onWorkComplete(jobId, completedLog);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Timer size={24} color={Colors.mechanic} />
        <Text style={styles.title}>Work Timer</Text>
        {PRODUCTION_CONFIG.requireWorkTimer && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>REQUIRED</Text>
          </View>
        )}
      </View>

      <View style={styles.jobInfo}>
        <Text style={styles.jobTitle}>{jobTitle}</Text>
        <Text style={styles.jobId}>Job ID: {jobId}</Text>
        <Text style={styles.mechanicInfo}>Mechanic: Cody Owner</Text>
      </View>

      {/* Timer Display */}
      <View style={[styles.timerDisplay, isPaused && styles.pausedTimerDisplay]}>
        {activeTimer ? (
          <>
            <Text style={styles.timerLabel}>
              {isPaused ? 'Paused' : 'Time Elapsed'}
            </Text>
            <Text style={[styles.timerValue, isPaused && styles.pausedTimerValue]}>
              {formatDuration(activeTimer.startTime, currentTime, pausedTime)}
            </Text>
            <Text style={styles.startedAt}>
              Started at {activeTimer.startTime.toLocaleTimeString()}
              {isPaused && ' • Timer Paused'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.timerLabel}>Ready to Start</Text>
            <Text style={styles.timerValue}>0:00</Text>
            <Text style={styles.readyText}>
              {PRODUCTION_CONFIG.requireWorkTimer 
                ? 'Work timer is required to complete this job'
                : 'Press start to begin timing work'
              }
            </Text>
          </>
        )}
      </View>

      {/* Timer Controls */}
      <View style={styles.controls}>
        {!activeTimer ? (
          <Button
            title="Start Work Timer"
            onPress={handleStartTimer}
            style={styles.startButton}
          />
        ) : (
          <View style={styles.activeControls}>
            {isPaused ? (
              <Button
                title="Resume"
                onPress={handleResumeTimer}
                style={styles.resumeButton}
              />
            ) : (
              <Button
                title="Pause"
                variant="outline"
                onPress={handlePauseTimer}
                style={styles.pauseButton}
              />
            )}
            <Button
              title="Stop Timer"
              onPress={handleStopTimer}
              style={styles.stopButton}
            />
          </View>
        )}
      </View>

      {/* Work Notes */}
      {activeTimer && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Work Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about the work performed..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Time Summary */}
      {activeTimer && (
        <View style={styles.timeSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Duration:</Text>
            <Text style={styles.summaryValue}>{getTotalDuration()} minutes</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status:</Text>
            <Text style={[styles.summaryValue, { color: isPaused ? Colors.warning : Colors.success }]}>
              {isPaused ? 'Paused' : 'Active'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mechanic:</Text>
            <Text style={styles.summaryValue}>Cody Owner</Text>
          </View>
        </View>
      )}

      {/* Production Requirements */}
      {PRODUCTION_CONFIG.requireWorkTimer && (
        <View style={styles.requirementsCard}>
          <Icons.AlertCircle size={16} color={Colors.warning} />
          <Text style={styles.requirementsText}>
            Work timer is required for job completion and accurate labor billing.
            {activeTimer ? ' Timer is running.' : ' Please start timer before beginning work.'}
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.instructionsText}>
          {!activeTimer 
            ? 'Start the timer when you begin working on this job. This helps track labor time accurately for billing.'
            : isPaused
            ? 'Timer is paused. Resume when you continue working or stop to complete the job.'
            : 'Timer is running. You can pause if needed or stop when work is complete to proceed to customer signature.'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requiredText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  jobInfo: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  jobId: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  mechanicInfo: {
    fontSize: 14,
    color: Colors.mechanic,
    fontWeight: '500',
  },
  timerDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 32,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.success + '30',
  },
  pausedTimerDisplay: {
    borderColor: Colors.warning + '30',
    backgroundColor: Colors.warning + '10',
  },
  timerLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.mechanic,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  pausedTimerValue: {
    color: Colors.warning,
  },
  startedAt: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  readyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  controls: {
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: Colors.mechanic,
    paddingVertical: 16,
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    flex: 1,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: Colors.success,
  },
  stopButton: {
    flex: 2,
    backgroundColor: Colors.error,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
  },
  timeSummary: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  requirementsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warning + '10',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warning,
    lineHeight: 16,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { SERVICE_CATEGORIES, SERVICE_TOOLS } from '@/constants/services';
import { ServiceRequest } from '@/types/service';
import { ChatComponent } from '@/components/ChatComponent';
import { WorkTimer } from '@/components/WorkTimer';
import { SignatureCapture } from '@/components/SignatureCapture';
import * as Icons from 'lucide-react-native';

export default function MechanicJobsScreen() {
  const { 
    serviceRequests, 
    updateServiceRequest, 
    addJobLog, 
    getJobLogs, 
    getActiveJobTimer,
    updateJobTools,
    completeToolsCheck,
    getJobToolsStatus,
    logEvent
  } = useAppStore();
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [selectedRequestForChat, setSelectedRequestForChat] = useState<string | null>(null);
  const [selectedRequestForTimer, setSelectedRequestForTimer] = useState<string | null>(null);
  const [selectedRequestForSignature, setSelectedRequestForSignature] = useState<string | null>(null);
  const [selectedRequestForTools, setSelectedRequestForTools] = useState<string | null>(null);

  // Production: Filter jobs for Cody only
  const mechanicId = 'mechanic-cody';
  const mechanicJobs = serviceRequests.filter(job => {
    // In production, only show jobs assigned to Cody or unassigned jobs
    return !job.assignedMechanicId || job.assignedMechanicId === mechanicId;
  });

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === type)?.title || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'quoted': return Colors.primary;
      case 'accepted': return Colors.success;
      case 'in_progress': return Colors.mechanic;
      case 'completed': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const filteredJobs = mechanicJobs.filter(job => {
    switch (selectedTab) {
      case 'pending':
        return job.status === 'pending' || job.status === 'quoted';
      case 'active':
        return job.status === 'accepted' || job.status === 'in_progress';
      case 'completed':
        return job.status === 'completed';
      default:
        return false;
    }
  });

  const handleClaimJob = (jobId: string) => {
    Alert.alert(
      'Claim Job',
      'Do you want to claim this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: () => {
            logEvent('job_claimed', { jobId, mechanicId });
            
            // Set up required tools for this job
            const job = serviceRequests.find(j => j.id === jobId);
            if (job) {
              const serviceCategory = SERVICE_CATEGORIES.find(s => s.id === job.type);
              const requiredTools = serviceCategory?.requiredTools.map(tool => tool.id) || [];
              
              updateServiceRequest(jobId, { 
                status: 'in_progress',
                assignedMechanicId: mechanicId,
                claimedAt: new Date(),
                requiredTools
              });
            }
            
            Alert.alert('Job Claimed', 'You have successfully claimed this job. Check your tools before starting work.');
          }
        }
      ]
    );
  };

  const handleCompleteJob = (jobId: string) => {
    const jobLogs = getJobLogs(jobId);
    const activeTimer = getActiveJobTimer(jobId);
    const job = serviceRequests.find(j => j.id === jobId);
    const toolsStatus = getJobToolsStatus(jobId);
    
    // Check if there are work logs
    if (jobLogs.length === 0) {
      Alert.alert(
        'Work Timer Required',
        'Please log work time using the timer before completing this job.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if timer is still running
    if (activeTimer) {
      Alert.alert(
        'Timer Still Running',
        'Please stop the work timer before completing this job.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if signature is required and present
    if (!job?.signatureData) {
      Alert.alert(
        'Signature Required',
        'Customer signature is required to complete this job.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Signature', onPress: () => setSelectedRequestForSignature(jobId) }
        ]
      );
      return;
    }

    // Check if tools check is completed
    if (!job?.toolsCheckCompletedAt) {
      Alert.alert(
        'Tools Check Required',
        'Please complete the tools check before finishing this job.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Tools', onPress: () => setSelectedRequestForTools(jobId) }
        ]
      );
      return;
    }

    // All requirements met, complete the job
    Alert.alert(
      'Complete Job',
      'Mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            logEvent('job_completed', { 
              jobId, 
              mechanicId, 
              totalWorkTime: jobLogs.reduce((total, log) => {
                if (log.endTime) {
                  return total + (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60);
                }
                return total;
              }, 0)
            });
            
            updateServiceRequest(jobId, { 
              status: 'completed',
              completedAt: new Date(),
              completedBy: mechanicId
            });
            Alert.alert('Job Completed', 'Job has been marked as completed.');
          }
        }
      ]
    );
  };

  const handleWorkComplete = (jobId: string, workLog: any) => {
    logEvent('work_timer_stopped', { 
      jobId, 
      mechanicId, 
      duration: workLog.endTime ? (workLog.endTime.getTime() - workLog.startTime.getTime()) / (1000 * 60) : 0
    });
    
    addJobLog(workLog);
    setSelectedRequestForTimer(null);
    
    // Check if signature is still needed
    const job = serviceRequests.find(j => j.id === jobId);
    if (!job?.signatureData) {
      Alert.alert(
        'Work Logged',
        'Work time has been logged. Customer signature is required to complete the job.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Get Signature', onPress: () => setSelectedRequestForSignature(jobId) }
        ]
      );
    } else {
      Alert.alert('Work Logged', 'Work time has been logged successfully.');
    }
  };

  const handleSignatureComplete = (jobId: string, signatureData: string) => {
    logEvent('signature_captured', { jobId, mechanicId });
    
    updateServiceRequest(jobId, { 
      signatureData,
      signatureCapturedAt: new Date(),
      signatureCapturedBy: mechanicId
    });
    setSelectedRequestForSignature(null);
    
    // Check if we can auto-complete the job
    const jobLogs = getJobLogs(jobId);
    const job = serviceRequests.find(j => j.id === jobId);
    if (jobLogs.length > 0 && job?.toolsCheckCompletedAt) {
      Alert.alert(
        'Signature Captured',
        'Customer signature has been captured. Complete the job now?',
        [
          { text: 'Later', style: 'cancel' },
          { 
            text: 'Complete Job', 
            onPress: () => {
              updateServiceRequest(jobId, { 
                status: 'completed',
                completedAt: new Date(),
                completedBy: mechanicId
              });
              Alert.alert('Job Completed', 'Job has been completed successfully.');
            }
          }
        ]
      );
    } else {
      Alert.alert('Signature Captured', 'Customer signature has been captured.');
    }
  };

  const openChat = (requestId: string) => {
    logEvent('chat_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForChat(requestId);
  };

  const openTimer = (requestId: string) => {
    logEvent('work_timer_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForTimer(requestId);
  };

  const openToolsCheck = (requestId: string) => {
    logEvent('tools_check_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForTools(requestId);
  };

  // Chat View
  if (selectedRequestForChat) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForChat(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>Customer Chat</Text>
        </View>
        <ChatComponent
          serviceRequestId={selectedRequestForChat}
          currentUserId={mechanicId}
          currentUserName="Cody Owner"
          currentUserType="mechanic"
        />
      </View>
    );
  }

  // Work Timer View
  if (selectedRequestForTimer) {
    const job = serviceRequests.find(j => j.id === selectedRequestForTimer);
    return (
      <View style={styles.container}>
        <View style={styles.timerHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForTimer(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.timerHeaderTitle}>Work Timer</Text>
        </View>
        <WorkTimer
          jobId={selectedRequestForTimer}
          jobTitle={job ? getServiceTitle(job.type) : 'Service'}
          onWorkComplete={handleWorkComplete}
        />
      </View>
    );
  }

  // Signature Capture View
  if (selectedRequestForSignature) {
    const job = serviceRequests.find(j => j.id === selectedRequestForSignature);
    return (
      <View style={styles.container}>
        <View style={styles.signatureHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForSignature(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.signatureHeaderTitle}>Customer Signature</Text>
        </View>
        <SignatureCapture
          jobId={selectedRequestForSignature}
          jobTitle={job ? getServiceTitle(job.type) : 'Service'}
          onSignatureComplete={handleSignatureComplete}
          onCancel={() => setSelectedRequestForSignature(null)}
        />
      </View>
    );
  }

  // Tools Check View
  if (selectedRequestForTools) {
    const job = serviceRequests.find(j => j.id === selectedRequestForTools);
    const serviceCategory = SERVICE_CATEGORIES.find(s => s.id === job?.type);
    const requiredTools = serviceCategory?.requiredTools || [];
    
    return (
      <View style={styles.container}>
        <View style={styles.toolsHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForTools(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.toolsHeaderTitle}>Tools Check</Text>
        </View>
        
        <ScrollView style={styles.toolsContent}>
          <View style={styles.toolsSection}>
            <Text style={styles.toolsSectionTitle}>
              Required Tools for {getServiceTitle(job?.type || '')}
            </Text>
            
            {requiredTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.toolItem,
                  job?.toolsChecked?.[tool.id] && styles.toolItemChecked
                ]}
                onPress={() => {
                  const currentChecked = job?.toolsChecked || {};
                  const newChecked = {
                    ...currentChecked,
                    [tool.id]: !currentChecked[tool.id]
                  };
                  updateJobTools(selectedRequestForTools, newChecked);
                }}
              >
                <View style={styles.toolItemLeft}>
                  <View style={[
                    styles.toolCheckbox,
                    job?.toolsChecked?.[tool.id] && styles.toolCheckboxChecked
                  ]}>
                    {job?.toolsChecked?.[tool.id] && (
                      <Icons.Check size={16} color={Colors.white} />
                    )}
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    {tool.description && (
                      <Text style={styles.toolDescription}>{tool.description}</Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.toolBadge,
                  { backgroundColor: tool.required ? Colors.error + '20' : Colors.textMuted + '20' }
                ]}>
                  <Text style={[
                    styles.toolBadgeText,
                    { color: tool.required ? Colors.error : Colors.textMuted }
                  ]}>
                    {tool.required ? 'Required' : 'Optional'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[
              styles.completeToolsButton,
              !requiredTools.every(tool => tool.required ? job?.toolsChecked?.[tool.id] : true) && styles.disabledButton
            ]}
            onPress={() => {
              const allRequiredChecked = requiredTools.every(tool => 
                tool.required ? job?.toolsChecked?.[tool.id] : true
              );
              
              if (!allRequiredChecked) {
                Alert.alert('Missing Tools', 'Please check all required tools before proceeding.');
                return;
              }
              
              completeToolsCheck(selectedRequestForTools);
              setSelectedRequestForTools(null);
              Alert.alert('Tools Check Complete', 'All required tools have been verified.');
            }}
            disabled={!requiredTools.every(tool => tool.required ? job?.toolsChecked?.[tool.id] : true)}
          >
            <Text style={[
              styles.completeToolsButtonText,
              !requiredTools.every(tool => tool.required ? job?.toolsChecked?.[tool.id] : true) && styles.disabledButtonText
            ]}>
              Complete Tools Check
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mechanic Info Header */}
      <View style={styles.mechanicHeader}>
        <Text style={styles.mechanicName}>
          Cody Owner - Mobile Mechanic
        </Text>
        <Text style={styles.mechanicSubtext}>
          Production Environment - Cody Only Access
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'pending', label: 'Pending', count: mechanicJobs.filter(j => j.status === 'pending' || j.status === 'quoted').length },
          { key: 'active', label: 'Active', count: mechanicJobs.filter(j => j.status === 'accepted' || j.status === 'in_progress').length },
          { key: 'completed', label: 'Completed', count: mechanicJobs.filter(j => j.status === 'completed').length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jobs List */}
      <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icons.Briefcase size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {selectedTab} jobs</Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' && 'New job requests will appear here'}
              {selectedTab === 'active' && 'Jobs you are working on will appear here'}
              {selectedTab === 'completed' && 'Completed jobs will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClaimJob={handleClaimJob}
                onCompleteJob={handleCompleteJob}
                onOpenChat={openChat}
                onOpenTimer={openTimer}
                onOpenToolsCheck={openToolsCheck}
                getServiceTitle={getServiceTitle}
                getStatusColor={getStatusColor}
                getJobLogs={getJobLogs}
                getActiveJobTimer={getActiveJobTimer}
                getJobToolsStatus={getJobToolsStatus}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface JobCardProps {
  job: ServiceRequest;
  onClaimJob: (jobId: string) => void;
  onCompleteJob: (jobId: string) => void;
  onOpenChat: (jobId: string) => void;
  onOpenTimer: (jobId: string) => void;
  onOpenToolsCheck: (jobId: string) => void;
  getServiceTitle: (type: string) => string;
  getStatusColor: (status: string) => string;
  getJobLogs: (jobId: string) => any[];
  getActiveJobTimer: (jobId: string) => any;
  getJobToolsStatus: (jobId: string) => { total: number; checked: number; allRequired: boolean };
}

function JobCard({ 
  job, 
  onClaimJob, 
  onCompleteJob, 
  onOpenChat, 
  onOpenTimer, 
  onOpenToolsCheck,
  getServiceTitle, 
  getStatusColor,
  getJobLogs,
  getActiveJobTimer,
  getJobToolsStatus
}: JobCardProps) {
  const jobLogs = getJobLogs(job.id);
  const activeTimer = getActiveJobTimer(job.id);
  const toolsStatus = getJobToolsStatus(job.id);
  const hasWorkLogs = jobLogs.length > 0;
  const hasSignature = !!job.signatureData;
  const hasToolsCheck = !!job.toolsCheckCompletedAt;
  const canComplete = hasWorkLogs && hasSignature && hasToolsCheck && !activeTimer;

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobTitle}>{getServiceTitle(job.type)}</Text>
          {job.urgency === 'emergency' && (
            <Icons.AlertTriangle size={16} color={Colors.error} />
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
            {job.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {job.description}
      </Text>

      {/* AI Diagnosis Preview */}
      {job.aiDiagnosis && (
        <View style={styles.aiDiagnosisPreview}>
          <Icons.Brain size={14} color={Colors.primary} />
          <Text style={styles.aiDiagnosisText}>
            AI suggests: {job.aiDiagnosis.likelyCauses[0]}
          </Text>
        </View>
      )}

      {/* Job Progress Indicators */}
      {(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed') && (
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Job Progress</Text>
          <View style={styles.progressIndicators}>
            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasToolsCheck ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasToolsCheck ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.Wrench size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasToolsCheck ? Colors.success : Colors.textMuted }
              ]}>
                Tools ({toolsStatus.checked}/{toolsStatus.total})
              </Text>
            </View>

            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasWorkLogs ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasWorkLogs ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.Clock size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasWorkLogs ? Colors.success : Colors.textMuted }
              ]}>
                Work Logged
              </Text>
              {activeTimer && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasSignature ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasSignature ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.PenTool size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasSignature ? Colors.success : Colors.textMuted }
              ]}>
                Signature
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Job Details */}
      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Icons.Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>
            {new Date(job.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        {job.location && (
          <View style={styles.detailRow}>
            <Icons.MapPin size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {job.location.address || 'Location provided'}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Icons.Clock size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>
            Urgency: {job.urgency}
          </Text>
        </View>

        {/* Work Time Summary */}
        {hasWorkLogs && (
          <View style={styles.detailRow}>
            <Icons.Timer size={14} color={Colors.mechanic} />
            <Text style={styles.detailText}>
              Total time: {Math.round(jobLogs.reduce((total, log) => {
                if (log.endTime) {
                  return total + (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60);
                }
                return total;
              }, 0))} minutes
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.jobActions}>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => onOpenChat(job.id)}
        >
          <Icons.MessageCircle size={16} color={Colors.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        {job.status === 'pending' || job.status === 'quoted' ? (
          <TouchableOpacity 
            style={styles.claimButton}
            onPress={() => onClaimJob(job.id)}
          >
            <Text style={styles.claimButtonText}>Claim Job</Text>
          </TouchableOpacity>
        ) : job.status === 'accepted' || job.status === 'in_progress' ? (
          <>
            {!hasToolsCheck && (
              <TouchableOpacity 
                style={styles.toolsButton}
                onPress={() => onOpenToolsCheck(job.id)}
              >
                <Icons.Wrench size={16} color={Colors.mechanic} />
                <Text style={styles.toolsButtonText}>Tools</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.timerButton,
                activeTimer && styles.activeTimerButton
              ]}
              onPress={() => onOpenTimer(job.id)}
            >
              <Icons.Timer size={16} color={activeTimer ? Colors.white : Colors.mechanic} />
              <Text style={[
                styles.timerButtonText,
                activeTimer && styles.activeTimerButtonText
              ]}>
                {activeTimer ? 'Timer Active' : 'Timer'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.completeButton,
                !canComplete && styles.disabledButton
              ]}
              onPress={() => onCompleteJob(job.id)}
              disabled={!canComplete}
            >
              <Text style={[
                styles.completeButtonText,
                !canComplete && styles.disabledButtonText
              ]}>
                Complete
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Completion Requirements */}
      {(job.status === 'accepted' || job.status === 'in_progress') && !canComplete && (
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>To complete this job:</Text>
          <View style={styles.requirements}>
            {!hasToolsCheck && (
              <Text style={styles.requirementText}>• Complete tools check</Text>
            )}
            {!hasWorkLogs && (
              <Text style={styles.requirementText}>• Log work time using timer</Text>
            )}
            {!hasSignature && (
              <Text style={styles.requirementText}>• Get customer signature</Text>
            )}
            {activeTimer && (
              <Text style={styles.requirementText}>• Stop active timer</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mechanicHeader: {
    backgroundColor: Colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  mechanicSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.mechanic,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.mechanic,
    fontWeight: '600',
  },
  jobsList: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  timerHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  signatureHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  toolsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  toolsContent: {
    flex: 1,
    padding: 16,
  },
  toolsSection: {
    marginBottom: 24,
  },
  toolsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolItemChecked: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  toolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolCheckboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  completeToolsButton: {
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeToolsButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  aiDiagnosisPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  aiDiagnosisText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 16,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressIcon: {
    padding: 4,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeIndicator: {
    backgroundColor: Colors.mechanic,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  activeText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: '600',
  },
  jobDetails: {
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  chatButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  toolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toolsButtonText: {
    color: Colors.mechanic,
    fontSize: 12,
    fontWeight: '600',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeTimerButton: {
    backgroundColor: Colors.mechanic,
    borderColor: Colors.mechanic,
  },
  timerButtonText: {
    color: Colors.mechanic,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTimerButtonText: {
    color: Colors.white,
  },
  claimButton: {
    flex: 1,
    backgroundColor: Colors.mechanic,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  claimButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: Colors.textMuted,
  },
  disabledButtonText: {
    color: Colors.white,
    opacity: 0.7,
  },
  requirementsSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: Colors.warning + '10',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 4,
  },
  requirements: {
    gap: 2,
  },
  requirementText: {
    fontSize: 10,
    color: Colors.warning,
  },
});
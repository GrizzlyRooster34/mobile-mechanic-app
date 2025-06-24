import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Tool, ServiceCategory } from '@/src/types';
import * as Icons from 'lucide-react-native';

interface ToolsEquipmentSettingsProps {
  initialTools?: Tool[];
  onSave: (tools: Tool[]) => Promise<void>;
  onCancel?: () => void;
}

const SERVICE_CATEGORIES: Array<{ key: ServiceCategory; label: string; icon: string }> = [
  { key: 'oil_change', label: 'Oil Change', icon: 'droplet' },
  { key: 'brake_repair', label: 'Brake Repair', icon: 'disc' },
  { key: 'tire_service', label: 'Tire Service', icon: 'circle' },
  { key: 'battery_service', label: 'Battery Service', icon: 'battery' },
  { key: 'engine_diagnostics', label: 'Engine Diagnostics', icon: 'cpu' },
  { key: 'transmission', label: 'Transmission', icon: 'settings' },
  { key: 'electrical', label: 'Electrical', icon: 'zap' },
  { key: 'cooling_system', label: 'Cooling System', icon: 'thermometer' },
  { key: 'suspension', label: 'Suspension', icon: 'move' },
  { key: 'exhaust', label: 'Exhaust', icon: 'wind' },
  { key: 'general_maintenance', label: 'General Maintenance', icon: 'wrench' },
];

const DEFAULT_TOOLS: Tool[] = [
  {
    id: '1',
    name: 'Socket Set (SAE)',
    category: 'general_maintenance',
    condition: 'excellent',
    available: true,
    notes: 'Complete 1/4", 3/8", 1/2" drive set',
  },
  {
    id: '2',
    name: 'Socket Set (Metric)',
    category: 'general_maintenance',
    condition: 'excellent',
    available: true,
    notes: 'Complete metric socket set',
  },
  {
    id: '3',
    name: 'Oil Drain Pan',
    category: 'oil_change',
    condition: 'good',
    available: true,
  },
  {
    id: '4',
    name: 'Oil Filter Wrench',
    category: 'oil_change',
    condition: 'excellent',
    available: true,
  },
  {
    id: '5',
    name: 'Brake Caliper Tool',
    category: 'brake_repair',
    condition: 'good',
    available: true,
  },
  {
    id: '6',
    name: 'Tire Iron',
    category: 'tire_service',
    condition: 'excellent',
    available: true,
  },
  {
    id: '7',
    name: 'Multimeter',
    category: 'electrical',
    condition: 'excellent',
    available: true,
    notes: 'Digital multimeter with auto-ranging',
  },
  {
    id: '8',
    name: 'OBD2 Scanner',
    category: 'engine_diagnostics',
    condition: 'excellent',
    available: true,
    notes: 'Professional grade scanner',
  },
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: Colors.success },
  { value: 'good', label: 'Good', color: Colors.primary },
  { value: 'fair', label: 'Fair', color: Colors.warning },
  { value: 'needs_replacement', label: 'Needs Replacement', color: Colors.error },
] as const;

export function ToolsEquipmentSettings({
  initialTools,
  onSave,
  onCancel,
}: ToolsEquipmentSettingsProps) {
  const [tools, setTools] = useState<Tool[]>(initialTools || DEFAULT_TOOLS);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getToolsByCategory = (category: ServiceCategory) => 
    tools.filter(tool => tool.category === category);

  const getConditionColor = (condition: Tool['condition']) => {
    const option = CONDITION_OPTIONS.find(opt => opt.value === condition);
    return option?.color || Colors.textSecondary;
  };

  const updateTool = (toolId: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(tool => 
      tool.id === toolId ? { ...tool, ...updates } : tool
    ));
  };

  const deleteTool = (toolId: string) => {
    Alert.alert(
      'Delete Tool',
      'Are you sure you want to remove this tool from your inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setTools(prev => prev.filter(tool => tool.id !== toolId)),
        },
      ]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(tools);
      Alert.alert('Success', 'Tools and equipment settings saved successfully');
    } catch (error) {
      console.error('Error saving tools:', error);
      Alert.alert('Error', 'Failed to save tools settings');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryTab = (category: ServiceCategory | 'all', label: string) => {
    const isSelected = selectedCategory === category;
    const toolCount = category === 'all' ? tools.length : getToolsByCategory(category).length;
    
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[
          styles.categoryTabText,
          isSelected && styles.categoryTabTextActive
        ]}>
          {label}
        </Text>
        <View style={[styles.categoryBadge, isSelected && styles.categoryBadgeActive]}>
          <Text style={[
            styles.categoryBadgeText,
            isSelected && styles.categoryBadgeTextActive
          ]}>
            {toolCount}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderToolCard = (tool: Tool) => (
    <View key={tool.id} style={styles.toolCard}>
      <View style={styles.toolHeader}>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{tool.name}</Text>
          <Text style={styles.toolCategory}>
            {SERVICE_CATEGORIES.find(cat => cat.key === tool.category)?.label}
          </Text>
        </View>
        <View style={styles.toolActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingTool(tool)}
          >
            <Icons.Edit2 size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteTool(tool.id)}
          >
            <Icons.Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toolDetails}>
        <View style={styles.toolStatus}>
          <View style={[
            styles.conditionIndicator,
            { backgroundColor: getConditionColor(tool.condition) }
          ]} />
          <Text style={styles.conditionText}>
            {CONDITION_OPTIONS.find(opt => opt.value === tool.condition)?.label}
          </Text>
        </View>

        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityLabel}>Available</Text>
          <Switch
            value={tool.available}
            onValueChange={(value) => updateTool(tool.id, { available: value })}
            trackColor={{ false: Colors.gray300, true: Colors.primary }}
            thumbColor={tool.available ? Colors.white : Colors.gray400}
          />
        </View>
      </View>

      {tool.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{tool.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderAddEditModal = () => {
    const isEditing = !!editingTool;
    const [formData, setFormData] = useState<Partial<Tool>>(
      editingTool || {
        name: '',
        category: 'general_maintenance',
        condition: 'excellent',
        available: true,
        notes: '',
      }
    );

    const handleSubmit = () => {
      if (!formData.name?.trim()) {
        Alert.alert('Error', 'Tool name is required');
        return;
      }

      const toolData: Tool = {
        id: isEditing ? editingTool!.id : Date.now().toString(),
        name: formData.name!.trim(),
        category: formData.category as ServiceCategory,
        condition: formData.condition as Tool['condition'],
        available: formData.available!,
        notes: formData.notes?.trim(),
      };

      if (isEditing) {
        updateTool(toolData.id, toolData);
      } else {
        setTools(prev => [...prev, toolData]);
      }

      setEditingTool(null);
      setShowAddModal(false);
    };

    return (
      <Modal visible={showAddModal || !!editingTool} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Tool' : 'Add New Tool'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setEditingTool(null);
              }}
            >
              <Icons.X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tool Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter tool name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categorySelector}>
                {SERVICE_CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categorySelectorItem,
                      formData.category === category.key && styles.categorySelectorItemActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category: category.key }))}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      formData.category === category.key && styles.categorySelectorTextActive
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Condition</Text>
              <View style={styles.conditionSelector}>
                {CONDITION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.conditionOption,
                      formData.condition === option.value && styles.conditionOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, condition: option.value }))}
                  >
                    <View style={[
                      styles.conditionDot,
                      { backgroundColor: option.color }
                    ]} />
                    <Text style={[
                      styles.conditionOptionText,
                      formData.condition === option.value && styles.conditionOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Available for use</Text>
                <Switch
                  value={formData.available}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, available: value }))}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                  thumbColor={formData.available ? Colors.white : Colors.gray400}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Enter notes about this tool..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowAddModal(false);
                setEditingTool(null);
              }}
              variant="outline"
              size="medium"
              style={styles.modalCancelButton}
            />
            <Button
              title={isEditing ? 'Update Tool' : 'Add Tool'}
              onPress={handleSubmit}
              variant="primary"
              size="medium"
              style={styles.modalSubmitButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icons.Wrench size={24} color={Colors.primary} />
          <Text style={styles.title}>Tools & Equipment</Text>
        </View>
        <Button
          title="Add Tool"
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="small"
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icons.Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search tools..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {renderCategoryTab('all', 'All Tools')}
        {SERVICE_CATEGORIES.map(category => 
          renderCategoryTab(category.key, category.label)
        )}
      </ScrollView>

      {/* Tool List */}
      <ScrollView style={styles.toolList} showsVerticalScrollIndicator={false}>
        {filteredTools.length === 0 ? (
          <View style={styles.emptyState}>
            <Icons.Package size={48} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No tools found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'No tools match your search criteria'
                : 'Add tools to start building your equipment inventory'
              }
            </Text>
          </View>
        ) : (
          filteredTools.map(renderToolCard)
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            size="medium"
            style={styles.cancelButton}
          />
        )}
        <Button
          title="Save Changes"
          onPress={handleSave}
          variant="primary"
          size="medium"
          loading={isLoading}
          style={styles.saveButton}
        />
      </View>

      {renderAddEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  categoryTabs: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  categoryTabTextActive: {
    color: Colors.white,
  },
  categoryBadge: {
    backgroundColor: Colors.gray200,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryBadgeActive: {
    backgroundColor: Colors.white + '30',
  },
  categoryBadgeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryBadgeTextActive: {
    color: Colors.white,
  },
  toolList: {
    flex: 1,
    padding: 16,
  },
  toolCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  toolCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  toolActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  toolDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  conditionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  formTextArea: {
    minHeight: 80,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categorySelectorItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categorySelectorItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categorySelectorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categorySelectorTextActive: {
    color: Colors.white,
  },
  conditionSelector: {
    gap: 8,
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  conditionOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  conditionOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSubmitButton: {
    flex: 2,
  },
});
/**
 * BuildingDropdown Component
 * 
 * A searchable dropdown for selecting building locations.
 * Used in Building Picker screen to assign buildings to classes.
 * 
 * Props:
 * - buildings: Array of building objects [{id, name, address}]
 * - selectedBuilding: Currently selected building object or null
 * - onSelect: Callback function when building is selected
 * - placeholder: Placeholder text (default: "Select Building")
 * - disabled: Whether dropdown is disabled
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function BuildingDropdown({
  buildings = [],
  selectedBuilding = null,
  onSelect,
  placeholder = "Select Building",
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter buildings based on search query
  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (building.address && building.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (building) => {
    onSelect(building);
    setIsVisible(false);
    setSearchQuery('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsVisible(true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled,
          selectedBuilding && styles.dropdownButtonSelected,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownContent}>
          <Ionicons
            name={selectedBuilding ? "location" : "location-outline"}
            size={20}
            color={selectedBuilding ? Colors.success : Colors.text.secondary}
          />
          <Text
            style={[
              styles.dropdownText,
              selectedBuilding && styles.dropdownTextSelected,
              disabled && styles.dropdownTextDisabled,
            ]}
            numberOfLines={1}
          >
            {selectedBuilding ? selectedBuilding.name : placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? Colors.text.tertiary : Colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Modal with Building List */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Building</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={Colors.text.secondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search buildings..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Building List */}
            <FlatList
              data={filteredBuildings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.buildingItem,
                    selectedBuilding?.id === item.id && styles.buildingItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.buildingInfo}>
                    <Text style={styles.buildingName}>{item.name}</Text>
                    {item.address && (
                      <Text style={styles.buildingAddress}>{item.address}</Text>
                    )}
                  </View>
                  {selectedBuilding?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? 'No buildings found matching your search'
                      : 'No buildings available'}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Dropdown button
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownButtonDisabled: {
    backgroundColor: Colors.surface,
    opacity: 0.5,
  },
  dropdownButtonSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.accepted.background,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text.tertiary,
    marginLeft: 8,
    flex: 1,
  },
  dropdownTextSelected: {
    color: Colors.text.primary,
    fontWeight: '500',
  },
  dropdownTextDisabled: {
    color: Colors.text.tertiary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },

  // Building list
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  buildingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginVertical: 4,
  },
  buildingItemSelected: {
    backgroundColor: Colors.accepted.background,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  buildingInfo: {
    flex: 1,
    marginRight: 12,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  buildingAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
});


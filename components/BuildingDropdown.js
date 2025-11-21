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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Filter buildings based on search query
  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (building.address && building.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure render is complete
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (building) => {
    onSelect(building);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled,
          selectedBuilding && styles.dropdownButtonSelected,
        ]}
        onPress={handleToggle}
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

      {/* Inline Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop - close dropdown when clicking outside */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* Dropdown Panel */}
          <View
            style={styles.dropdownPanel}
            onStartShouldSetResponder={() => true}
          >
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={Colors.text.secondary}
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search buildings..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    position: 'relative',
    zIndex: 1,
  },

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

  // Backdrop and Dropdown Panel
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  dropdownPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
    maxHeight: 400,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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


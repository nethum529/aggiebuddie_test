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
  const [searchQuery, setSearchQuery] = useState(
    selectedBuilding?.address || selectedBuilding?.name || ''
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Filter buildings based on search query
  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (building.address && building.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show suggestions when user starts typing
  useEffect(() => {
    if (searchQuery.length > 0 && !selectedBuilding) {
      setShowSuggestions(true);
    } else if (selectedBuilding) {
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedBuilding]);

  // Update input when building selected
  useEffect(() => {
    if (selectedBuilding) {
      setSearchQuery(selectedBuilding.address || selectedBuilding.name || '');
      setShowSuggestions(false);
    }
  }, [selectedBuilding]);

  const handleSelect = (building) => {
    onSelect(building);
    setSearchQuery(building.address || building.name || '');
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (text) => {
    setSearchQuery(text);
    // Clear selection if user modifies input
    if (selectedBuilding && text !== (selectedBuilding.address || selectedBuilding.name)) {
      onSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 0 && !selectedBuilding) {
      setShowSuggestions(true);
    }
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
  };

  return (
    <View style={[
      styles.container,
      showSuggestions && styles.containerOpen
    ]}>
      {/* Text Input - Always Visible */}
      <View
        style={[
          styles.inputContainer,
          disabled && styles.inputContainerDisabled,
          selectedBuilding && styles.inputContainerSelected,
        ]}
      >
        <Ionicons
          name={selectedBuilding ? "location" : "search"}
          size={20}
          color={selectedBuilding ? Colors.success : Colors.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!disabled}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              onSelect(null);
              setShowSuggestions(false);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown - Appears when typing */}
      {showSuggestions && searchQuery.length > 0 && (
        <>
          {/* Backdrop - close suggestions when clicking outside */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCloseSuggestions}
          />

          {/* Suggestions Panel */}
          <View
            style={styles.suggestionsPanel}
            onStartShouldSetResponder={() => true}
          >
            {/* Building List */}
            <FlatList
              data={filteredBuildings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.suggestionItem,
                    selectedBuilding?.id === item.id && styles.suggestionItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    {item.address && (
                      <Text style={styles.suggestionAddress}>{item.address}</Text>
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
                    No buildings found matching "{searchQuery}"
                  </Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.suggestionsList}
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
    zIndex: 1000,  // Higher baseline z-index
  },
  containerOpen: {
    zIndex: 10000,  // Much higher when dropdown is open
  },

  // Text Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.surface,
    opacity: 0.5,
  },
  inputContainerSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.accepted.background,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
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
  suggestionsPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 10001,  // Highest z-index to ensure it appears above all content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Suggestions list
  suggestionsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginVertical: 4,
  },
  suggestionItemSelected: {
    backgroundColor: Colors.accepted.background,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 12,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  suggestionAddress: {
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


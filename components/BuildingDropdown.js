/**
 * BuildingDropdown Component
 * 
 * A searchable dropdown for selecting building locations.
 * Uses React Native Modal to render suggestions above all content,
 * ensuring suggestions appear correctly above cards in ScrollView.
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
  Modal,  // Added Modal for overlay
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
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = useRef(null);
  const inputContainerRef = useRef(null);

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

  // Measure input position for Modal placement
  const handleInputLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    inputContainerRef.current?.measure((fx, fy, width, height, px, py) => {
      setInputPosition({
        x: px,
        y: py,
        width,
        height,
      });
    });
  };

  return (
    <View style={styles.container}>
      {/* Text Input - Always Visible */}
      <View
        ref={inputContainerRef}
        onLayout={handleInputLayout}
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

      {/* Suggestions Modal - Renders above all content */}
      <Modal
        transparent={true}
        visible={showSuggestions && searchQuery.length > 0}
        animationType="fade"
        onRequestClose={handleCloseSuggestions}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View
          style={styles.modalBackdrop}
          pointerEvents="box-none"
        >
          {/* Top area to close suggestions (above input) */}
          {inputPosition.y > 0 && (
            <TouchableOpacity
              style={[
                styles.backdropTop,
                { height: inputPosition.y },
              ]}
              activeOpacity={1}
              onPress={handleCloseSuggestions}
            />
          )}
          
          {/* Suggestions */}
          <View
            style={[
              styles.modalContent,
              {
                top: inputPosition.y + inputPosition.height + 4,
                left: inputPosition.x,
                width: inputPosition.width || '90%',
              },
            ]}
            pointerEvents="box-none"
          >
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
          </View>
          
          {/* Bottom area to close suggestions (below suggestions) */}
          <TouchableOpacity
            style={[
              styles.backdropBottom,
              {
                top: inputPosition.y + inputPosition.height + 4 + 300, // Below suggestions (maxHeight: 300)
              },
            ]}
            activeOpacity={1}
            onPress={handleCloseSuggestions}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    position: 'relative',
    // Removed zIndex - no longer needed with Modal
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

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',  // Semi-transparent overlay
    justifyContent: 'flex-start',
    paddingTop: 0,  // Will be positioned dynamically
  },
  backdropTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  backdropBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    position: 'absolute',
    // Position is set dynamically via inline styles based on inputPosition
    maxWidth: '90%',  // Fallback width
  },
  suggestionsPanel: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,  // Higher elevation for Android
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',  // Clip content to border radius
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


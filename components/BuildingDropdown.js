/**
 * BuildingDropdown Component
 * 
 * A searchable dropdown for selecting building locations.
 * Uses a full-screen Modal to avoid z-index and positioning issues.
 * 
 * Props:
 * - buildings: Array of building objects [{id, name, address}]
 * - selectedBuilding: Currently selected building object or null
 * - onSelect: Callback function when building is selected
 * - placeholder: Placeholder text (default: "Select Building")
 * - disabled: Whether dropdown is disabled
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
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
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBuildings = useMemo(() => {
    if (!searchQuery.trim()) {
      return buildings;
    }
    const query = searchQuery.toLowerCase();
    return buildings.filter(building =>
      building.name.toLowerCase().includes(query) ||
      (building.address && building.address.toLowerCase().includes(query))
    );
  }, [buildings, searchQuery]);

  const handleInputPress = () => {
    if (!disabled) {
      setShowModal(true);
      setSearchQuery('');
    }
  };

  const handleSelect = (building) => {
    onSelect(building);
    setShowModal(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleInputPress}
        disabled={disabled}
        style={[
          styles.inputContainer,
          disabled && styles.inputContainerDisabled,
          selectedBuilding && styles.inputContainerSelected,
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name={selectedBuilding ? "location" : "search"}
          size={20}
          color={selectedBuilding ? Colors.success : Colors.text.secondary}
          style={styles.inputIcon}
        />
        <Text
          style={[
            styles.inputText,
            !selectedBuilding && styles.inputTextPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedBuilding
            ? (selectedBuilding.address || selectedBuilding.name)
            : placeholder
          }
        </Text>
        {selectedBuilding && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Building</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

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
              autoFocus={true}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

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
                    <Text style={styles.buildingAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  )}
                </View>
                {selectedBuilding?.id === item.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={Colors.text.tertiary}
                />
                <Text style={styles.emptyText}>
                  No buildings found matching "{searchQuery}"
                </Text>
                <Text style={styles.emptySubtext}>
                  Try a different search term
                </Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputContainerDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.surface,
  },
  inputContainerSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.surfaceBlue,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputTextPlaceholder: {
    color: Colors.text.tertiary,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  buildingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buildingItemSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.surfaceBlue,
  },
  buildingInfo: {
    flex: 1,
    marginRight: 12,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  buildingAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

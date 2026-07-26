import React, { createContext, useContext, useState, useEffect } from "react";

export const EncounterNotesContext = createContext();

export const EncounterNotesProvider = ({ children, visibleSections = [] }) => {
  const [notesState, setNotesState] = useState({});

  useEffect(() => {
    // Cleanup notes for hidden sections
    // "The state should store only the visibleSections notes."
    setNotesState((prevState) => {
      const newState = {};
      const prevKeys = Object.keys(prevState);

      // Check if we need to remove any keys
      const keysToRemove = prevKeys.filter(
        (key) => !visibleSections.includes(key)
      );

      if (
        keysToRemove.length === 0 &&
        prevKeys.length === visibleSections.filter((s) => prevState[s]).length
      ) {
        // If no keys to remove and count matches (approx), might be stable.
        // But simpler to just reconstruct if needed.
        // Let's just follow the requirement strictly:
        // If a key is not in visibleSections, it shouldn't be in state.
        // But we don't want to clear data if visibleSections hasn't *changed* in a way that excludes them.
        // Actually, useEffect triggers when visibleSections changes.
      }

      visibleSections.forEach((section) => {
        if (prevState[section]) {
          newState[section] = prevState[section];
        }
      });

      // Only update if keys actually changed to avoid unnecessary re-renders if logic was complex,
      // but here we are deriving state from props (sort of).
      // If we blindly set state, we might loop if visibleSections is unstable.
      // But visibleSections comes from parent state.

      // Let's just compare keys.
      const newKeys = Object.keys(newState);
      if (
        prevKeys.length !== newKeys.length ||
        !prevKeys.every((k) => newKeys.includes(k))
      ) {
        return newState;
      }

      return prevState;
    });
  }, [visibleSections]);

  const getSectionState = (section) => {
    return (
      notesState[section] || {
        note: "",
        updated_at: new Date().toISOString().split("T")[0],
        updated_by: 1,
        selected_ids: [],
      }
    );
  };

  const updateSelectedIds = (section, ids) => {
    setNotesState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        selected_ids: ids,
      },
    }));
  };

  const updateNote = (section, text) => {
    setNotesState((prev) => {
      const currentSectionState = prev[section] || {
        selected_ids: [],
        updated_by: 1,
      };

      return {
        ...prev,
        [section]: {
          ...currentSectionState,
          note: text,
          updated_at: new Date().toISOString().split("T")[0], // YYYY-MM-DD
          updated_by: 1, // Default or from auth
        },
      };
    });
  };

  const updateSectionData = (section, data) => {
    setNotesState((prev) => {
      const currentSectionState = prev[section] || {
        note: "",
        updated_by: 1,
      };

      return {
        ...prev,
        [section]: {
          ...currentSectionState,
          ...data,
          updated_at: new Date().toISOString().split("T")[0],
        },
      };
    });
  };

  return (
    <EncounterNotesContext.Provider
      value={{
        notesState,
        setNotesState,
        getSectionState,
        updateNote,
        updateSectionData,
        updateSelectedIds,
      }}
    >
      {children}
    </EncounterNotesContext.Provider>
  );
};

export const useEncounterNotes = () => {
  const context = useContext(EncounterNotesContext);
  if (!context) {
    throw new Error(
      "useEncounterNotes must be used within an EncounterNotesProvider"
    );
  }
  return context;
};

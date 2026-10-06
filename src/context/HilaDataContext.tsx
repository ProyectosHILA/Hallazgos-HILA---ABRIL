import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Finding, ManagedDocument, FieldDefinition, SourceType } from '../types';

interface HilaDataContextType {
  findings: Finding[];
  setFindings: (findings: Finding[]) => void;
  addDocument: (name: string, findings: Finding[], sourceType?: SourceType) => void;
  documents: ManagedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ManagedDocument[]>>;
  analysisInstructions: string;
  setAnalysisInstructions: (instructions: string) => void;
  fieldDefinitions: FieldDefinition[];
  setFieldDefinitions: (definitions: FieldDefinition[]) => void;
}

const HilaDataContext = createContext<HilaDataContextType | undefined>(undefined);

const DEFAULT_INSTRUCTIONS = "Analiza con enfoque hospitalario pediátrico, seguridad del paciente, riesgos, recurrencia, causa raíz e intervención";

export const HilaDataProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<ManagedDocument[]>(() => {
    try {
      const stored = localStorage.getItem("HILA_DOCS");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing HILA_DOCS from localStorage", e);
      return [];
    }
  });
  
  const [analysisInstructions, setAnalysisInstructionsState] = useState(() => {
    return localStorage.getItem("HILA_ANALYSIS_INSTRUCTIONS") || "";
  });

  const [fieldDefinitions, setFieldDefinitionsState] = useState<FieldDefinition[]>(() => {
    try {
      const stored = localStorage.getItem("HILA_FIELD_DEFINITIONS");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing HILA_FIELD_DEFINITIONS from localStorage", e);
      return [];
    }
  });

  const findings = React.useMemo(() => {
    if (!Array.isArray(documents)) return [];
    // Aggregating findings from all active documents efficiently
    const allFindings: Finding[] = [];
    documents.forEach(d => {
      if (d && d.status === 'Activo' && Array.isArray(d.data)) {
        for (let i = 0; i < d.data.length; i++) {
          allFindings.push(d.data[i]);
        }
      }
    });
    return allFindings;
  }, [documents]);

  // Persist documents and findings
  useEffect(() => {
    try {
      localStorage.setItem("HILA_DOCS", JSON.stringify(documents));
    } catch (e) {
      console.error("Error persisting HILA_DOCS to localStorage", e);
      // If quota exceeded, we might want to warn the user, but at least don't crash
    }
  }, [documents]);

  // Persist instructions
  const setAnalysisInstructions = (val: string) => {
    setAnalysisInstructionsState(val);
    localStorage.setItem("HILA_ANALYSIS_INSTRUCTIONS", val);
  };

  // Persist field definitions
  const setFieldDefinitions = (val: FieldDefinition[]) => {
    setFieldDefinitionsState(val);
    localStorage.setItem("HILA_FIELD_DEFINITIONS", JSON.stringify(val));
  };

  const addDocument = (name: string, newFindings: Finding[], sourceType: SourceType = 'GENERIC') => {
    const newDoc: ManagedDocument = {
      id: `DOC-${Date.now()}`,
      name: name || 'Nuevo_Cargue.xlsx',
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Usuario',
      recordCount: newFindings.length,
      status: 'Activo',
      sourceType,
      data: newFindings
    };

    setDocuments(prev => [newDoc, ...prev]);
  };

  const setFindings = (newFindings: Finding[]) => {
    addDocument('Nuevo_Cargue.xlsx', newFindings);
  };

  return (
    <HilaDataContext.Provider value={{ 
      findings, 
      setFindings,
      addDocument,
      documents, 
      setDocuments, 
      analysisInstructions: analysisInstructions || DEFAULT_INSTRUCTIONS,
      setAnalysisInstructions,
      fieldDefinitions,
      setFieldDefinitions
    }}>
      {children}
    </HilaDataContext.Provider>
  );
};

export const useHilaData = () => {
  const context = useContext(HilaDataContext);
  if (context === undefined) {
    throw new Error('useHilaData must be used within a HilaDataProvider');
  }
  return context;
};

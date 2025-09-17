import React, { useState, useEffect } from 'react';
import { FileText, Search, X, Upload, Check, ExternalLink } from 'lucide-react';
import { DocumentStorage, StoredDocument } from '../../services/DocumentStorage';
import { DocumentProcessor } from '../../services/DocumentProcessor';
import { DocumentReference } from '../../services/DocumentContext';
import { cn } from '../../utils';

interface DocumentSelectorProps {
  advisorId: string;
  onDocumentsSelected: (documents: DocumentReference[]) => void;
  selectedDocuments: DocumentReference[];
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  advisorId,
  onDocumentsSelected,
  selectedDocuments,
  isOpen,
  onClose
}) => {
  const [documentStorage] = useState(() => DocumentStorage.getInstance());
  const [availableDocuments, setAvailableDocuments] = useState<StoredDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, advisorId]);

  const loadDocuments = () => {
    if (advisorId === 'general') {
      // General browsing mode - show all user documents
      const userDocs = documentStorage.getUserDocuments('test-user-1');
      console.log('📁 DocumentSelector (General Mode):');
      console.log(`  - Total user documents: ${userDocs.length}`);
      setAvailableDocuments(userDocs);
    } else {
      // Advisor-specific mode - show both advisor-specific AND user's general documents
      const advisorDocs = documentStorage.getAdvisorDocuments(advisorId);
      const userDocs = documentStorage.getUserDocuments('test-user-1');

      // Merge and deduplicate documents
      const allDocs = [...advisorDocs];
      userDocs.forEach(doc => {
        if (!allDocs.find(existing => existing.id === doc.id)) {
          // Mark as temporarily available if not specifically assigned to advisor
          allDocs.push({ ...doc, isTemporary: !doc.advisorId || doc.advisorId !== advisorId });
        }
      });

      console.log('📁 DocumentSelector (Advisor Mode):');
      console.log(`  - Advisor-specific documents: ${advisorDocs.length}`);
      console.log(`  - Total available documents: ${allDocs.length}`);
      console.log('  - Documents:', allDocs.map(d => ({
        filename: d.filename,
        advisorId: d.advisorId,
        isTemporary: d.isTemporary
      })));

      setAvailableDocuments(allDocs);
    }
  };

  const filteredDocuments = availableDocuments.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return doc.filename.toLowerCase().includes(query) ||
           doc.category.toLowerCase().includes(query) ||
           doc.extractedText.toLowerCase().includes(query);
  });

  const isDocumentSelected = (documentId: string): boolean => {
    return selectedDocuments.some(ref => ref.id === documentId);
  };

  const toggleDocument = (document: StoredDocument) => {
    const isSelected = isDocumentSelected(document.id);

    if (isSelected) {
      // Remove document
      const updated = selectedDocuments.filter(ref => ref.id !== document.id);
      onDocumentsSelected(updated);
    } else {
      // Add document
      const newReference: DocumentReference = {
        id: document.id,
        name: document.filename,
        type: 'direct',
        document
      };
      onDocumentsSelected([...selectedDocuments, newReference]);
    }
  };

  const selectAllFiltered = () => {
    const newReferences: DocumentReference[] = filteredDocuments
      .filter(doc => !isDocumentSelected(doc.id))
      .map(document => ({
        id: document.id,
        name: document.filename,
        type: 'direct' as const,
        document
      }));

    onDocumentsSelected([...selectedDocuments, ...newReferences]);
  };

  const clearSelection = () => {
    onDocumentsSelected([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {advisorId === 'general' ? 'Browse Documents' : 'Select Documents'}
              </h2>
              <p className="text-sm text-gray-600">
                {advisorId === 'general'
                  ? 'Browse your document library and select documents for conversations'
                  : 'Choose documents to include in your conversation context'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents by name, category, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={selectAllFiltered}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                disabled={filteredDocuments.length === 0}
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
                disabled={selectedDocuments.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          {selectedDocuments.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {selectedDocuments.length} document{selectedDocuments.length === 1 ? '' : 's'} selected
              </p>
            </div>
          )}
        </div>

        {/* Document List */}
        <div className="p-6 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No documents found' : 'No documents available'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Upload documents for this advisor to get started'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocuments.map((document) => {
                const isSelected = isDocumentSelected(document.id);
                return (
                  <div
                    key={document.id}
                    onClick={() => toggleDocument(document)}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-blue-600" : "bg-gray-100"
                        )}>
                          {isSelected ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-lg">
                              {DocumentProcessor.getFileIcon(document.metadata.type)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {document.filename}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="capitalize">{document.category}</span>
                            <span>{DocumentProcessor.formatFileSize(document.metadata.size)}</span>
                            <span>{document.metadata.wordCount} words</span>
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              document.confidentialityLevel === 'public' && "bg-green-100 text-green-800",
                              document.confidentialityLevel === 'internal' && "bg-yellow-100 text-yellow-800",
                              document.confidentialityLevel === 'confidential' && "bg-red-100 text-red-800"
                            )}>
                              {document.confidentialityLevel}
                            </span>
                          </div>
                          {document.extractedText && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {document.extractedText.substring(0, 150)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedDocuments.length > 0 && (
              <span>
                {selectedDocuments.length} document{selectedDocuments.length === 1 ? '' : 's'} will be included in conversation context
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Continue with Selected Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
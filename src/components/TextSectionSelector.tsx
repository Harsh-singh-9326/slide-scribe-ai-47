import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Plus, Trash2, MousePointerClick } from "lucide-react";

interface TextSection {
  id: string;
  text: string;
  start: number;
  end: number;
}

interface TextSectionSelectorProps {
  content: string;
  onSelectionChange: (selectedText: string) => void;
}

const TextSectionSelector = ({ content, onSelectionChange }: TextSectionSelectorProps) => {
  const [selectedSections, setSelectedSections] = useState<TextSection[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Get selection range relative to content
    const range = selection.getRangeAt(0);
    const container = document.getElementById('selectable-content');
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const newSection: TextSection = {
      id: `section-${Date.now()}`,
      text: selectedText,
      start: content.indexOf(selectedText),
      end: content.indexOf(selectedText) + selectedText.length,
    };

    // Check for duplicates
    const isDuplicate = selectedSections.some(
      section => section.text === selectedText
    );

    if (!isDuplicate && selectedText.length > 0) {
      const newSections = [...selectedSections, newSection];
      setSelectedSections(newSections);
      updateCombinedText(newSections);
    }

    selection.removeAllRanges();
  }, [content, selectedSections]);

  const updateCombinedText = (sections: TextSection[]) => {
    const combinedText = sections.map(s => s.text).join("\n\n---\n\n");
    onSelectionChange(combinedText);
  };

  const removeSection = (id: string) => {
    const newSections = selectedSections.filter(s => s.id !== id);
    setSelectedSections(newSections);
    updateCombinedText(newSections);
  };

  const clearAllSections = () => {
    setSelectedSections([]);
    onSelectionChange("");
  };

  const selectAll = () => {
    const allSection: TextSection = {
      id: "all-content",
      text: content,
      start: 0,
      end: content.length,
    };
    setSelectedSections([allSection]);
    onSelectionChange(content);
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSelectMode(!isSelectMode)}
            className="gap-2"
          >
            <MousePointerClick className="w-4 h-4" />
            {isSelectMode ? "Selection Mode ON" : "Enable Selection"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Select All
          </Button>
          {selectedSections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllSections}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {selectedSections.length} section{selectedSections.length !== 1 ? "s" : ""} selected
        </Badge>
      </div>

      {isSelectMode && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-primary" />
          <span>Highlight text below to add sections. Selected sections will be used for generation.</span>
        </div>
      )}

      {/* Content area */}
      <ScrollArea className="h-[300px] rounded-lg border bg-muted/30">
        <div
          id="selectable-content"
          className={`p-4 text-sm leading-relaxed whitespace-pre-wrap ${
            isSelectMode ? "cursor-text select-text" : "select-none"
          }`}
          onMouseUp={isSelectMode ? handleTextSelection : undefined}
        >
          {content}
        </div>
      </ScrollArea>

      {/* Selected sections */}
      {selectedSections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Selected Sections</p>
            <Badge variant="outline">
              {getWordCount(selectedSections.map(s => s.text).join(" "))} words total
            </Badge>
          </div>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {selectedSections.map((section, index) => (
                <div
                  key={section.id}
                  className="group flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <Badge variant="secondary" className="shrink-0 mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="flex-1 text-sm line-clamp-3">
                    {section.text.length > 200 
                      ? section.text.substring(0, 200) + "..." 
                      : section.text}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeSection(section.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default TextSectionSelector;

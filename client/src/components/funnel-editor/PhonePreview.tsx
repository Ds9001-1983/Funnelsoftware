import { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import type { FunnelPage, PageElement } from "@shared/schema";
import { FunnelProgress } from "./FunnelProgress";
import { InlineElementPicker } from "./FloatingToolbar";
import { ElementPreviewRenderer, SectionPreviewRenderer } from "./ElementPreviewRenderer";
import { ElementWrapper } from "./ElementWrapper";

interface PhonePreviewProps {
  page: FunnelPage | null;
  pageIndex: number;
  totalPages: number;
  primaryColor: string;
  onUpdatePage?: (updates: Partial<FunnelPage>) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onAddElement?: (type: PageElement["type"]) => void;
  onDeleteElement?: () => void;
  onDuplicateElement?: () => void;
  onMoveElementUp?: () => void;
  onMoveElementDown?: () => void;
  onShowElementPicker?: () => void;
}

/**
 * Enhanced Phone Preview with inline editing and element selection.
 * Displays a funnel page in a phone-like frame with interactive elements.
 */
export function PhonePreview({
  page,
  pageIndex,
  totalPages,
  primaryColor,
  onUpdatePage,
  selectedElementId,
  onSelectElement,
  onAddElement,
}: PhonePreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(page?.title || "");
  const [localSubtitle, setLocalSubtitle] = useState(page?.subtitle || "");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalTitle(page?.title || "");
    setLocalSubtitle(page?.subtitle || "");
  }, [page?.title, page?.subtitle]);

  const updateFormValue = (elementId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [elementId]: value }));
  };

  const handleTitleSave = () => {
    if (onUpdatePage && localTitle !== page?.title) {
      onUpdatePage({ title: localTitle });
    }
    setEditingField(null);
  };

  const handleSubtitleSave = () => {
    if (onUpdatePage && localSubtitle !== page?.subtitle) {
      onUpdatePage({ subtitle: localSubtitle });
    }
    setEditingField(null);
  };

  if (!page) {
    return (
      <div className="preview-container w-full min-h-[400px] flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground p-6">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Wähle eine Seite aus</p>
          <p className="text-sm mt-1">Klicke links auf eine Seite zum Bearbeiten</p>
        </div>
      </div>
    );
  }

  const isWelcome = page.type === "welcome";
  const isThankyou = page.type === "thankyou";
  const bgColor = page.backgroundColor || (isWelcome || isThankyou ? primaryColor : "#ffffff");
  const textColor = isWelcome || isThankyou ? "#ffffff" : "#1a1a1a";

  // Filter elements by type for different rendering groups
  const contactElements = page.type === "contact" ? page.elements : [];
  const basicElements = page.elements.filter((el) =>
    ["heading", "text", "image", "icon", "progressBar"].includes(el.type)
  );
  const videoElements = page.elements.filter((el) => el.type === "video");
  const testimonialElements = page.elements.filter((el) => el.type === "testimonial");
  const sliderElements = page.elements.filter((el) => el.type === "slider");
  const socialProofElements = page.elements.filter((el) => el.type === "socialProof");
  const audioElements = page.elements.filter((el) => el.type === "audio");
  const buttonElements = page.elements.filter((el) => el.type === "button");
  const calendarElements = page.elements.filter((el) => el.type === "calendar");
  const countdownElements = page.elements.filter((el) => el.type === "countdown");
  const mapElements = page.elements.filter((el) => el.type === "map");
  const chartElements = page.elements.filter((el) => el.type === "chart");
  const codeElements = page.elements.filter((el) => el.type === "code");
  const embedElements = page.elements.filter((el) => el.type === "embed");
  const productElements = page.elements.filter((el) => el.type === "product");
  const teamElements = page.elements.filter((el) => el.type === "team");
  const optionElements = page.elements.filter((el) => el.options);

  const renderElement = (el: PageElement) => (
    <ElementPreviewRenderer
      key={el.id}
      element={el}
      textColor={textColor}
      primaryColor={primaryColor}
      selectedElementId={selectedElementId}
      onSelectElement={onSelectElement}
      formValues={formValues}
      updateFormValue={updateFormValue}
    />
  );

  return (
    <div className="preview-container w-full rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div
        className="min-h-[500px] flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Progress bar */}
        {!isWelcome && !isThankyou && totalPages > 1 && (
          <FunnelProgress
            currentPage={pageIndex}
            totalPages={totalPages}
            primaryColor={primaryColor}
          />
        )}

        <div className="flex-1 flex flex-col justify-center p-6 text-center overflow-y-auto">
          {/* Editable Title */}
          {editingField === "title" ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              autoFocus
              className="text-xl font-bold mb-2 bg-transparent border-b-2 border-white/50 outline-none text-center w-full"
              style={{ color: textColor }}
            />
          ) : (
            <h2
              className="text-xl font-bold mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: textColor }}
              onClick={() => onUpdatePage && setEditingField("title")}
              title="Klicken zum Bearbeiten"
            >
              {page.title}
            </h2>
          )}

          {/* Editable Subtitle */}
          {page.subtitle !== undefined &&
            (editingField === "subtitle" ? (
              <textarea
                value={localSubtitle}
                onChange={(e) => setLocalSubtitle(e.target.value)}
                onBlur={handleSubtitleSave}
                autoFocus
                className="text-sm opacity-80 mb-6 bg-transparent border-b border-white/30 outline-none text-center w-full resize-none"
                style={{ color: textColor }}
                rows={2}
              />
            ) : (
              <p
                className="text-sm opacity-80 mb-6 cursor-pointer hover:opacity-60 transition-opacity"
                style={{ color: textColor }}
                onClick={() => onUpdatePage && setEditingField("subtitle")}
                title="Klicken zum Bearbeiten"
              >
                {page.subtitle || "Untertitel hinzufügen..."}
              </p>
            ))}

          {/* Contact page elements */}
          {page.type === "contact" && (
            <div className="space-y-3 mt-4">{contactElements.map(renderElement)}</div>
          )}

          {/* Basic elements (heading, text, image, icon, progressBar) */}
          {basicElements.length > 0 && page.type !== "contact" && (
            <div className="mt-4 space-y-3">{basicElements.map(renderElement)}</div>
          )}

          {/* Video elements */}
          {videoElements.length > 0 && page.type !== "contact" && (
            <div className="mt-4 space-y-3">{videoElements.map(renderElement)}</div>
          )}

          {/* Testimonial elements */}
          {testimonialElements.length > 0 && (
            <div className="mt-4 space-y-3">{testimonialElements.map(renderElement)}</div>
          )}

          {/* Slider elements */}
          {sliderElements.length > 0 && (
            <div className="mt-4">{sliderElements.map(renderElement)}</div>
          )}

          {/* Multi-choice / Question page options */}
          {(page.type === "multiChoice" || page.type === "question") &&
            optionElements.length > 0 && (
              <div className="space-y-2 mt-4">
                {optionElements.map((el) => (
                  <ElementWrapper
                    key={el.id}
                    elementId={el.id}
                    elementType={el.type}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                  >
                    <div className="space-y-2">
                      {el.options?.map((option, idx) => (
                        <div
                          key={`${el.id}-${idx}`}
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm text-left bg-white hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </ElementWrapper>
                ))}
              </div>
            )}

          {/* Social Proof elements */}
          {socialProofElements.length > 0 && (
            <div className="mt-4">{socialProofElements.map(renderElement)}</div>
          )}

          {/* Audio elements */}
          {audioElements.length > 0 && (
            <div className="mt-4 space-y-3">{audioElements.map(renderElement)}</div>
          )}

          {/* Button elements */}
          {buttonElements.length > 0 && (
            <div className="mt-4 space-y-3">{buttonElements.map(renderElement)}</div>
          )}

          {/* Calendar elements */}
          {calendarElements.length > 0 && (
            <div className="mt-4 space-y-3">{calendarElements.map(renderElement)}</div>
          )}

          {/* Countdown elements */}
          {countdownElements.length > 0 && (
            <div className="mt-4 space-y-3">{countdownElements.map(renderElement)}</div>
          )}

          {/* Map elements */}
          {mapElements.length > 0 && (
            <div className="mt-4 space-y-3">{mapElements.map(renderElement)}</div>
          )}

          {/* Chart elements */}
          {chartElements.length > 0 && (
            <div className="mt-4 space-y-3">{chartElements.map(renderElement)}</div>
          )}

          {/* Code elements */}
          {codeElements.length > 0 && (
            <div className="mt-4 space-y-3">{codeElements.map(renderElement)}</div>
          )}

          {/* Embed elements */}
          {embedElements.length > 0 && (
            <div className="mt-4 space-y-3">{embedElements.map(renderElement)}</div>
          )}

          {/* Product elements */}
          {productElements.length > 0 && (
            <div className="mt-4 space-y-3">{productElements.map(renderElement)}</div>
          )}

          {/* Team elements */}
          {teamElements.length > 0 && (
            <div className="mt-4 space-y-3">{teamElements.map(renderElement)}</div>
          )}

          {/* Sections with Columns */}
          {page.sections && page.sections.length > 0 && (
            <div className="mt-4 space-y-4">
              {page.sections.map((section) => (
                <SectionPreviewRenderer
                  key={section.id}
                  section={section}
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                />
              ))}
            </div>
          )}

          {/* Inline Element Picker */}
          {onAddElement && <InlineElementPicker onAddElement={onAddElement} />}
        </div>

        {/* Page button */}
        {page.buttonText && (
          <div className="p-6 pt-0">
            <button
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{
                backgroundColor: isWelcome || isThankyou ? "#ffffff" : primaryColor,
                color: isWelcome || isThankyou ? primaryColor : "#ffffff",
              }}
            >
              {page.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

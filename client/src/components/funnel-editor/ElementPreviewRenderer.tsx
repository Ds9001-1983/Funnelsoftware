import {
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  Calendar,
  FileUp,
  Image,
  Plus,
  MapPin,
  Code,
  ShoppingBag,
  Users,
  Music,
} from "lucide-react";
import type { PageElement, Section } from "@shared/schema";
import { ElementWrapper, elementTypeLabels } from "./ElementWrapper";
import { FormFieldWithValidation } from "./FormFieldWithValidation";

interface ElementPreviewRendererProps {
  element: PageElement;
  textColor: string;
  primaryColor: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  formValues?: Record<string, string>;
  updateFormValue?: (elementId: string, value: string) => void;
}

/**
 * Renders a single element in the preview based on its type.
 */
export function ElementPreviewRenderer({
  element: el,
  textColor,
  primaryColor,
  selectedElementId,
  onSelectElement,
  formValues = {},
  updateFormValue,
}: ElementPreviewRendererProps) {
  const wrapperProps = {
    elementId: el.id,
    elementType: el.type,
    selectedElementId,
    onSelectElement,
  };

  switch (el.type) {
    case "input":
    case "textarea":
      return (
        <ElementWrapper {...wrapperProps}>
          <FormFieldWithValidation
            element={el}
            value={formValues[el.id] || ""}
            onChange={(value) => updateFormValue?.(el.id, value)}
            className="shadow-sm"
          />
        </ElementWrapper>
      );

    case "select":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center justify-between shadow-sm">
            <span className="text-gray-400">
              {el.placeholder || "Option wählen..."}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </ElementWrapper>
      );

    case "radio":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="space-y-2">
            {el.label && (
              <p className="text-sm font-medium text-left" style={{ color: textColor }}>
                {el.label}
              </p>
            )}
            {el.options?.map((option, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm shadow-sm"
              >
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                <span>{option}</span>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );

    case "checkbox":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm shadow-sm">
            <div className="w-4 h-4 rounded border-2 border-gray-300" />
            <span>{el.label || "Checkbox"}</span>
          </div>
        </ElementWrapper>
      );

    case "date":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center gap-2 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">
              {el.placeholder || "Datum wählen..."}
            </span>
          </div>
        </ElementWrapper>
      );

    case "fileUpload":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full px-4 py-5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center">
            <FileUp className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">{el.label || "Datei hochladen"}</p>
            <p className="text-xs text-gray-400 mt-1">
              {el.acceptedFileTypes?.length
                ? el.acceptedFileTypes.join(", ")
                : "PDF, Bilder, Dokumente"}
            </p>
          </div>
        </ElementWrapper>
      );

    case "video":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full aspect-video rounded-lg bg-gray-900 flex items-center justify-center shadow-md">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Play className="h-7 w-7 text-white ml-1" />
            </div>
          </div>
        </ElementWrapper>
      );

    case "audio":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
            <div className="flex-1">
              <div className="h-1 bg-gray-300 rounded-full">
                <div className="h-1 bg-primary rounded-full w-1/3" />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0:00</span>
                <span>3:24</span>
              </div>
            </div>
          </div>
        </ElementWrapper>
      );

    case "list":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="text-left space-y-2">
            {el.listItems?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm" style={{ color: textColor }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );

    case "faq":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="space-y-2 text-left">
            {el.faqItems?.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="font-medium text-sm flex items-center justify-between">
                  {item.question}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );

    case "divider":
      return (
        <ElementWrapper {...wrapperProps}>
          <hr className="my-4 border-gray-200" />
        </ElementWrapper>
      );

    case "spacer":
      return (
        <ElementWrapper {...wrapperProps}>
          <div style={{ height: el.spacerHeight || 24 }} />
        </ElementWrapper>
      );

    case "timer":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
            <div className="flex justify-center gap-3">
              {["00", "12", "45", "30"].map((val, idx) => (
                <div key={idx}>
                  <div className="text-2xl font-bold" style={{ color: textColor }}>
                    {val}
                  </div>
                  <div className="text-xs opacity-60" style={{ color: textColor }}>
                    {["Tage", "Std", "Min", "Sek"][idx]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ElementWrapper>
      );

    case "countdown":
      return (
        <ElementWrapper {...wrapperProps}>
          <div
            className={`p-4 rounded-xl ${
              el.countdownStyle === "flip" ? "bg-gray-900" : "bg-white border"
            }`}
          >
            <div className="flex justify-center gap-2">
              {[
                { value: "07", label: "Tage" },
                { value: "12", label: "Std" },
                { value: "45", label: "Min" },
                { value: "30", label: "Sek" },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div
                    className={`text-2xl font-bold px-3 py-2 rounded ${
                      el.countdownStyle === "flip"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {item.value}
                  </div>
                  {el.countdownShowLabels !== false && (
                    <div
                      className={`text-xs mt-1 ${
                        el.countdownStyle === "flip" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ElementWrapper>
      );

    case "heading":
      return (
        <ElementWrapper {...wrapperProps}>
          <h3
            className="font-bold"
            style={{
              color: el.styles?.color || textColor,
              fontSize: el.styles?.fontSize || "1.25rem",
              fontWeight: el.styles?.fontWeight || "bold",
              fontStyle: el.styles?.fontStyle || "normal",
              textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
            }}
          >
            {el.content || "Überschrift"}
          </h3>
        </ElementWrapper>
      );

    case "text":
      return (
        <ElementWrapper {...wrapperProps}>
          <p
            className="text-sm"
            style={{
              color: el.styles?.color || textColor,
              fontSize: el.styles?.fontSize || "0.875rem",
              fontWeight: el.styles?.fontWeight || "normal",
              fontStyle: el.styles?.fontStyle || "normal",
              textAlign: (el.styles?.textAlign as "left" | "center" | "right") || "center",
            }}
          >
            {el.content || "Text hier..."}
          </p>
        </ElementWrapper>
      );

    case "image":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full">
            {el.imageUrl ? (
              <img
                src={el.imageUrl}
                alt={el.imageAlt || "Bild"}
                className="w-full rounded-lg shadow-md object-cover"
                style={{ maxHeight: "200px" }}
              />
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </ElementWrapper>
      );

    case "icon":
      return (
        <ElementWrapper {...wrapperProps}>
          <div
            className="flex justify-center"
            style={{ color: el.styles?.color || textColor }}
          >
            <div
              className={`${
                el.iconSize === "xl"
                  ? "h-16 w-16"
                  : el.iconSize === "lg"
                  ? "h-12 w-12"
                  : el.iconSize === "md"
                  ? "h-8 w-8"
                  : "h-6 w-6"
              }`}
            >
              <Star className="w-full h-full" />
            </div>
          </div>
        </ElementWrapper>
      );

    case "progressBar":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: "60%", backgroundColor: primaryColor }}
            />
          </div>
        </ElementWrapper>
      );

    case "button":
      return (
        <ElementWrapper {...wrapperProps}>
          <button
            className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
              el.buttonVariant === "outline"
                ? "border-2 border-primary text-primary bg-transparent"
                : el.buttonVariant === "secondary"
                ? "bg-gray-200 text-gray-800"
                : el.buttonVariant === "ghost"
                ? "bg-transparent text-primary hover:bg-primary/10"
                : "bg-primary text-white"
            }`}
            style={el.buttonVariant === "primary" ? { backgroundColor: primaryColor } : undefined}
          >
            {el.content || "Button"}
          </button>
        </ElementWrapper>
      );

    case "testimonial":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex gap-0.5 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 mb-3 text-left">
              "{el.slides?.[0]?.text || "Großartiger Service!"}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
              <div className="text-left">
                <p className="text-sm font-semibold">{el.slides?.[0]?.author || "Kunde"}</p>
                <p className="text-xs text-gray-500">{el.slides?.[0]?.role || "Position"}</p>
              </div>
            </div>
          </div>
        </ElementWrapper>
      );

    case "slider":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-md">
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Image className="h-10 w-10" />
              </div>
            </div>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex justify-center gap-1.5 mt-3">
              {(el.slides || [{ id: "1" }, { id: "2" }, { id: "3" }]).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === 0 ? "bg-gray-800" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </ElementWrapper>
      );

    case "socialProof":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="flex flex-wrap justify-center gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-16 bg-white/20 rounded" />
            ))}
          </div>
        </ElementWrapper>
      );

    case "calendar":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl p-4 shadow-md border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Termin buchen</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                <div key={d} className="text-gray-500 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div
                  key={i}
                  className={`py-1 rounded ${
                    i === 14 ? "bg-primary text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">
              {el.calendarProvider === "calendly" ? "Powered by Calendly" : "Terminauswahl"}
            </p>
          </div>
        </ElementWrapper>
      );

    case "map":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-gray-600">{el.mapAddress || "Karte"}</p>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-white rounded px-2 py-1 text-xs shadow">
              Google Maps
            </div>
          </div>
        </ElementWrapper>
      );

    case "chart":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl p-4 shadow-md border">
            <div className="flex items-end justify-around h-32 gap-2">
              {(el.chartData?.datasets[0]?.data || [10, 20, 30, 40]).map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(value / 50) * 100}%`,
                      backgroundColor: primaryColor,
                      minHeight: "8px",
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {el.chartData?.labels[idx] || `${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ElementWrapper>
      );

    case "code":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div className="flex gap-1.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
              <code>{el.codeContent || "// Code hier..."}</code>
            </pre>
          </div>
        </ElementWrapper>
      );

    case "embed":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Eingebetteter Inhalt</p>
              <p className="text-xs text-gray-400 mt-1">{el.embedUrl || "URL hinzufügen"}</p>
            </div>
          </div>
        </ElementWrapper>
      );

    case "product":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {el.productImage ? (
                <img
                  src={el.productImage}
                  alt={el.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-12 w-12 text-gray-300" />
              )}
            </div>
            <div className="p-4">
              <h4 className="font-semibold">{el.productName || "Produkt"}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {el.productDescription || "Beschreibung..."}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold" style={{ color: primaryColor }}>
                  {el.productPrice || "€99"}
                </span>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {el.productButtonText || "Kaufen"}
                </button>
              </div>
            </div>
          </div>
        </ElementWrapper>
      );

    case "team":
      return (
        <ElementWrapper {...wrapperProps}>
          <div className="grid grid-cols-2 gap-3">
            {(el.teamMembers || []).slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl p-3 shadow-md border text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mb-2">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-primary" />
                  )}
                </div>
                <h5 className="font-medium text-sm">{member.name}</h5>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </ElementWrapper>
      );

    default:
      return null;
  }
}

interface SectionPreviewProps {
  section: Section;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
}

/**
 * Renders a section with columns in the preview.
 */
export function SectionPreviewRenderer({
  section,
  selectedElementId,
  onSelectElement,
}: SectionPreviewProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: section.styles?.backgroundColor || "transparent",
        padding: section.styles?.padding || "16px",
        minHeight: section.styles?.minHeight,
      }}
    >
      {section.name && (
        <div className="text-xs text-gray-500 mb-2 font-medium">{section.name}</div>
      )}
      <div className="flex gap-2">
        {section.columns.map((column) => (
          <div
            key={column.id}
            className="min-h-[60px] rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/30 transition-colors p-2"
            style={{
              width: `${column.width}%`,
              backgroundColor: column.styles?.backgroundColor || "transparent",
              padding: column.styles?.padding || "8px",
            }}
          >
            {column.elements.length > 0 ? (
              <div className="space-y-2">
                {column.elements.map((el) => (
                  <ElementWrapper
                    key={el.id}
                    elementId={el.id}
                    elementType={el.type}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                  >
                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 text-center">
                      {elementTypeLabels[el.type] || el.type}
                    </div>
                  </ElementWrapper>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                <Plus className="h-3 w-3 mr-1" />
                Element
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

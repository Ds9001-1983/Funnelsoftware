import { useState, useEffect } from "react";
import { AlertCircle, Check } from "lucide-react";
import type { PageElement } from "@shared/schema";

interface FormFieldWithValidationProps {
  element: PageElement;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validiert einen Wert basierend auf den Element-Validierungsregeln.
 */
export function validateField(element: PageElement, value: string): ValidationResult {
  const validation = element.validation;
  const required = element.required;

  // Check required
  if (required && !value.trim()) {
    return {
      isValid: false,
      errorMessage: validation?.errorMessage || "Dieses Feld ist erforderlich",
    };
  }

  // If empty and not required, it's valid
  if (!value.trim() && !required) {
    return { isValid: true };
  }

  // Check minLength
  if (validation?.minLength !== undefined && value.length < validation.minLength) {
    return {
      isValid: false,
      errorMessage: validation.errorMessage || `Mindestens ${validation.minLength} Zeichen erforderlich`,
    };
  }

  // Check maxLength
  if (validation?.maxLength !== undefined && value.length > validation.maxLength) {
    return {
      isValid: false,
      errorMessage: validation.errorMessage || `Maximal ${validation.maxLength} Zeichen erlaubt`,
    };
  }

  // Check validation type
  if (validation?.type) {
    switch (validation.type) {
      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return {
            isValid: false,
            errorMessage: validation.errorMessage || "Bitte geben Sie eine gültige E-Mail-Adresse ein",
          };
        }
        break;
      }
      case "phone": {
        // Allow various phone formats
        const phoneRegex = /^[\d\s\-+()]{6,20}$/;
        if (!phoneRegex.test(value)) {
          return {
            isValid: false,
            errorMessage: validation.errorMessage || "Bitte geben Sie eine gültige Telefonnummer ein",
          };
        }
        break;
      }
      case "url": {
        try {
          new URL(value);
        } catch {
          return {
            isValid: false,
            errorMessage: validation.errorMessage || "Bitte geben Sie eine gültige URL ein",
          };
        }
        break;
      }
      case "number": {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return {
            isValid: false,
            errorMessage: validation.errorMessage || "Bitte geben Sie eine Zahl ein",
          };
        }
        if (validation.min !== undefined && num < validation.min) {
          return {
            isValid: false,
            errorMessage: validation.errorMessage || `Der Wert muss mindestens ${validation.min} sein`,
          };
        }
        if (validation.max !== undefined && num > validation.max) {
          return {
            isValid: false,
            errorMessage: validation.errorMessage || `Der Wert darf maximal ${validation.max} sein`,
          };
        }
        break;
      }
      case "custom": {
        if (validation.pattern) {
          try {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
              return {
                isValid: false,
                errorMessage: validation.errorMessage || "Der Wert entspricht nicht dem erforderlichen Format",
              };
            }
          } catch {
            // Invalid regex, skip validation
          }
        }
        break;
      }
    }
  }

  return { isValid: true };
}

/**
 * Input-Feld mit Validierungs-Feedback.
 * Zeigt visuelles Feedback für Validierungszustände.
 */
export function FormFieldWithValidation({
  element,
  value,
  onChange,
  className = "",
  disabled = false,
}: FormFieldWithValidationProps) {
  const [touched, setTouched] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });

  useEffect(() => {
    if (touched) {
      setValidationResult(validateField(element, value));
    }
  }, [value, touched, element]);

  const handleBlur = () => {
    setTouched(true);
    setValidationResult(validateField(element, value));
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (touched) {
      setValidationResult(validateField(element, newValue));
    }
  };

  const showError = touched && !validationResult.isValid;
  const showSuccess = touched && validationResult.isValid && value.trim().length > 0;

  const inputType = element.validation?.type === "email" ? "email"
    : element.validation?.type === "phone" ? "tel"
    : element.validation?.type === "url" ? "url"
    : element.validation?.type === "number" ? "number"
    : "text";

  const baseClassName = `w-full px-4 py-3 rounded-lg border text-sm bg-white transition-all outline-none
    ${showError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
      : showSuccess
        ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
        : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
    }
    ${className}`;

  if (element.type === "textarea") {
    return (
      <div className="space-y-1">
        <div className="relative">
          <textarea
            placeholder={element.placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={`${baseClassName} resize-none`}
            rows={3}
            disabled={disabled}
            maxLength={element.validation?.maxLength}
          />
          {showError && (
            <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
          )}
          {showSuccess && (
            <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
          )}
        </div>
        {showError && validationResult.errorMessage && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validationResult.errorMessage}
          </p>
        )}
        {element.validation?.maxLength && (
          <p className="text-xs text-muted-foreground text-right">
            {value.length}/{element.validation.maxLength}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type={inputType}
          placeholder={element.placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={baseClassName}
          disabled={disabled}
          maxLength={element.validation?.maxLength}
          min={element.validation?.min}
          max={element.validation?.max}
        />
        {showError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
        )}
        {showSuccess && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
      {showError && validationResult.errorMessage && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validationResult.errorMessage}
        </p>
      )}
      {element.required && !touched && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="text-red-500">*</span> Pflichtfeld
        </p>
      )}
    </div>
  );
}

/**
 * Prüft, ob alle Formularfelder auf einer Seite valide sind.
 */
export function validateAllFields(
  elements: PageElement[],
  values: Record<string, string>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const element of elements) {
    if (["input", "textarea"].includes(element.type)) {
      const value = values[element.id] || "";
      const result = validateField(element, value);
      if (!result.isValid) {
        isValid = false;
        errors[element.id] = result.errorMessage || "Ungültig";
      }
    }
  }

  return { isValid, errors };
}

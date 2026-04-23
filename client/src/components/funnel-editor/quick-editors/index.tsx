import { memo, useCallback, type ComponentType } from "react";
import type { PageElement } from "@shared/schema";
import type { QuickEditorProps } from "./types";
import { TextQuick, InputQuick } from "./TextQuick";
import {
  FileUploadQuick,
  ChoiceQuick,
  DateQuick,
  RequiredToggle,
  FORM_ELEMENT_TYPES,
} from "./FormQuick";
import { VideoQuick, ImageQuick } from "./MediaQuick";
import {
  TestimonialQuick,
  SliderQuick,
  FaqQuick,
  ListQuick,
  SocialProofQuick,
} from "./CollectionQuick";
import { TimerQuick, ProgressBarQuick, IconQuick } from "./InteractiveQuick";
import { SpacerQuick, DividerQuick } from "./LayoutQuick";

export type { QuickEditorProps };
export { RequiredToggle, FORM_ELEMENT_TYPES };

const quickEditors: Partial<Record<string, ComponentType<QuickEditorProps>>> = {
  heading: TextQuick,
  text: TextQuick,
  input: InputQuick,
  textarea: InputQuick,
  fileUpload: FileUploadQuick,
  radio: ChoiceQuick,
  select: ChoiceQuick,
  date: DateQuick,
  video: VideoQuick,
  image: ImageQuick,
  testimonial: TestimonialQuick,
  slider: SliderQuick,
  faq: FaqQuick,
  list: ListQuick,
  socialProof: SocialProofQuick,
  timer: TimerQuick,
  progressBar: ProgressBarQuick,
  icon: IconQuick,
  spacer: SpacerQuick,
  divider: DividerQuick,
};

interface ElementQuickEditorProps {
  element: PageElement;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
}

/**
 * Dispatcher für Quick-Editors in der Element-Card.
 * Bindet `element.id` intern, sodass der Parent nur einen stabilen
 * `onUpdateElement(id, updates)` reichen muss.
 */
export const ElementQuickEditor = memo(function ElementQuickEditor({
  element,
  onUpdateElement,
}: ElementQuickEditorProps) {
  const handleUpdate = useCallback(
    (updates: Partial<PageElement>) => onUpdateElement(element.id, updates),
    [onUpdateElement, element.id],
  );
  const Editor = quickEditors[element.type];
  if (!Editor) return null;
  return <Editor element={element} onUpdate={handleUpdate} />;
});

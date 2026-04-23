import type { ComponentType } from "react";
import type { PropertiesProps } from "./types";
import { TextProperties } from "./TextProperties";
import { ImageProperties, VideoProperties, AudioProperties } from "./MediaProperties";
import {
  InputFieldProperties,
  SelectProperties,
  RadioProperties,
  CheckboxProperties,
  FileUploadProperties,
  DateProperties,
} from "./FormProperties";
import { ButtonProperties } from "./ButtonProperties";
import { SpacerProperties, DividerProperties } from "./LayoutProperties";
import {
  QuizProperties,
  CountdownProperties,
  IconProperties,
  ProgressBarProperties,
  TimerProperties,
  SliderElementProperties,
} from "./InteractiveProperties";
import {
  CalendarProperties,
  ChartProperties,
  CodeProperties,
  EmbedProperties,
} from "./DisplayProperties";
import { ProductProperties, TeamProperties } from "./CommerceProperties";
import {
  TestimonialProperties,
  FaqProperties,
  ListProperties,
  SocialProofProperties,
} from "./CollectionProperties";

export type { PropertiesProps };

export const propertyEditors: Partial<Record<string, ComponentType<PropertiesProps>>> = {
  heading: TextProperties,
  text: TextProperties,
  image: ImageProperties,
  video: VideoProperties,
  audio: AudioProperties,
  input: InputFieldProperties,
  textarea: InputFieldProperties,
  select: SelectProperties,
  radio: RadioProperties,
  checkbox: CheckboxProperties,
  fileUpload: FileUploadProperties,
  date: DateProperties,
  button: ButtonProperties,
  spacer: SpacerProperties,
  divider: DividerProperties,
  quiz: QuizProperties,
  countdown: CountdownProperties,
  icon: IconProperties,
  progressBar: ProgressBarProperties,
  timer: TimerProperties,
  slider: SliderElementProperties,
  calendar: CalendarProperties,
  chart: ChartProperties,
  code: CodeProperties,
  embed: EmbedProperties,
  product: ProductProperties,
  team: TeamProperties,
  testimonial: TestimonialProperties,
  faq: FaqProperties,
  list: ListProperties,
  socialProof: SocialProofProperties,
};

export const elementTypeLabels: Record<string, string> = {
  heading: "Überschrift",
  text: "Text",
  image: "Bild",
  video: "Video",
  input: "Eingabefeld",
  textarea: "Textbereich",
  select: "Dropdown",
  radio: "Auswahl",
  checkbox: "Checkbox",
  list: "Liste",
  testimonial: "Bewertung",
  faq: "FAQ",
  divider: "Trennlinie",
  spacer: "Abstand",
  timer: "Timer",
  slider: "Slider",
  button: "Button",
  audio: "Audio",
  calendar: "Kalender",
  countdown: "Countdown",
  chart: "Diagramm",
  code: "Code",
  embed: "Embed",
  product: "Produkt",
  team: "Team",
  quiz: "Quiz",
  icon: "Icon",
  progressBar: "Fortschritt",
  socialProof: "Social Proof",
  fileUpload: "Datei-Upload",
  date: "Datum",
};

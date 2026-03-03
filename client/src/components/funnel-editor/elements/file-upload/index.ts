import { registry } from "../../registry/element-registry";
import { FileUploadRender } from "./FileUploadRender";
import { FileUploadSettings } from "./FileUploadSettings";

registry.register({
  type: "fileUpload",
  label: "Datei-Upload",
  icon: "Upload",
  category: "formular",
  defaultProps: { label: "Datei hochladen" },
  defaultStyles: {},
  renderComponent: FileUploadRender,
  settingsComponent: FileUploadSettings,
});

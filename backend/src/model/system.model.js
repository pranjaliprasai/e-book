import mongoose from "mongoose";

const SystemSettingsSchema = new mongoose.Schema(
  {
    metadataEngine: { type: String, default: "Standard Semantic" },
    languageProcessing: { type: String, default: "English (Global)" },
    backupFrequency: { type: String, default: "Every 6 Hours" },
    publicPortalAccess: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    curatorDigest: { type: Boolean, default: false },
    userActivity: { type: Boolean, default: true },
    version: { type: String, default: "v2.4.8-STABLE" },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSettings", SystemSettingsSchema);

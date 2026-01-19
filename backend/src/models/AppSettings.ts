import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSettings extends Document {
  userId: string;
  displayPreferences: {
    currencyCode: string;
    dateFormat: string;
    timeZone: string;
  };
  notificationSettings: {
    dailyReminder: boolean;
    dailyReminderTime: string; // HH:mm format
    weeklyReport: boolean;
    milestoneAlerts: boolean;
    promotionalEmails: boolean;
  };
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    showLeaderboard: boolean;
    allowAnonymousStats: boolean;
  };
  securitySettings: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeout: number; // minutes
  };
  apiSettings: {
    apiKeysEnabled: boolean;
    ipWhitelist: string[];
  };
  updatedAt: Date;
}

const appSettingsSchema = new Schema<IAppSettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayPreferences: {
      currencyCode: {
        type: String,
        default: 'USD',
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
      },
      timeZone: {
        type: String,
        default: 'America/New_York',
      },
    },
    notificationSettings: {
      dailyReminder: {
        type: Boolean,
        default: true,
      },
      dailyReminderTime: {
        type: String,
        default: '09:00',
      },
      weeklyReport: {
        type: Boolean,
        default: true,
      },
      milestoneAlerts: {
        type: Boolean,
        default: true,
      },
      promotionalEmails: {
        type: Boolean,
        default: false,
      },
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'private',
      },
      showLeaderboard: {
        type: Boolean,
        default: false,
      },
      allowAnonymousStats: {
        type: Boolean,
        default: false,
      },
    },
    securitySettings: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      loginAlerts: {
        type: Boolean,
        default: true,
      },
      sessionTimeout: {
        type: Number,
        default: 30, // 30 minutes
      },
    },
    apiSettings: {
      apiKeysEnabled: {
        type: Boolean,
        default: false,
      },
      ipWhitelist: [String],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AppSettings || mongoose.model<IAppSettings>('AppSettings', appSettingsSchema);

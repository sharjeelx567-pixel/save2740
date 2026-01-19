import connectToDatabase from '@/lib/mongodb';
import User, { IUser } from '@/lib/models/User';
import Notification, { INotification } from '@/lib/models/Notification';
import AnalyticsEvent, { IAnalyticsEvent } from '@/lib/models/AnalyticsEvent';

/**
 * USER PROFILE OPERATIONS
 */

export async function getUserProfile(userId: string): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const user = await User.findOne({ userId });
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<IUser>) {
  try {
    await connectToDatabase();
    const user = await User.findOneAndUpdate({ userId }, updates, { new: true });
    return user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function createUser(userData: Partial<IUser>) {
  try {
    await connectToDatabase();
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * NOTIFICATION OPERATIONS
 */

export async function createNotification(notificationData: Partial<INotification>) {
  try {
    await connectToDatabase();
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function getUserNotifications(userId: string, limit: number = 20, unreadOnly: boolean = false) {
  try {
    await connectToDatabase();
    const query: any = { userId };
    if (unreadOnly) {
      query.read = false;
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit);
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await connectToDatabase();
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await connectToDatabase();
    const result = await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    await connectToDatabase();
    const count = await Notification.countDocuments({ userId, read: false });
    return count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
}

/**
 * ANALYTICS OPERATIONS
 */

export async function logAnalyticsEvent(eventData: Partial<IAnalyticsEvent>) {
  try {
    await connectToDatabase();
    const event = new AnalyticsEvent(eventData);
    await event.save();
    return event;
  } catch (error) {
    console.error('Error logging analytics event:', error);
    // Don't throw - analytics failures shouldn't break the app
    console.warn('Analytics event not logged - continuing');
  }
}

export async function getUserAnalyticsEvents(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  eventType?: string
) {
  try {
    await connectToDatabase();
    const query: any = { userId };

    if (eventType) {
      query.eventType = eventType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    const events = await AnalyticsEvent.find(query).sort({ createdAt: -1 }).limit(100);
    return events;
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    throw error;
  }
}

export async function getAnalyticsStats(userId: string, days: number = 30) {
  try {
    await connectToDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await AnalyticsEvent.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          successCount: {
            $sum: {
              $cond: ['$success', 1, 0],
            },
          },
          errorCount: {
            $sum: {
              $cond: [{ $not: '$success' }, 1, 0],
            },
          },
        },
      },
    ]);

    return stats;
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    throw error;
  }
}

/**
 * HELPER FUNCTIONS
 */

export async function getUserKYCStatus(userId: string): Promise<string | null> {
  try {
    const user = await getUserProfile(userId);
    return user?.kycStatus || null;
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    throw error;
  }
}

export async function getUserPreferences(userId: string) {
  try {
    const user = await getUserProfile(userId);
    return user?.preferences || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
}

import { SystemConfig } from '../models/system-config.model';
import { connectDB } from '../config/db';

/**
 * Get a system configuration value by key
 * @param key The config key
 * @param defaultValue Default value if not found
 */
export async function getSystemConfig<T>(key: string, defaultValue: T): Promise<T> {
    try {
        await connectDB();
        const config = await SystemConfig.findOne({ key });
        if (!config) return defaultValue;

        // Handle type casting based on the stored type
        const value = config.value;
        if (config.type === 'number') return Number(value) as any;
        if (config.type === 'boolean') return (value === true || value === 'true') as any;

        return value as T;
    } catch (error) {
        console.error(`Error getting system config for ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Check if payouts are globally paused
 */
export async function arePayoutsPaused(): Promise<boolean> {
    return getSystemConfig('pause_all_payouts', false);
}

/**
 * Check if contributions are globally paused
 */
export async function areContributionsPaused(): Promise<boolean> {
    return getSystemConfig('pause_all_contributions', false);
}

/**
 * Check if system is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
    return getSystemConfig('maintenance_mode', false);
}


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/db';
import Notification from '../src/models/Notification';
import { User } from '../src/models/auth.model';

dotenv.config();

const check = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Find a user
        const user = await User.findOne();
        if (!user) {
            console.log('No users found!');
            return;
        }
        console.log(`Found User: ${user._id} (${user.email})`);

        // Check notifications
        const count = await Notification.countDocuments();
        console.log(`Total Notifications: ${count}`);

        if (count === 0) {
            console.log('Creating test notification...');
            const notif = await Notification.create({
                userId: user._id.toString(), // Ensure string
                title: 'Test Notification via Script',
                message: 'This is a test notification generated directly by the backend script.',
                type: 'info',
                read: false,
                channels: {
                    push: true
                }
            });
            console.log(`Created Notification: ${notif._id}`);
        } else {
            const list = await Notification.find().limit(5);
            list.forEach(n => console.log(`- [${n.userId}] ${n.title}`));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

check();

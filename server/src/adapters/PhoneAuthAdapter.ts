import { IAuthProvider, AuthUser, LoginCredentials, RegisterData } from '../interfaces/IAuthProvider';
import UserModel from '../models/user';
import { authentication, random } from '../utils/utils';
import jwt from 'jsonwebtoken';

export class PhoneAuthAdapter implements IAuthProvider {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    private mapUserToAuthUser(user: any): AuthUser {
        return {
            id: user._id.toString(),
            phone: user.phone || '',
            username: user.username || `user_${random()}`, 
            avatar: user.avatar || "https://i.pinimg.com/736x/dc/9c/61/dc9c614e3007080a5aff36aebb949474.jpg",
            coinPoint: user.coinPoint || 0,
            questLog: {
                readingTime: user.questLog?.readingTime || 0,
                watchingTime: user.questLog?.watchingTime || 0,
                received: user.questLog?.received || [],
                finalTime: user.questLog?.finalTime || new Date(),
                hasReceivedDailyGift: user.questLog?.hasReceivedDailyGift || false
            }
        };
    }

    async login(credentials: LoginCredentials): Promise<AuthUser> {
        if (!credentials.phone || !credentials.password) {
            throw new Error('Phone and password are required');
        }

        const user = await UserModel.findOne({ phone: credentials.phone })
            .select('+authentication.salt +authentication.password');

        if (!user) {
            throw new Error('User not found');
        }

        const expectedHash = authentication(
            user.authentication?.salt || '',
            credentials.password
        );

        if (user.authentication?.password !== expectedHash) {
            throw new Error('Invalid password');
        }

        // Generate new session token
        const salt = random();
        if (!user.authentication) {
            user.authentication = {};
        }
        user.authentication.sessionToken = authentication(salt, user._id.toString());
        await user.save();

        return this.mapUserToAuthUser(user);
    }

    async register(data: RegisterData): Promise<AuthUser> {
        if (!data.phone || !data.password) {
            throw new Error('Phone and password are required');
        }

        const existingUser = await UserModel.findOne({ phone: data.phone });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const salt = random();
        const username = data.username || `user_${random()}`;

        const user = await UserModel.create({
            username,
            phone: data.phone,
            authentication: {
                password: authentication(salt, data.password),
                salt,
                sessionToken: null
            },
            avatar: "https://i.pinimg.com/736x/dc/9c/61/dc9c614e3007080a5aff36aebb949474.jpg",
            coinPoint: 0,
            bookmarkList: {
                comic: [],
                movies: []
            },
            histories: {
                readingComic: [],
                watchingMovie: []
            },
            paymentHistories: [],
            challenges: [],
            questLog: {
                readingTime: 0,
                watchingTime: 0,
                received: [],
                finalTime: new Date(),
                hasReceivedDailyGift: false
            },
            notifications: [],
            accessCommentDate: new Date()
        });

        return this.mapUserToAuthUser(user);
    }

    async verify(token: string): Promise<boolean> {
        const user = await UserModel.findOne({
            'authentication.sessionToken': token
        });
        return !!user;
    }

    async generateToken(userId: string): Promise<string> {
        return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: '24h' });
    }

    async validateToken(token: string): Promise<string | null> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
            return decoded.userId;
        } catch (error) {
            return null;
        }
    }
} 
import { sql } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  date, 
  jsonb,
  unique 
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 42 }).unique().notNull(),
  twitterUsername: varchar('twitter_username', { length: 50 }).unique(),
  twitterId: varchar('twitter_id', { length: 50 }).unique(),
  twitterAccessToken: text('twitter_access_token'),
  twitterRefreshToken: text('twitter_refresh_token'),
  bones: integer('bones').default(0),
  rank: integer('rank').default(0),
  referralCode: varchar('referral_code', { length: 4 }).unique(),
  referredBy: integer('referred_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dailyTasks = pgTable('daily_tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  shortDescription: text('short_description'),
  imageUrl: varchar('image_url', { length: 500 }),
  taskType: varchar('task_type', { length: 50 }).notNull(), // 'repost', 'like', 'follow', 'publish_tag', 'comment'
  taskData: jsonb('task_data'), // Store task-specific data
  bonesReward: integer('bones_reward').default(10),
  isRecurrent: boolean('is_recurrent').default(false),
  recurrenceType: varchar('recurrence_type', { length: 20 }).default('single_day'),
  scheduledDate: date('scheduled_date'),
  isActive: boolean('is_active').default(true),
  createdBy: varchar('created_by', { length: 42 }).notNull(), // admin wallet address
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userTaskCompletions = pgTable('user_task_completions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  taskId: integer('task_id').notNull().references(() => dailyTasks.id),
  completedAt: timestamp('completed_at').defaultNow(),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'), // 'pending', 'verified', 'failed'
  verificationData: jsonb('verification_data'), // Store verification proof
  bonesEarned: integer('bones_earned').default(0),
}, (table) => ({
  uniqueUserTaskDate: unique().on(table.userId, table.taskId, sql`DATE(${table.completedAt})`),
}));

export const referralRewards = pgTable('referral_rewards', {
  id: serial('id').primaryKey(),
  referrerId: integer('referrer_id').notNull().references(() => users.id),
  referredUserId: integer('referred_user_id').notNull().references(() => users.id),
  bonesAwarded: integer('bones_awarded').default(100),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;
export type UserTaskCompletion = typeof userTaskCompletions.$inferSelect;
export type NewUserTaskCompletion = typeof userTaskCompletions.$inferInsert;

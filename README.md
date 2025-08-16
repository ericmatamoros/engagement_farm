# Engagement Farm

A social media engagement farming platform built with Next.js, inspired by Block Stranding. Users can connect their wallets and Twitter accounts to complete daily tasks and earn BONES tokens.

## Features

### User Features
- **Wallet Connection**: Connect any Web3 wallet using RainbowKit
- **Twitter Integration**: Link Twitter account (one wallet per Twitter account)
- **Daily Tasks**: Complete various social media tasks to earn BONES
  - Like tweets
  - Repost/Retweet
  - Follow accounts
  - Post with specific hashtags
  - Comment on tweets
- **Task Verification**: Verify completed tasks to earn rewards
- **Leaderboard**: View top performers and rankings
- **User Stats**: Track personal progress and achievements
- **Referral System**: Earn bonus BONES by referring friends

### Admin Features
- **Admin Panel**: Comprehensive management dashboard
- **Task Management**: Create, edit, and schedule daily tasks
- **Task Types**: Support for various engagement types
- **Recurrent Tasks**: Set tasks to repeat daily
- **Analytics**: View platform statistics and user metrics
- **User Management**: Monitor user activity and engagement

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom cyber theme
- **Wallet Integration**: RainbowKit + Wagmi
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM
- **Authentication**: Custom wallet-based auth
- **API Integration**: Twitter API v2 for verification

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd engagement_farm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. Create a Neon database account at https://neon.tech
2. Create a new project and database
3. Copy the `database-schema.sql` file contents
4. Execute the SQL commands in your Neon database console to create all tables, indexes, and triggers

### 4. Environment Configuration

1. Copy the environment template:
```bash
cp env.example .env.local
```

2. Fill in your environment variables:

```env
# Database - Get from Neon dashboard
DATABASE_URL=postgresql://username:password@host:5432/database

# Admin Wallet - Your wallet address for admin access
ADMIN_WALLET=0x1234567890123456789012345678901234567890

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Twitter API - Get from Twitter Developer Portal
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token

# WalletConnect - Get from WalletConnect Cloud
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### 5. Twitter API Setup

1. Go to https://developer.twitter.com/
2. Create a new app with the following permissions:
   - Read tweets
   - Read users
   - Read follows
3. Generate API keys and tokens
4. Add your keys to the `.env.local` file

### 6. WalletConnect Setup

1. Go to https://cloud.walletconnect.com/
2. Create a new project
3. Copy the Project ID to your `.env.local` file

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Link Twitter**: Connect your Twitter account to start earning BONES
3. **Complete Tasks**: View daily tasks and click "Do Task" to open Twitter
4. **Verify Tasks**: After completing tasks on Twitter, click "Verify" to earn BONES
5. **Check Progress**: View your stats and ranking on the leaderboard

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (only accessible with admin wallet)
2. **Create Tasks**: Click "Create Task" to add new daily tasks
3. **Manage Tasks**: Edit, activate/deactivate, or delete existing tasks
4. **View Analytics**: Monitor platform statistics and user engagement
5. **Schedule Tasks**: Set specific dates or make tasks recurrent

## Database Schema

The application uses the following main tables:

- **users**: Store wallet addresses, Twitter connections, and BONES balances
- **daily_tasks**: Task definitions with type, rewards, and scheduling
- **user_task_completions**: Track completed tasks and verification status

See `database-schema.sql` for complete schema with indexes and triggers.

## Task Types

### Supported Task Types

1. **Like**: Users must like a specific tweet
2. **Repost**: Users must retweet/repost a specific tweet
3. **Follow**: Users must follow a specific Twitter account
4. **Publish Tag**: Users must post a tweet with a specific hashtag
5. **Comment**: Users must comment on a specific tweet

### Task Verification

The platform includes a verification system that can be integrated with Twitter API to automatically verify task completion. Currently includes placeholder verification logic that can be extended with actual Twitter API calls.

## Security Features

- **Admin Access Control**: Only designated admin wallet can access admin features
- **One Twitter Per Wallet**: Prevents multiple wallets from connecting to same Twitter account
- **Task Verification**: Prevents fake task completions
- **Rate Limiting**: Database constraints prevent duplicate task completions

## Deployment

### Production Deployment

1. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)
2. Set up production environment variables
3. Configure production database connection
4. Set up Twitter API production app
5. Update NEXTAUTH_URL to your production domain

### Environment Variables for Production

Make sure to update these for production:
- `NEXTAUTH_URL`: Your production domain
- `DATABASE_URL`: Production database connection
- `NEXTAUTH_SECRET`: Generate a secure secret
- Twitter API keys: Use production app credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

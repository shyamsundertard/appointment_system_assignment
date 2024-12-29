import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var mongooseGlobal: {
    connection: Promise<typeof mongoose> | null;
  };
}

// Connect to MongoDB
const mongooseConnect = async (): Promise<typeof mongoose> => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Return early if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }

    // Establish a new connection
    await mongoose.connect(process.env.DATABASE_URL, {
      tls: true,
      tlsAllowInvalidCertificates: true,
    });

    console.log('MongoDB connected successfully');
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if the database connection fails
  }
};

// Ensure that the connection is not being re-created on subsequent calls
if (!global.mongooseGlobal) {
  global.mongooseGlobal = {
    connection: null,
  };
}

if (!global.mongooseGlobal.connection) {
  global.mongooseGlobal.connection = mongooseConnect();
}

export default global.mongooseGlobal.connection;

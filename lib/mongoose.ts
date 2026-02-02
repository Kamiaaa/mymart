//lib/mongoose.ts
import mongoose from 'mongoose';

const connectMongo = async () => {
  if (mongoose.connections[0].readyState) {
    return; // Already connected
  }

  await mongoose.connect(process.env.MONGO_URI as string); // No options needed
};

export default connectMongo;

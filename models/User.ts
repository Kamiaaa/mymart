// models/User.ts
import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  street: { 
    type: String, 
    required: [true, 'Street address is required'],
    trim: true
  },
  city: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true
  },
  state: { 
    type: String, 
    required: [true, 'State is required'],
    trim: true
  },
  zipCode: { 
    type: String, 
    required: [true, 'ZIP code is required'],
    trim: true
  },
  country: { 
    type: String, 
    required: [true, 'Country is required'],
    default: 'Bangladesh',
    trim: true
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  label: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  phone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'customer'], // 👈 Added 'customer' to enum
    default: 'customer' // 👈 Changed default to 'customer'
  },
  phone: { 
    type: String, 
    default: '',
    trim: true
  },
  dateOfBirth: { 
    type: Date, 
    default: null 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other', ''],
    default: '' 
  },
  addresses: [AddressSchema],
  wishlist: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true 
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  preferences: {
    newsletter: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    productRecommendations: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Ensure only one default address exists
UserSchema.pre('save', function(next) {
  if (this.isModified('addresses')) {
    const defaultAddresses = this.addresses.filter((addr: any) => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Reset all to false except the first one
      this.addresses.forEach((addr: any, index: number) => {
        addr.isDefault = index === this.addresses.findIndex((a: any) => a.isDefault);
      });
    }
  }
  next();
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
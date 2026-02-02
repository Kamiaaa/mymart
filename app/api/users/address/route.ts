import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongoose';
import User from '@/models/User';
import mongoose from 'mongoose';

// Define TypeScript interfaces for address
interface UserAddress {
  _id?: mongoose.Types.ObjectId | string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  label: 'home' | 'work' | 'other';
  phone?: string;
}

interface AddressRequestBody {
  addressId?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
  label?: 'home' | 'work' | 'other';
  phone?: string;
}

// Helper function to validate address data
const validateAddressData = (data: Partial<UserAddress>) => {
  const errors: string[] = [];

  if (data.street !== undefined && (!data.street || !data.street.trim())) {
    errors.push('Street is required');
  }

  if (data.city !== undefined && (!data.city || !data.city.trim())) {
    errors.push('City is required');
  }

  if (data.state !== undefined && (!data.state || !data.state.trim())) {
    errors.push('State is required');
  }

  if (data.zipCode !== undefined) {
    if (!data.zipCode || !data.zipCode.trim()) {
      errors.push('ZIP code is required');
    } else if (!/^\d+$/.test(data.zipCode.trim())) {
      errors.push('ZIP code must contain only numbers');
    }
  }

  if (data.country !== undefined && (!data.country || !data.country.trim())) {
    errors.push('Country is required');
  }

  if (data.label !== undefined && !['home', 'work', 'other'].includes(data.label)) {
    errors.push('Label must be one of: home, work, other');
  }

  return errors;
};

// Helper function to transform addresses for response
const transformAddresses = (addresses: any[]) => {
  return addresses.map(addr => ({
    ...addr,
    _id: addr._id?.toString()
  }));
};

// GET - Get all addresses for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await connectMongo();
    
    const user = await User.findOne({ email: session.user.email })
      .select('addresses')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    const transformedAddresses = transformAddresses(user.addresses || []);

    return NextResponse.json({ 
      success: true, 
      data: { addresses: transformedAddresses } 
    });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST - Add new address
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body: AddressRequestBody = await request.json();
    const { street, city, state, zipCode, country = 'Bangladesh', isDefault = false, label = 'home', phone = '' } = body;

    // Validation
    const validationErrors = validateAddressData({
      street,
      city,
      state,
      zipCode,
      country,
      label
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    await connectMongo();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    const newAddress: UserAddress = {
      street: street!.trim(),
      city: city!.trim(),
      state: state!.trim(),
      zipCode: zipCode!.trim(),
      country: country.trim(),
      isDefault: isDefault,
      label: label!,
      phone: phone.trim()
    };

    // If setting as default, remove default from other addresses
    if (newAddress.isDefault && user.addresses.length > 0) {
      user.addresses.forEach((addr: UserAddress) => {
        addr.isDefault = false;
      });
    }

    // If no addresses exist, set as default
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    const transformedAddresses = transformAddresses(user.addresses);

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      data: { addresses: transformedAddresses }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding address:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update address
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body: AddressRequestBody = await request.json();
    const { addressId, street, city, state, zipCode, country, isDefault, label, phone } = body;

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: 'Address ID is required' }, 
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address ID format' }, 
        { status: 400 }
      );
    }

    await connectMongo();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    const addressIndex = user.addresses.findIndex((addr: UserAddress) => 
      addr._id?.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Address not found' }, 
        { status: 404 }
      );
    }

    // Validate update data
    const updateData: Partial<UserAddress> = {};
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (country !== undefined) updateData.country = country;
    if (label !== undefined) updateData.label = label;
    if (phone !== undefined) updateData.phone = phone;

    const validationErrors = validateAddressData(updateData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Update address fields
    if (street !== undefined) user.addresses[addressIndex].street = street.trim();
    if (city !== undefined) user.addresses[addressIndex].city = city.trim();
    if (state !== undefined) user.addresses[addressIndex].state = state.trim();
    if (zipCode !== undefined) user.addresses[addressIndex].zipCode = zipCode.trim();
    if (country !== undefined) user.addresses[addressIndex].country = country.trim();
    if (label !== undefined) user.addresses[addressIndex].label = label;
    if (phone !== undefined) user.addresses[addressIndex].phone = phone.trim();

    // Handle default address change
    if (isDefault !== undefined) {
      if (isDefault && user.addresses.some((addr: UserAddress, idx: number) => 
        idx !== addressIndex && addr.isDefault
      )) {
        // Remove default from other addresses
        user.addresses.forEach((addr: UserAddress, idx: number) => {
          if (idx !== addressIndex) {
            addr.isDefault = false;
          }
        });
      }
      user.addresses[addressIndex].isDefault = isDefault;
    }

    await user.save();

    const transformedAddresses = transformAddresses(user.addresses);

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses: transformedAddresses }
    });
  } catch (error: any) {
    console.error('Error updating address:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove address
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: 'Address ID is required' }, 
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address ID format' }, 
        { status: 400 }
      );
    }

    await connectMongo();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    const addressIndex = user.addresses.findIndex((addr: UserAddress) => 
      addr._id?.toString() === addressId
    );
    
    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Address not found' }, 
        { status: 404 }
      );
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address and there are other addresses, set the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const transformedAddresses = transformAddresses(user.addresses);

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: transformedAddresses }
    });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
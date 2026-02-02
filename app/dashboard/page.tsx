import Layout from "../components/Layout";
import connectMongo from "@/lib/mongoose";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";

// Define types for our stats
interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
}

// Fetch data from database
async function getDashboardStats(): Promise<DashboardStats> {
  try {
    await connectMongo();

    // Get current month and previous month for comparisons
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch total revenue and orders
    const currentMonthOrders = await Order.find({
      createdAt: { $gte: currentMonthStart }
    });
    
    const previousMonthOrders = await Order.find({
      createdAt: { 
        $gte: previousMonthStart,
        $lt: currentMonthStart
      }
    });

    // Calculate revenue
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate revenue change percentage
    const revenueChange = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Calculate orders change percentage
    const ordersChange = previousMonthOrders.length > 0
      ? ((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100
      : 0;

    // Get total customers count
    const totalCustomers = await User.countDocuments({ role: 'user' });
    
    // For customers change, we could compare with previous month
    const previousMonthCustomers = await User.countDocuments({
      createdAt: { $lt: currentMonthStart },
      role: 'user'
    });
    
    const customersChange = previousMonthCustomers > 0
      ? ((totalCustomers - previousMonthCustomers) / previousMonthCustomers) * 100
      : 0;

    return {
      totalRevenue: currentMonthRevenue,
      totalOrders: currentMonthOrders.length,
      totalCustomers,
      revenueChange: Math.round(revenueChange * 10) / 10, // Round to 1 decimal
      ordersChange: Math.round(ordersChange * 10) / 10,
      customersChange: Math.round(customersChange * 10) / 10
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      revenueChange: 0,
      ordersChange: 0,
      customersChange: 0
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className={`text-sm mt-1 ${getChangeColor(stats.revenueChange)}`}>
            {formatChange(stats.revenueChange)} from last month
          </p>
        </div>
        
        {/* Orders Card */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalOrders}
          </p>
          <p className={`text-sm mt-1 ${getChangeColor(stats.ordersChange)}`}>
            {formatChange(stats.ordersChange)} from last month
          </p>
        </div>
        
        {/* Customers Card */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalCustomers}
          </p>
          <p className={`text-sm mt-1 ${getChangeColor(stats.customersChange)}`}>
            {formatChange(stats.customersChange)} from last month
          </p>
        </div>
      </div>

      {/* Additional Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Average Order Value"
          value={formatCurrency(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)}
          description="Per order"
        />
        
        <StatsCard
          title="Products"
          value="0" // You can add product count from your database
          description="In catalog"
        />
        
        <StatsCard
          title="Conversion Rate"
          value="0%" // You can calculate this based on your analytics
          description="Overall rate"
        />
        
        <StatsCard
          title="Refund Rate"
          value="0%" // You can calculate this from cancelled orders
          description="Of total orders"
        />
      </div>
    </Layout>
  );
}

// Reusable StatsCard component
function StatsCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { exportInventoryData } from '@/lib/exportUtils';
import { useKeyboardShortcuts } from '@/lib/keyboardShortcuts';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal';

// Eco-friendly color palette
const COLORS = {
  primary: '#10b981', // Emerald green
  secondary: '#059669',
  tertiary: '#34d399',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  chart1: '#10b981',
  chart2: '#3b82f6',
  chart3: '#f59e0b',
  chart4: '#8b5cf6',
  chart5: '#ec4899',
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    // Fetch all data with error handling
    setLoading(true);
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/warehouses').then(res => res.json()),
      fetch('/api/stock').then(res => res.json()),
    ])
      .then(([productsData, warehousesData, stockData]) => {
        setProducts(productsData);
        setWarehouses(warehousesData);
        setStock(stockData);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load data. Please try again.');
        setLoading(false);
      });
  }, []);

  // Calculate total inventory value
  const totalValue = stock.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product ? product.unitCost * item.quantity : 0);
  }, 0);

  // Calculate total items in stock
  const totalItems = stock.reduce((sum, item) => sum + item.quantity, 0);

  // Get products with stock across all warehouses
  const inventoryOverview = products.map(product => {
    const productStock = stock.filter(s => s.productId === product.id);
    const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
    const stockValue = totalQuantity * product.unitCost;
    return {
      ...product,
      totalQuantity,
      stockValue,
      isLowStock: totalQuantity < product.reorderPoint,
      isCritical: totalQuantity < product.reorderPoint * 0.5,
      isOverstocked: totalQuantity > product.reorderPoint * 3,
    };
  });

  // Count stock status
  const criticalStock = inventoryOverview.filter(item => item.isCritical).length;
  const lowStock = inventoryOverview.filter(item => item.isLowStock && !item.isCritical).length;
  const adequateStock = inventoryOverview.filter(item => !item.isLowStock && !item.isOverstocked).length;
  const overstocked = inventoryOverview.filter(item => item.isOverstocked).length;

  // Prepare data for category distribution chart
  const categoryData = products.reduce((acc, product) => {
    const existing = acc.find(item => item.category === product.category);
    const productStock = stock.filter(s => s.productId === product.id);
    const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);

    if (existing) {
      existing.quantity += totalQuantity;
      existing.value += totalQuantity * product.unitCost;
    } else {
      acc.push({
        category: product.category,
        quantity: totalQuantity,
        value: totalQuantity * product.unitCost,
      });
    }
    return acc;
  }, []);

  // Prepare data for warehouse distribution chart
  const warehouseData = warehouses.map(warehouse => {
    const warehouseStock = stock.filter(s => s.warehouseId === warehouse.id);
    const totalQuantity = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
    const totalValue = warehouseStock.reduce((sum, s) => {
      const product = products.find(p => p.id === s.productId);
      return sum + (product ? product.unitCost * s.quantity : 0);
    }, 0);

    return {
      name: warehouse.name,
      location: warehouse.location,
      items: totalQuantity,
      value: totalValue,
    };
  });

  // Stock status pie chart data
  const stockStatusData = [
    { name: 'Critical', value: criticalStock, color: COLORS.danger },
    { name: 'Low Stock', value: lowStock, color: COLORS.warning },
    { name: 'Adequate', value: adequateStock, color: COLORS.primary },
    { name: 'Overstocked', value: overstocked, color: COLORS.info },
  ].filter(item => item.value > 0);

  // Get top 5 products by value
  const topProducts = [...inventoryOverview]
    .sort((a, b) => b.stockValue - a.stockValue)
    .slice(0, 5);

  // Export handlers
  const handleExportCSV = () => {
    const exportData = inventoryOverview.map(item => ({
      sku: item.sku,
      productName: item.name,
      category: item.category,
      currentStock: item.totalQuantity,
      reorderPoint: item.reorderPoint,
      stockValue: item.stockValue.toFixed(2),
      status: item.isCritical ? 'Critical' : item.isLowStock ? 'Low Stock' : item.isOverstocked ? 'Overstocked' : 'Adequate',
    }));
    exportInventoryData(exportData, 'csv');
  };

  const handleExportPDF = () => {
    const exportData = inventoryOverview.map(item => ({
      sku: item.sku,
      productName: item.name,
      category: item.category,
      currentStock: item.totalQuantity,
      reorderPoint: item.reorderPoint,
      stockValue: item.stockValue.toFixed(2),
      status: item.isCritical ? 'Critical' : item.isLowStock ? 'Low Stock' : item.isOverstocked ? 'Overstocked' : 'Adequate',
    }));
    exportInventoryData(exportData, 'pdf');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    showShortcuts: () => setShowShortcutsModal(true),
    exportCSV: handleExportCSV,
    exportPDF: handleExportPDF,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-lg text-gray-600 animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-xl text-gray-800 font-semibold">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <Navigation />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header with Quick Actions */}
        <div className="mb-6 md:mb-8 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent animate-fade-in">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Multi-Warehouse Inventory Dashboard
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products/add">
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base">
                ➕ Add Product
              </Button>
            </Link>
            <Link href="/stock/add">
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base">
                📦 Add Stock
              </Button>
            </Link>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base"
            >
              📊 Export CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base"
            >
              📄 Export PDF
            </Button>
            <Button
              onClick={() => setShowShortcutsModal(true)}
              variant="outline"
              className="border-gray-600 text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300"
              title="Keyboard Shortcuts (Ctrl+K)"
            >
              ⌨️
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Products"
            value={products.length}
            icon="📦"
            color="emerald"
            description="Active SKUs"
            trend="+12%"
          />
          <MetricCard
            title="Warehouses"
            value={warehouses.length}
            icon="🏭"
            color="blue"
            description="Distribution centers"
            trend="stable"
          />
          <MetricCard
            title="Total Items"
            value={totalItems.toLocaleString()}
            icon="📊"
            color="purple"
            description="Units in stock"
            trend="+8%"
          />
          <MetricCard
            title="Inventory Value"
            value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="💰"
            color="amber"
            description="Total stock value"
            trend="+15%"
          />
        </div>

        {/* Stock Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Critical"
            count={criticalStock}
            color="red"
            icon="🚨"
            description="Immediate action required"
          />
          <StatusCard
            title="Low Stock"
            count={lowStock}
            color="amber"
            icon="⚠️"
            description="Reorder recommended"
          />
          <StatusCard
            title="Adequate"
            count={adequateStock}
            color="emerald"
            icon="✅"
            description="Stock levels healthy"
          />
          <StatusCard
            title="Overstocked"
            count={overstocked}
            color="blue"
            icon="📈"
            description="Consider redistribution"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Warehouse Distribution Chart */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <span className="text-xl md:text-2xl">🏭</span>
                Warehouse Distribution
              </CardTitle>
              <CardDescription className="text-sm">Stock quantity and value by location</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                <BarChart data={warehouseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value, name) => {
                      if (name === 'Value ($)') return `$${value.toFixed(2)}`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="items" fill={COLORS.chart1} name="Items" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="value" fill={COLORS.chart2} name="Value ($)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stock Status Pie Chart */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <span className="text-xl md:text-2xl">📊</span>
                Stock Status Distribution
              </CardTitle>
              <CardDescription className="text-sm">Products by stock level category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <span className="text-xl md:text-2xl">📦</span>
                Category Distribution
              </CardTitle>
              <CardDescription className="text-sm">Inventory breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quantity" fill={COLORS.chart3} name="Quantity" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products by Value */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <span className="text-xl md:text-2xl">💰</span>
                Top Products by Value
              </CardTitle>
              <CardDescription className="text-sm">Highest value inventory items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${product.stockValue.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{product.totalQuantity} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Overview Table */}
        <Card className="shadow-lg border-t-4 border-t-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <span className="text-xl md:text-2xl">📋</span>
              Inventory Overview
            </CardTitle>
            <CardDescription className="text-sm">Complete product inventory across all warehouses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Product Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Total Stock</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Reorder Point</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Value</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryOverview.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-emerald-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-4 font-mono text-sm text-gray-600">{item.sku}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{item.name}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-gray-600">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">
                        {item.totalQuantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-600">
                        {item.reorderPoint.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-emerald-600">
                        ${item.stockValue.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {item.isCritical ? (
                          <Badge variant="destructive" className="shadow-sm">
                            🚨 Critical
                          </Badge>
                        ) : item.isLowStock ? (
                          <Badge className="bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-sm">
                            ⚠️ Low Stock
                          </Badge>
                        ) : item.isOverstocked ? (
                          <Badge className="bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-sm">
                            📈 Overstocked
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm">
                            ✅ Adequate
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>GreenSupply Co © 2024 - Sustainable Product Distribution</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}


// Navigation Component
function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                <span className="md:hidden">IMS</span>
                <span className="hidden md:inline">Inventory Management System</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                🏠 Dashboard
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                📦 Products
              </Button>
            </Link>
            <Link href="/warehouses">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                🏭 Warehouses
              </Button>
            </Link>
            <Link href="/stock">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                📊 Stock Levels
              </Button>
            </Link>
            <Link href="/transfers">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                🔄 Transfers
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                🔔 Alerts
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                  🏠 Dashboard
                </Button>
              </Link>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                  📦 Products
                </Button>
              </Link>
              <Link href="/warehouses" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                  🏭 Warehouses
                </Button>
              </Link>
              <Link href="/stock" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                  📊 Stock Levels
                </Button>
              </Link>
              <Link href="/transfers" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                  🔄 Transfers
                </Button>
              </Link>
              <Link href="/alerts" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                  🔔 Alerts
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, color, description, trend }) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-transparent hover:border-t-emerald-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{description}</p>
              {trend && (
                <span className={`text-xs font-semibold ${trend.includes('+') ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {trend}
                </span>
              )}
            </div>
          </div>
          <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg transform hover:scale-110 transition-transform duration-200`}>
            <span className="filter drop-shadow-md">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status Card Component
function StatusCard({ title, count, color, icon, description }) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[color]} transition-all duration-300 hover:shadow-md cursor-pointer`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{count}</p>
        </div>
        <div className="text-4xl transform hover:scale-110 transition-transform duration-200">{icon}</div>
      </div>
      <p className="text-xs opacity-70 mt-2">{description}</p>
    </div>
  );
}
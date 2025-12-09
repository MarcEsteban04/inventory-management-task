import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TransfersPage() {
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: '',
        notes: '',
    });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [transfersRes, productsRes, warehousesRes, stockRes] = await Promise.all([
                fetch('/api/transfers'),
                fetch('/api/products'),
                fetch('/api/warehouses'),
                fetch('/api/stock'),
            ]);

            const [transfersData, productsData, warehousesData, stockData] = await Promise.all([
                transfersRes.json(),
                productsRes.json(),
                warehousesRes.json(),
                stockRes.json(),
            ]);

            setTransfers(transfersData);
            setProducts(productsData);
            setWarehouses(warehousesData);
            setStock(stockData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const getAvailableStock = (productId, warehouseId) => {
        if (!productId || !warehouseId) return 0;
        const stockItem = stock.find(
            s => s.productId === parseInt(productId) && s.warehouseId === parseInt(warehouseId)
        );
        return stockItem?.quantity || 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setSubmitting(true);

        try {
            const response = await fetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create transfer');
            }

            setFormSuccess('Transfer completed successfully!');
            setFormData({
                productId: '',
                fromWarehouseId: '',
                toWarehouseId: '',
                quantity: '',
                notes: '',
            });
            setShowForm(false);

            // Refresh data
            await fetchData();

            // Clear success message after 3 seconds
            setTimeout(() => setFormSuccess(''), 3000);
        } catch (error) {
            setFormError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const availableStock = getAvailableStock(formData.productId, formData.fromWarehouseId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
            <Navigation />

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            Stock Transfers
                        </h1>
                        <p className="text-gray-600">
                            Move inventory between warehouse locations
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        {showForm ? '❌ Cancel' : '➕ New Transfer'}
                    </Button>
                </div>

                {/* Success Message */}
                {formSuccess && (
                    <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-lg shadow-md animate-fade-in">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <p className="font-semibold">{formSuccess}</p>
                        </div>
                    </div>
                )}

                {/* Transfer Form */}
                {showForm && (
                    <Card className="mb-8 shadow-xl border-t-4 border-t-emerald-500 animate-fade-in">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🔄</span>
                                Create Stock Transfer
                            </CardTitle>
                            <CardDescription>Transfer inventory from one warehouse to another</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {formError && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⚠️</span>
                                            <p className="font-semibold">{formError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Product Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Product *
                                        </label>
                                        <select
                                            name="productId"
                                            value={formData.productId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        >
                                            <option value="">Select a product...</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.sku} - {product.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Quantity *
                                            {formData.fromWarehouseId && formData.productId && (
                                                <span className="ml-2 text-xs font-normal text-gray-500">
                                                    (Available: {availableStock})
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            max={availableStock || undefined}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                            placeholder="Enter quantity"
                                        />
                                    </div>

                                    {/* From Warehouse */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            From Warehouse *
                                        </label>
                                        <select
                                            name="fromWarehouseId"
                                            value={formData.fromWarehouseId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        >
                                            <option value="">Select source warehouse...</option>
                                            {warehouses.map(warehouse => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name} ({warehouse.location})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* To Warehouse */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            To Warehouse *
                                        </label>
                                        <select
                                            name="toWarehouseId"
                                            value={formData.toWarehouseId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        >
                                            <option value="">Select destination warehouse...</option>
                                            {warehouses
                                                .filter(w => w.id !== parseInt(formData.fromWarehouseId))
                                                .map(warehouse => (
                                                    <option key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name} ({warehouse.location})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                        placeholder="Add any notes about this transfer..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? '⏳ Processing...' : '✅ Complete Transfer'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setFormError('');
                                            setFormData({
                                                productId: '',
                                                fromWarehouseId: '',
                                                toWarehouseId: '',
                                                quantity: '',
                                                notes: '',
                                            });
                                        }}
                                        variant="outline"
                                        className="px-8 border-gray-300 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Transfer History */}
                <Card className="shadow-lg border-t-4 border-t-emerald-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">📜</span>
                            Transfer History
                        </CardTitle>
                        <CardDescription>
                            Complete record of all stock transfers ({transfers.length} total)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                                    <p className="mt-4 text-gray-600">Loading transfers...</p>
                                </div>
                            </div>
                        ) : transfers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📦</div>
                                <p className="text-xl text-gray-600 font-semibold mb-2">No transfers yet</p>
                                <p className="text-gray-500">Create your first stock transfer to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Product</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700">From</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700">To</th>
                                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Quantity</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Notes</th>
                                            <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transfers.map((transfer) => (
                                            <tr
                                                key={transfer.id}
                                                className="border-b border-gray-100 hover:bg-emerald-50 transition-colors duration-150"
                                            >
                                                <td className="py-4 px-4 text-sm text-gray-600">
                                                    {new Date(transfer.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{transfer.productName}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{transfer.productSku}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="outline" className="text-gray-600">
                                                        🏭 {transfer.fromWarehouseName}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="outline" className="text-gray-600">
                                                        🏭 {transfer.toWarehouseName}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-emerald-600 text-lg">
                                                        {transfer.quantity.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                                                    {transfer.notes || '-'}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <Badge className="bg-emerald-500 text-white border-emerald-600 shadow-sm">
                                                        ✅ Completed
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Stock Transfer Management System</p>
                </div>
            </main>
        </div>
    );
}

// Navigation Component
function Navigation() {
    return (
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="text-3xl">🌱</div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">GreenSupply Co</h1>
                            <p className="text-xs text-gray-500">Sustainable Distribution</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
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
                            <Button variant="ghost" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200">
                                🔄 Transfers
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

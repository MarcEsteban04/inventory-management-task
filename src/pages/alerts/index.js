import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, critical, high, medium, low
    const [showAcknowledged, setShowAcknowledged] = useState(false);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/alerts');
            const data = await response.json();
            setAlerts(data);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (productId) => {
        try {
            await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, acknowledgedBy: 'Manager' }),
            });
            await fetchAlerts();
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const handleUnacknowledge = async (productId) => {
        try {
            await fetch(`/api/alerts?productId=${productId}`, {
                method: 'DELETE',
            });
            await fetchAlerts();
        } catch (error) {
            console.error('Failed to unacknowledge alert:', error);
        }
    };

    // Filter alerts
    const filteredAlerts = alerts.filter(alert => {
        const severityMatch = filter === 'all' || alert.severity === filter;
        const acknowledgedMatch = showAcknowledged ? true : !alert.acknowledged;
        return severityMatch && acknowledgedMatch;
    });

    // Calculate statistics
    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    const highCount = alerts.filter(a => a.severity === 'high' && !a.acknowledged).length;
    const mediumCount = alerts.filter(a => a.severity === 'medium' && !a.acknowledged).length;
    const totalReorderCost = alerts
        .filter(a => a.reorderQuantity > 0 && !a.acknowledged)
        .reduce((sum, a) => sum + a.estimatedCost, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
            <Navigation />

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        Stock Alerts & Reorder Management
                    </h1>
                    <p className="text-gray-600">
                        Monitor inventory levels and manage reorder recommendations
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Critical Alerts"
                        count={criticalCount}
                        icon="🚨"
                        color="red"
                        description="Immediate action required"
                    />
                    <StatCard
                        title="Low Stock"
                        count={highCount}
                        icon="⚠️"
                        color="amber"
                        description="Reorder recommended"
                    />
                    <StatCard
                        title="Overstocked"
                        count={mediumCount}
                        icon="📈"
                        color="blue"
                        description="Consider redistribution"
                    />
                    <StatCard
                        title="Reorder Cost"
                        count={`$${totalReorderCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        icon="💰"
                        color="emerald"
                        description="Estimated total cost"
                    />
                </div>

                {/* Filters */}
                <Card className="mb-6 shadow-lg border-t-4 border-t-emerald-500">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => setFilter('all')}
                                    variant={filter === 'all' ? 'default' : 'outline'}
                                    className={filter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                >
                                    All ({alerts.length})
                                </Button>
                                <Button
                                    onClick={() => setFilter('critical')}
                                    variant={filter === 'critical' ? 'default' : 'outline'}
                                    className={filter === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
                                >
                                    🚨 Critical ({alerts.filter(a => a.severity === 'critical').length})
                                </Button>
                                <Button
                                    onClick={() => setFilter('high')}
                                    variant={filter === 'high' ? 'default' : 'outline'}
                                    className={filter === 'high' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                                >
                                    ⚠️ Low Stock ({alerts.filter(a => a.severity === 'high').length})
                                </Button>
                                <Button
                                    onClick={() => setFilter('medium')}
                                    variant={filter === 'medium' ? 'default' : 'outline'}
                                    className={filter === 'medium' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                >
                                    📈 Overstocked ({alerts.filter(a => a.severity === 'medium').length})
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showAcknowledged"
                                    checked={showAcknowledged}
                                    onChange={(e) => setShowAcknowledged(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="showAcknowledged" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Show Acknowledged
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Loading alerts...</p>
                        </div>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <Card className="shadow-lg">
                        <CardContent className="p-12 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <p className="text-xl text-gray-600 font-semibold mb-2">No alerts found</p>
                            <p className="text-gray-500">
                                {showAcknowledged
                                    ? 'No alerts match the current filter'
                                    : 'All alerts have been acknowledged or stock levels are healthy'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredAlerts.map((alert) => (
                            <AlertCard
                                key={alert.productId}
                                alert={alert}
                                onAcknowledge={handleAcknowledge}
                                onUnacknowledge={handleUnacknowledge}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

// Alert Card Component
function AlertCard({ alert, onAcknowledge, onUnacknowledge }) {
    const severityColors = {
        critical: 'border-red-500 bg-red-50',
        high: 'border-amber-500 bg-amber-50',
        medium: 'border-blue-500 bg-blue-50',
        low: 'border-gray-300 bg-gray-50',
    };

    const severityBadges = {
        critical: <Badge className="bg-red-500 text-white border-red-600">🚨 Critical</Badge>,
        high: <Badge className="bg-amber-500 text-white border-amber-600">⚠️ Low Stock</Badge>,
        medium: <Badge className="bg-blue-500 text-white border-blue-600">📈 Overstocked</Badge>,
        low: <Badge className="bg-emerald-500 text-white border-emerald-600">✅ Adequate</Badge>,
    };

    return (
        <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${severityColors[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left Section - Product Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-gray-900">{alert.productName}</h3>
                                    {severityBadges[alert.severity]}
                                    {alert.acknowledged && (
                                        <Badge variant="outline" className="text-gray-500">
                                            ✓ Acknowledged
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="font-mono">{alert.productSku}</span>
                                    <Badge variant="outline">{alert.category}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Stock Information */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{alert.currentStock.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Reorder Point</p>
                                <p className="text-2xl font-bold text-gray-700">{alert.reorderPoint.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Recommended Qty</p>
                                <p className="text-2xl font-bold text-emerald-600">{alert.reorderQuantity.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Estimated Cost</p>
                                <p className="text-2xl font-bold text-amber-600">${alert.estimatedCost.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Recommended Action */}
                        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Recommended Action:</p>
                            <p className="text-gray-900">{alert.recommendedAction}</p>
                        </div>

                        {/* Warehouse Breakdown */}
                        {alert.warehouseBreakdown.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Warehouse Breakdown:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {alert.warehouseBreakdown.map((wh, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{wh.warehouseName}</p>
                                                <p className="text-xs text-gray-500">{wh.warehouseLocation}</p>
                                            </div>
                                            <p className="text-lg font-bold text-gray-700">{wh.quantity.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Acknowledged Info */}
                        {alert.acknowledged && alert.acknowledgedAt && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
                                <p className="text-xs text-gray-600">
                                    Acknowledged by <span className="font-semibold">{alert.acknowledgedBy}</span> on{' '}
                                    {new Date(alert.acknowledgedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2 lg:w-48">
                        {!alert.acknowledged ? (
                            <Button
                                onClick={() => onAcknowledge(alert.productId)}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                            >
                                ✓ Acknowledge
                            </Button>
                        ) : (
                            <Button
                                onClick={() => onUnacknowledge(alert.productId)}
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-50"
                            >
                                ↺ Unacknowledge
                            </Button>
                        )}
                        <Link href={`/products/edit/${alert.productId}`}>
                            <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                                📝 Edit Product
                            </Button>
                        </Link>
                        <Link href="/transfers">
                            <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                                🔄 Transfer Stock
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Stat Card Component
function StatCard({ title, count, icon, color, description }) {
    const colorClasses = {
        red: 'bg-red-50 border-red-200 text-red-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    };

    return (
        <div className={`border-2 rounded-lg p-4 ${colorClasses[color]} transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <p className="text-3xl font-bold mt-1">{count}</p>
                </div>
                <div className="text-4xl">{icon}</div>
            </div>
            <p className="text-xs opacity-70 mt-2">{description}</p>
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
                            <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200">
                                🔄 Transfers
                            </Button>
                        </Link>
                        <Link href="/alerts">
                            <Button variant="ghost" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200">
                                🔔 Alerts
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

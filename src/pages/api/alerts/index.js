import fs from 'fs';
import path from 'path';

// Helper function to read JSON file
const readJSONFile = (filename) => {
    const filePath = path.join(process.cwd(), 'data', filename);
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
};

// Helper function to write JSON file
const writeJSONFile = (filename, data) => {
    const filePath = path.join(process.cwd(), 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export default function handler(req, res) {
    if (req.method === 'GET') {
        // Get all alerts with calculated stock status
        try {
            const products = readJSONFile('products.json');
            const stock = readJSONFile('stock.json');
            const warehouses = readJSONFile('warehouses.json');
            const alerts = readJSONFile('alerts.json');

            // Calculate stock status for each product
            const productAlerts = products.map(product => {
                // Get all stock for this product across warehouses
                const productStock = stock.filter(s => s.productId === product.id);
                const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);

                // Calculate stock status
                const reorderPoint = product.reorderPoint;
                const criticalThreshold = reorderPoint * 0.5;
                const overstockThreshold = reorderPoint * 3;

                let status = 'adequate';
                let severity = 'low';
                let recommendedAction = 'No action needed';
                let reorderQuantity = 0;

                if (totalQuantity < criticalThreshold) {
                    status = 'critical';
                    severity = 'critical';
                    recommendedAction = 'URGENT: Immediate reorder required';
                    reorderQuantity = Math.ceil((reorderPoint * 2) - totalQuantity);
                } else if (totalQuantity < reorderPoint) {
                    status = 'low';
                    severity = 'high';
                    recommendedAction = 'Reorder recommended';
                    reorderQuantity = Math.ceil((reorderPoint * 1.5) - totalQuantity);
                } else if (totalQuantity > overstockThreshold) {
                    status = 'overstocked';
                    severity = 'medium';
                    recommendedAction = 'Consider redistribution or promotion';
                    reorderQuantity = 0;
                } else {
                    status = 'adequate';
                    severity = 'low';
                    recommendedAction = 'Stock levels healthy';
                    reorderQuantity = 0;
                }

                // Get warehouse breakdown
                const warehouseBreakdown = productStock.map(s => {
                    const warehouse = warehouses.find(w => w.id === s.warehouseId);
                    return {
                        warehouseId: s.warehouseId,
                        warehouseName: warehouse?.name || 'Unknown',
                        warehouseLocation: warehouse?.location || 'Unknown',
                        quantity: s.quantity,
                    };
                });

                // Check if alert has been acknowledged
                const alertRecord = alerts.find(a => a.productId === product.id);
                const acknowledged = alertRecord?.acknowledged || false;
                const acknowledgedAt = alertRecord?.acknowledgedAt || null;
                const acknowledgedBy = alertRecord?.acknowledgedBy || null;

                return {
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    category: product.category,
                    unitCost: product.unitCost,
                    currentStock: totalQuantity,
                    reorderPoint: reorderPoint,
                    status,
                    severity,
                    recommendedAction,
                    reorderQuantity,
                    estimatedCost: reorderQuantity * product.unitCost,
                    warehouseBreakdown,
                    acknowledged,
                    acknowledgedAt,
                    acknowledgedBy,
                };
            });

            // Sort by severity: critical > high > medium > low
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            productAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

            res.status(200).json(productAlerts);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    } else if (req.method === 'POST') {
        // Acknowledge an alert
        try {
            const { productId, acknowledgedBy } = req.body;

            if (!productId) {
                return res.status(400).json({ error: 'Product ID is required' });
            }

            const alerts = readJSONFile('alerts.json');

            // Find existing alert or create new one
            const existingAlertIndex = alerts.findIndex(a => a.productId === parseInt(productId));

            const alertData = {
                productId: parseInt(productId),
                acknowledged: true,
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: acknowledgedBy || 'System',
            };

            if (existingAlertIndex >= 0) {
                alerts[existingAlertIndex] = alertData;
            } else {
                alerts.push(alertData);
            }

            writeJSONFile('alerts.json', alerts);

            res.status(200).json({ message: 'Alert acknowledged successfully', alert: alertData });
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            res.status(500).json({ error: 'Failed to acknowledge alert' });
        }
    } else if (req.method === 'DELETE') {
        // Unacknowledge an alert
        try {
            const { productId } = req.query;

            if (!productId) {
                return res.status(400).json({ error: 'Product ID is required' });
            }

            const alerts = readJSONFile('alerts.json');
            const filteredAlerts = alerts.filter(a => a.productId !== parseInt(productId));

            writeJSONFile('alerts.json', filteredAlerts);

            res.status(200).json({ message: 'Alert unacknowledged successfully' });
        } catch (error) {
            console.error('Error unacknowledging alert:', error);
            res.status(500).json({ error: 'Failed to unacknowledge alert' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

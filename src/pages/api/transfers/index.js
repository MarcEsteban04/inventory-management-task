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
        // Get all transfers
        try {
            const transfers = readJSONFile('transfers.json');
            const products = readJSONFile('products.json');
            const warehouses = readJSONFile('warehouses.json');

            // Enrich transfers with product and warehouse details
            const enrichedTransfers = transfers.map(transfer => {
                const product = products.find(p => p.id === transfer.productId);
                const fromWarehouse = warehouses.find(w => w.id === transfer.fromWarehouseId);
                const toWarehouse = warehouses.find(w => w.id === transfer.toWarehouseId);

                return {
                    ...transfer,
                    productName: product?.name || 'Unknown Product',
                    productSku: product?.sku || 'N/A',
                    fromWarehouseName: fromWarehouse?.name || 'Unknown Warehouse',
                    toWarehouseName: toWarehouse?.name || 'Unknown Warehouse',
                };
            });

            // Sort by date (newest first)
            enrichedTransfers.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.status(200).json(enrichedTransfers);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read transfers' });
        }
    } else if (req.method === 'POST') {
        // Create new transfer
        try {
            const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

            // Validation
            if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (fromWarehouseId === toWarehouseId) {
                return res.status(400).json({ error: 'Source and destination warehouses must be different' });
            }

            if (quantity <= 0) {
                return res.status(400).json({ error: 'Quantity must be greater than 0' });
            }

            // Read current data
            const transfers = readJSONFile('transfers.json');
            const stock = readJSONFile('stock.json');
            const products = readJSONFile('products.json');
            const warehouses = readJSONFile('warehouses.json');

            // Verify product exists
            const product = products.find(p => p.id === parseInt(productId));
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Verify warehouses exist
            const fromWarehouse = warehouses.find(w => w.id === parseInt(fromWarehouseId));
            const toWarehouse = warehouses.find(w => w.id === parseInt(toWarehouseId));

            if (!fromWarehouse || !toWarehouse) {
                return res.status(404).json({ error: 'Warehouse not found' });
            }

            // Check if source warehouse has enough stock
            const sourceStock = stock.find(
                s => s.productId === parseInt(productId) && s.warehouseId === parseInt(fromWarehouseId)
            );

            if (!sourceStock || sourceStock.quantity < parseInt(quantity)) {
                return res.status(400).json({
                    error: `Insufficient stock in ${fromWarehouse.name}. Available: ${sourceStock?.quantity || 0}, Requested: ${quantity}`
                });
            }

            // Create new transfer
            const newTransfer = {
                id: transfers.length > 0 ? Math.max(...transfers.map(t => t.id)) + 1 : 1,
                productId: parseInt(productId),
                fromWarehouseId: parseInt(fromWarehouseId),
                toWarehouseId: parseInt(toWarehouseId),
                quantity: parseInt(quantity),
                notes: notes || '',
                date: new Date().toISOString(),
                status: 'completed',
            };

            // Update stock levels
            // Decrease stock in source warehouse
            sourceStock.quantity -= parseInt(quantity);

            // Increase stock in destination warehouse (or create new stock entry)
            const destStock = stock.find(
                s => s.productId === parseInt(productId) && s.warehouseId === parseInt(toWarehouseId)
            );

            if (destStock) {
                destStock.quantity += parseInt(quantity);
            } else {
                // Create new stock entry for destination warehouse
                const newStockId = stock.length > 0 ? Math.max(...stock.map(s => s.id)) + 1 : 1;
                stock.push({
                    id: newStockId,
                    productId: parseInt(productId),
                    warehouseId: parseInt(toWarehouseId),
                    quantity: parseInt(quantity),
                });
            }

            // Save updated data
            transfers.push(newTransfer);
            writeJSONFile('transfers.json', transfers);
            writeJSONFile('stock.json', stock);

            // Return enriched transfer
            const enrichedTransfer = {
                ...newTransfer,
                productName: product.name,
                productSku: product.sku,
                fromWarehouseName: fromWarehouse.name,
                toWarehouseName: toWarehouse.name,
            };

            res.status(201).json(enrichedTransfer);
        } catch (error) {
            console.error('Transfer error:', error);
            res.status(500).json({ error: 'Failed to create transfer' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

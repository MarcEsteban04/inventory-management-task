import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Array of column definitions {key, label}
 */
export const exportToCSV = (data, filename, columns) => {
    try {
        // Create CSV header
        const headers = columns.map(col => col.label).join(',');

        // Create CSV rows
        const rows = data.map(item => {
            return columns.map(col => {
                let value = item[col.key];

                // Handle different data types
                if (value === null || value === undefined) {
                    value = '';
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                } else if (typeof value === 'string' && value.includes(',')) {
                    value = `"${value}"`;
                }

                return value;
            }).join(',');
        }).join('\n');

        // Combine header and rows
        const csv = `${headers}\n${rows}`;

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        return false;
    }
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Array of column definitions {key, label}
 * @param {string} title - Title of the PDF document
 */
export const exportToPDF = (data, filename, columns, title) => {
    try {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 22);

        // Add timestamp
        doc.setFontSize(10);
        doc.setTextColor(100);
        const timestamp = new Date().toLocaleString();
        doc.text(`Generated: ${timestamp}`, 14, 30);

        // Prepare table data
        const tableColumns = columns.map(col => col.label);
        const tableRows = data.map(item => {
            return columns.map(col => {
                let value = item[col.key];

                // Handle different data types
                if (value === null || value === undefined) {
                    return '';
                } else if (typeof value === 'object') {
                    return JSON.stringify(value);
                } else if (typeof value === 'number') {
                    return value.toLocaleString();
                }

                return String(value);
            });
        });


        // Add table using autoTable
        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 35,
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [16, 185, 129], // Emerald color
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
            margin: { top: 35 },
        });

        // Add footer with page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save PDF
        doc.save(`${filename}.pdf`);

        return true;
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        return false;
    }
};

/**
 * Export inventory data with custom formatting
 */
export const exportInventoryData = (data, format = 'csv') => {
    const columns = [
        { key: 'sku', label: 'SKU' },
        { key: 'productName', label: 'Product Name' },
        { key: 'category', label: 'Category' },
        { key: 'currentStock', label: 'Current Stock' },
        { key: 'reorderPoint', label: 'Reorder Point' },
        { key: 'stockValue', label: 'Stock Value ($)' },
        { key: 'status', label: 'Status' },
    ];

    const filename = `inventory-report-${new Date().toISOString().split('T')[0]}`;
    const title = 'Inventory Management Report';

    if (format === 'csv') {
        return exportToCSV(data, filename, columns);
    } else if (format === 'pdf') {
        return exportToPDF(data, filename, columns, title);
    }

    return false;
};

/**
 * Export transfer history data
 */
export const exportTransferData = (data, format = 'csv') => {
    const columns = [
        { key: 'date', label: 'Date' },
        { key: 'productName', label: 'Product' },
        { key: 'productSku', label: 'SKU' },
        { key: 'fromWarehouseName', label: 'From Warehouse' },
        { key: 'toWarehouseName', label: 'To Warehouse' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'notes', label: 'Notes' },
        { key: 'status', label: 'Status' },
    ];

    // Format dates for export
    const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleString(),
    }));

    const filename = `transfer-history-${new Date().toISOString().split('T')[0]}`;
    const title = 'Stock Transfer History';

    if (format === 'csv') {
        return exportToCSV(formattedData, filename, columns);
    } else if (format === 'pdf') {
        return exportToPDF(formattedData, filename, columns, title);
    }

    return false;
};

/**
 * Export alerts data
 */
export const exportAlertsData = (data, format = 'csv') => {
    const columns = [
        { key: 'productSku', label: 'SKU' },
        { key: 'productName', label: 'Product Name' },
        { key: 'category', label: 'Category' },
        { key: 'currentStock', label: 'Current Stock' },
        { key: 'reorderPoint', label: 'Reorder Point' },
        { key: 'status', label: 'Status' },
        { key: 'severity', label: 'Severity' },
        { key: 'reorderQuantity', label: 'Recommended Qty' },
        { key: 'estimatedCost', label: 'Estimated Cost ($)' },
        { key: 'recommendedAction', label: 'Recommended Action' },
    ];

    const filename = `stock-alerts-${new Date().toISOString().split('T')[0]}`;
    const title = 'Stock Alerts & Reorder Recommendations';

    if (format === 'csv') {
        return exportToCSV(data, filename, columns);
    } else if (format === 'pdf') {
        return exportToPDF(data, filename, columns, title);
    }

    return false;
};

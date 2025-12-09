import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Global keyboard shortcuts for the application
 * Usage: Add useKeyboardShortcuts() to your component
 */
export const useKeyboardShortcuts = (customHandlers = {}) => {
    const router = useRouter();

    useEffect(() => {
        const handleKeyPress = (event) => {
            // Check if user is typing in an input field
            const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
                event.target.tagName
            );

            // Don't trigger shortcuts when typing in input fields
            if (isInputField && !event.ctrlKey && !event.metaKey) {
                return;
            }

            // Global navigation shortcuts (Ctrl/Cmd + Key)
            if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 'h':
                        event.preventDefault();
                        router.push('/');
                        break;
                    case 'p':
                        event.preventDefault();
                        router.push('/products');
                        break;
                    case 'w':
                        event.preventDefault();
                        router.push('/warehouses');
                        break;
                    case 's':
                        event.preventDefault();
                        router.push('/stock');
                        break;
                    case 't':
                        event.preventDefault();
                        router.push('/transfers');
                        break;
                    case 'a':
                        event.preventDefault();
                        router.push('/alerts');
                        break;
                    case 'k':
                        event.preventDefault();
                        // Show keyboard shortcuts modal
                        if (customHandlers.showShortcuts) {
                            customHandlers.showShortcuts();
                        }
                        break;
                    case 'e':
                        event.preventDefault();
                        // Export functionality
                        if (customHandlers.exportCSV) {
                            customHandlers.exportCSV();
                        }
                        break;
                    case 'shift':
                        if (event.shiftKey && event.key === 'E') {
                            event.preventDefault();
                            // Export as PDF
                            if (customHandlers.exportPDF) {
                                customHandlers.exportPDF();
                            }
                        }
                        break;
                    default:
                        break;
                }
            }

            // Other shortcuts (without Ctrl/Cmd)
            if (!event.ctrlKey && !event.metaKey && !isInputField) {
                switch (event.key.toLowerCase()) {
                    case '?':
                        event.preventDefault();
                        // Show help/shortcuts
                        if (customHandlers.showShortcuts) {
                            customHandlers.showShortcuts();
                        }
                        break;
                    case 'n':
                        event.preventDefault();
                        // New item (context-dependent)
                        if (customHandlers.newItem) {
                            customHandlers.newItem();
                        }
                        break;
                    case 'escape':
                        event.preventDefault();
                        // Close modals/forms
                        if (customHandlers.closeModal) {
                            customHandlers.closeModal();
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyPress);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [router, customHandlers]);
};

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = [
    {
        category: 'Navigation',
        shortcuts: [
            { keys: ['Ctrl', 'H'], description: 'Go to Dashboard' },
            { keys: ['Ctrl', 'P'], description: 'Go to Products' },
            { keys: ['Ctrl', 'W'], description: 'Go to Warehouses' },
            { keys: ['Ctrl', 'S'], description: 'Go to Stock Levels' },
            { keys: ['Ctrl', 'T'], description: 'Go to Transfers' },
            { keys: ['Ctrl', 'A'], description: 'Go to Alerts' },
        ],
    },
    {
        category: 'Actions',
        shortcuts: [
            { keys: ['N'], description: 'Create New Item' },
            { keys: ['Ctrl', 'E'], description: 'Export as CSV' },
            { keys: ['Ctrl', 'Shift', 'E'], description: 'Export as PDF' },
            { keys: ['Esc'], description: 'Close Modal/Form' },
        ],
    },
    {
        category: 'Help',
        shortcuts: [
            { keys: ['Ctrl', 'K'], description: 'Show Keyboard Shortcuts' },
            { keys: ['?'], description: 'Show Help' },
        ],
    },
];

/**
 * Format keyboard shortcut for display
 */
export const formatShortcut = (keys) => {
    return keys
        .map(key => {
            // Replace Ctrl with Cmd on Mac
            if (key === 'Ctrl' && navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
                return '⌘';
            }
            if (key === 'Shift') return '⇧';
            if (key === 'Esc') return 'Esc';
            return key;
        })
        .join(' + ');
};

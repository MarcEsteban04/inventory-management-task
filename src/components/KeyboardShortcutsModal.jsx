import { KEYBOARD_SHORTCUTS, formatShortcut } from '@/lib/keyboardShortcuts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                ⌨️ Keyboard Shortcuts
                            </CardTitle>
                            <CardDescription>
                                Boost your productivity with these keyboard shortcuts
                            </CardDescription>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {KEYBOARD_SHORTCUTS.map((category, index) => (
                            <div key={index}>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    {category.category}
                                </h3>
                                <div className="space-y-2">
                                    {category.shortcuts.map((shortcut, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="text-gray-700">{shortcut.description}</span>
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, keyIdx) => (
                                                    <span key={keyIdx} className="flex items-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono text-sm px-3 py-1 bg-white border-gray-300"
                                                        >
                                                            {formatShortcut([key])}
                                                        </Badge>
                                                        {keyIdx < shortcut.keys.length - 1 && (
                                                            <span className="mx-1 text-gray-400">+</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-sm text-emerald-800">
                            <strong>💡 Tip:</strong> Press <Badge variant="outline" className="mx-1 font-mono">Ctrl</Badge> +
                            <Badge variant="outline" className="mx-1 font-mono">K</Badge> or
                            <Badge variant="outline" className="mx-1 font-mono">?</Badge> anytime to view these shortcuts.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

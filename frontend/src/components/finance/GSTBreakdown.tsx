import React from 'react';

interface GSTBreakup {
    cgst: number;
    sgst: number;
    igst: number;
    utgst?: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    totalGst?: number;
    isInterState?: boolean;
}

interface GSTBreakdownProps {
    gstBreakup?: GSTBreakup;
    subtotal: number;
    shippingCharges: number;
    total: number;
    isVisible: boolean;
    className?: string;
}

const GSTBreakdown: React.FC<GSTBreakdownProps> = ({
    gstBreakup,
    subtotal,
    shippingCharges,
    total,
    isVisible,
    className = ''
}) => {
    if (!isVisible) return null;

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const hasGST = gstBreakup && (gstBreakup.cgst > 0 || gstBreakup.sgst > 0 || gstBreakup.igst > 0);

    return (
        <div className={`space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <i className="fas fa-money-bill-wave mr-2"></i>
                Tax Calculation Breakdown
            </h4>

            <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700">Subtotal (Before Tax):</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>

                {/* Shipping Charges */}
                {shippingCharges > 0 && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-700">Shipping Charges:</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(shippingCharges)}</span>
                    </div>
                )}

                {/* Taxable Amount */}
                <div className="flex justify-between items-center py-2 border-t border-gray-300">
                    <span className="text-sm font-medium text-gray-700">Taxable Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal + shippingCharges)}</span>
                </div>

                {/* GST Breakdown */}
                {hasGST ? (
                    <div className="space-y-2 bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-800 flex items-center">
                            <i className="fas fa-university mr-2"></i>
                            GST Breakdown
                        </h5>
                        
                        {gstBreakup!.cgst > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">
                                    CGST ({gstBreakup!.cgstRate || 9}%):
                                </span>
                                <span className="text-xs font-medium text-green-600">
                                    +{formatCurrency(gstBreakup!.cgst)}
                                </span>
                            </div>
                        )}
                        
                        {gstBreakup!.sgst > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">
                                    SGST ({gstBreakup!.sgstRate || 9}%):
                                </span>
                                <span className="text-xs font-medium text-green-600">
                                    +{formatCurrency(gstBreakup!.sgst)}
                                </span>
                            </div>
                        )}
                        
                        {gstBreakup!.igst > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">
                                    IGST ({gstBreakup!.igstRate || 18}%):
                                </span>
                                <span className="text-xs font-medium text-green-600">
                                    +{formatCurrency(gstBreakup!.igst)}
                                </span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-xs font-semibold text-gray-700">Total GST:</span>
                            <span className="text-xs font-semibold text-green-600">
                                +{formatCurrency(gstBreakup!.totalGst || (gstBreakup!.cgst + gstBreakup!.sgst + gstBreakup!.igst + (gstBreakup!.utgst || 0)))}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-center">
                            <i className="fas fa-info-circle mr-2"></i>
                            <span className="text-sm text-yellow-800">
                                {gstBreakup ? 'Tax-exempt invoice (0% GST)' : 'Tax calculation disabled'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Final Total */}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-400 bg-indigo-50 rounded px-3">
                    <span className="text-lg font-bold text-gray-900">Final Total:</span>
                    <span className="text-lg font-bold text-indigo-600">{formatCurrency(total)}</span>
                </div>

                {/* Transaction Type Indicator */}
                {gstBreakup && (
                    <div className="text-center pt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {gstBreakup.isInterState ? (
                                <>
                                    <i className="fas fa-globe mr-1"></i> Inter-State Transaction
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-home mr-1"></i> Intra-State Transaction
                                </>
                            )}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GSTBreakdown;

import { PaymentReceipt, IPaymentReceipt } from '../models/payment-receipt.model';
import { Transaction } from '../models/transaction.model';
import { User } from '../models/auth.model';

/**
 * Receipt Generation Service
 * Generates and manages payment receipts
 */
export class ReceiptService {
    /**
     * Generate receipt for a completed transaction
     */
    static async generateReceipt(
        transactionId: string,
        paymentIntentId?: string
    ): Promise<IPaymentReceipt> {
        try {
            // Check if receipt already exists
            const existingReceipt = await PaymentReceipt.findOne({ transactionId });
            if (existingReceipt) {
                console.log(`Receipt already exists for transaction ${transactionId}`);
                return existingReceipt;
            }

            // Get transaction details
            const transaction = await Transaction.findOne({ 
                transactionId: transactionId 
            });

            if (!transaction) {
                throw new Error(`Transaction ${transactionId} not found`);
            }

            if (transaction.status !== 'completed') {
                throw new Error(`Cannot generate receipt for non-completed transaction`);
            }

            // Get user details
            const user = await User.findById(transaction.userId);
            if (!user) {
                throw new Error(`User not found for transaction ${transactionId}`);
            }

            // Determine payment method details
            let paymentMethodType: 'card' | 'bank_account' | 'wallet' = 'wallet';
            let last4: string | undefined;
            let brand: string | undefined;

            if (transaction.paymentMethodId) {
                if (transaction.paymentMethodId.startsWith('pm_')) {
                    paymentMethodType = 'card';
                    // Extract last4 and brand from metadata if available
                    last4 = transaction.metadata?.last4;
                    brand = transaction.metadata?.brand;
                } else if (transaction.paymentMethodId.startsWith('ba_')) {
                    paymentMethodType = 'bank_account';
                    last4 = transaction.metadata?.last4;
                }
            }

            // Calculate fees (Stripe standard: 2.9% + $0.30 for cards)
            let feeAmount = 0;
            if (paymentMethodType === 'card') {
                feeAmount = Math.round((transaction.amount * 0.029 + 0.30) * 100) / 100;
            }

            const netAmount = transaction.amount - feeAmount;

            // Create receipt
            const receipt = await PaymentReceipt.create({
                userId: transaction.userId,
                transactionId: transaction.transactionId,
                paymentIntentId: paymentIntentId || transaction.externalTransactionId,
                amount: transaction.amount,
                currency: 'USD',
                paymentMethod: {
                    type: paymentMethodType,
                    last4,
                    brand
                },
                paymentDate: transaction.completedAt || transaction.createdAt,
                description: transaction.description || 'Payment',
                metadata: {
                    businessName: 'Save2740',
                    businessAddress: 'United States',
                    feeAmount,
                    netAmount,
                    userName: `${user.firstName} ${user.lastName}`,
                    userEmail: user.email,
                    transactionType: transaction.type
                }
            });

            console.log(`✅ Receipt generated: ${receipt.receiptNumber} for transaction ${transactionId}`);
            return receipt;

        } catch (error: any) {
            console.error('Error generating receipt:', error);
            throw new Error(`Failed to generate receipt: ${error.message}`);
        }
    }

    /**
     * Get receipt by transaction ID
     */
    static async getReceiptByTransactionId(transactionId: string): Promise<IPaymentReceipt | null> {
        return await PaymentReceipt.findOne({ transactionId });
    }

    /**
     * Get receipt by receipt number
     */
    static async getReceiptByNumber(receiptNumber: string): Promise<IPaymentReceipt | null> {
        return await PaymentReceipt.findOne({ receiptNumber });
    }

    /**
     * Get all receipts for a user
     */
    static async getUserReceipts(
        userId: string,
        limit: number = 50,
        skip: number = 0
    ): Promise<IPaymentReceipt[]> {
        return await PaymentReceipt.find({ userId })
            .sort({ paymentDate: -1 })
            .limit(limit)
            .skip(skip);
    }

    /**
     * Generate receipt HTML (for email or display)
     */
    static generateReceiptHTML(receipt: IPaymentReceipt): string {
        const formattedDate = new Date(receipt.paymentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: receipt.currency
        }).format(receipt.amount);

        const feeAmount = receipt.metadata?.feeAmount 
            ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: receipt.currency
            }).format(receipt.metadata.feeAmount)
            : null;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Payment Receipt - ${receipt.receiptNumber}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .receipt {
                    background-color: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #4CAF50;
                    margin: 0;
                }
                .receipt-number {
                    color: #666;
                    font-size: 14px;
                    margin-top: 10px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #eee;
                }
                .info-label {
                    font-weight: bold;
                    color: #333;
                }
                .info-value {
                    color: #666;
                }
                .amount-section {
                    background-color: #f9f9f9;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .total-amount {
                    font-size: 32px;
                    font-weight: bold;
                    color: #4CAF50;
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h1>💰 ${receipt.metadata?.businessName || 'Save2740'}</h1>
                    <p class="receipt-number">Receipt #${receipt.receiptNumber}</p>
                </div>

                <div class="amount-section">
                    <div class="total-amount">${formattedAmount}</div>
                    <p style="text-align: center; color: #666; margin: 10px 0 0 0;">
                        Payment Received
                    </p>
                </div>

                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">Description:</span>
                    <span class="info-value">${receipt.description}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value">
                        ${receipt.paymentMethod.brand || receipt.paymentMethod.type} 
                        ${receipt.paymentMethod.last4 ? `****${receipt.paymentMethod.last4}` : ''}
                    </span>
                </div>

                ${receipt.metadata?.userName ? `
                <div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span class="info-value">${receipt.metadata.userName}</span>
                </div>
                ` : ''}

                ${feeAmount ? `
                <div class="info-row">
                    <span class="info-label">Processing Fee:</span>
                    <span class="info-value">${feeAmount}</span>
                </div>
                ` : ''}

                ${receipt.paymentIntentId ? `
                <div class="info-row">
                    <span class="info-label">Transaction ID:</span>
                    <span class="info-value" style="font-family: monospace; font-size: 11px;">
                        ${receipt.paymentIntentId}
                    </span>
                </div>
                ` : ''}

                <div class="footer">
                    <p>Thank you for your payment!</p>
                    <p>This is an automated receipt. Please keep it for your records.</p>
                    <p>${receipt.metadata?.businessAddress || ''}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

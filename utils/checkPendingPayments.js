const { db } = require('../lib/db');
const mpesaService = require('../api/payments/mpesa/service');
const logger = require('./logger');

/**
 * Check status of all pending M-PESA payments that haven't been updated in the last 5 minutes
 */
async function checkPendingPayments() {
  try {
    const pendingPayments = await db.manyOrNone(`
      SELECT id, transaction_id, created_at 
      FROM payments 
      WHERE status = 'pending' 
      AND method = 'M-PESA' 
      AND transaction_id IS NOT NULL
      AND updated_at < NOW() - INTERVAL '5 minutes'
      AND created_at > NOW() - INTERVAL '24 hours'
    `);

    logger.info(`Found ${pendingPayments.length} pending M-PESA payments to check`);

    for (const payment of pendingPayments) {
      try {
        const result = await mpesaService.checkTransactionStatus(payment.transaction_id);
        
        if (!result) continue;

        if (result.ResultCode === '0') {
          // Payment successful
          await db.tx(async t => {
            // Update payment status
            await t.none(
              'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
              ['completed', payment.id]
            );

            // Update order status
            const order = await t.oneOrNone(
              'SELECT id FROM orders WHERE id = (SELECT order_id FROM payments WHERE id = $1)',
              [payment.id]
            );

            if (order) {
              await t.none(
                'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
                ['paid', order.id]
              );
            }
          });

          logger.info(`Payment ${payment.id} marked as completed`);
        } else if (['1', '1032', '1037'].includes(result.ResultCode)) {
          // These codes indicate the payment failed (canceled, expired, etc.)
          await db.none(
            'UPDATE payments SET status = $1, updated_at = NOW(), notes = $2 WHERE id = $3',
            ['failed', result.ResultDesc, payment.id]
          );
          
          logger.info(`Payment ${payment.id} marked as failed: ${result.ResultDesc}`);
        }
        // else: payment is still pending
      } catch (err) {
        logger.error(`Error checking payment ${payment.id}:`, err);
      }
    }
  } catch (err) {
    logger.error('Error in checkPendingPayments:', err);
  }
}

// If this script is run directly
if (require.main === module) {
  checkPendingPayments()
    .then(() => {
      logger.info('Payment check completed');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Payment check failed:', err);
      process.exit(1);
    });
}

module.exports = { checkPendingPayments };

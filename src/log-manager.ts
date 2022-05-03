import { logManager } from 'dotsdk';

export const appLogManager = logManager.configure({
  minLevels: {
    '': 'error',
    chikn: 'debug',
  },
});

export const appLogger = appLogManager.getLogger('chikn.app');
export const paymentLogger = appLogManager.getLogger('chikn.payment');

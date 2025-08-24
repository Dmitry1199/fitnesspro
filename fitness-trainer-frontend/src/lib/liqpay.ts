export const formatPrice = (amount: number, currency: string = 'UAH') => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Базовий план',
    price: 499,
    interval: 'month',
    currency: 'UAH',
    features: [
      'До 20 клієнтів',
      'Базовий конструктор тренувань',
      'Планування сесій',
      'Email підтримка',
    ],
  },
  {
    id: 'pro',
    name: 'Професійний план',
    price: 1299,
    interval: 'month',
    currency: 'UAH',
    popular: true,
    features: [
      'До 100 клієнтів',
      'Розширений конструктор тренувань',
      'Автоматичне планування',
      'Відстеження прогресу',
      'Відео сесії',
      'Пріоритетна підтримка',
    ],
  },
  {
    id: 'premium',
    name: 'Преміум план',
    price: 2499,
    interval: 'month',
    currency: 'UAH',
    features: [
      'Необмежена кількість клієнтів',
      'White-label рішення',
      'Персональний брендинг',
      'Розширена аналітика',
      'API доступ',
      'Персональна підтримка',
    ],
  },
] as const;

export type SubscriptionPlan = typeof subscriptionPlans[number];

// LiqPay form utilities
export const createLiqPayForm = (data: string, signature: string) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.liqpay.ua/api/3/checkout';
  form.style.display = 'none';

  const dataInput = document.createElement('input');
  dataInput.type = 'hidden';
  dataInput.name = 'data';
  dataInput.value = data;

  const signatureInput = document.createElement('input');
  signatureInput.type = 'hidden';
  signatureInput.name = 'signature';
  signatureInput.value = signature;

  form.appendChild(dataInput);
  form.appendChild(signatureInput);

  return form;
};

export const openLiqPayCheckout = (data: string, signature: string) => {
  const form = createLiqPayForm(data, signature);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

// Ukrainian formatting utilities
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date) => {
  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

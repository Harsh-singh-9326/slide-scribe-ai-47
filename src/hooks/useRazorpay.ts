import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RAZORPAY_CONFIG, PAYMENT_METHODS } from '@/config/razorpay';

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  amount: number; // in paise (₹1 = 100 paise)
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
  methods?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
    paylater?: boolean;
  };
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async (options: PaymentOptions) => {
    setIsLoading(true);
    
    try {
      const isLoaded = await loadRazorpay();
      
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const razorpayOptions = {
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: options.amount,
        currency: options.currency,
        name: options.name,
        description: options.description,
        order_id: options.order_id,
        prefill: {
          name: options.customer.name,
          email: options.customer.email,
          contact: options.customer.contact,
        },
        method: options.methods || PAYMENT_METHODS,
        theme: {
          color: 'hsl(var(--primary))',
        },
        handler: (response: any) => {
          toast({
            title: "Payment Successful!",
            description: `Payment ID: ${response.razorpay_payment_id}`,
          });
          options.onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled by user",
              variant: "destructive",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      
      razorpay.on('payment.failed', (response: any) => {
        toast({
          title: "Payment Failed",
          description: response.error.description,
          variant: "destructive",
        });
        options.onFailure(response.error);
      });

      razorpay.open();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      console.error('Payment initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    isLoading,
  };
};
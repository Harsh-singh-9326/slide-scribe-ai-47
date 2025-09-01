import { Button } from "@/components/ui/button";
import { useRazorpay } from "@/hooks/useRazorpay";
import { Loader2 } from "lucide-react";
import { RAZORPAY_CONFIG } from "@/config/razorpay";

interface PaymentButtonProps {
  planName: string;
  amount: number; // in rupees
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

export const PaymentButton = ({ 
  planName, 
  amount, 
  variant = "default", 
  className = "",
  children 
}: PaymentButtonProps) => {
  const { initiatePayment, isLoading } = useRazorpay();

  const handlePayment = () => {
    initiatePayment({
      amount: amount * 100, // Convert to paise
      currency: RAZORPAY_CONFIG.CURRENCY,
      name: RAZORPAY_CONFIG.COMPANY_NAME,
      description: `${planName} Plan Subscription`,
      customer: {
        name: 'User', // In real app, get from auth context
        email: 'user@example.com', // In real app, get from auth context
        contact: '9999999999', // In real app, get from user profile
      },
      onSuccess: (response) => {
        console.log('Payment successful:', response);
        // Handle successful payment - update user subscription status
        // Redirect to dashboard or show success message
      },
      onFailure: (error) => {
        console.error('Payment failed:', error);
        // Handle payment failure
      },
    });
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={isLoading}
      variant={variant}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
};
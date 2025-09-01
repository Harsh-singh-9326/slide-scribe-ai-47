import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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
  return (
    <Button 
      variant={variant}
      className={className}
      asChild
    >
      <Link to={`/payment?plan=${encodeURIComponent(planName)}&amount=${amount}`}>
        {children}
      </Link>
    </Button>
  );
};
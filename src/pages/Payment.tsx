import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Wallet, Shield } from "lucide-react";
import Header from "@/components/Header";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { initiatePayment, isLoading } = useRazorpay();
  
  const planName = searchParams.get('plan') || 'Pro';
  const amount = parseInt(searchParams.get('amount') || '1599');
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    contact: '',
  });

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay (All Methods)',
      description: 'UPI, Cards, Net Banking, Wallets & more',
      icon: Wallet,
      popular: true
    },
    {
      id: 'upi',
      name: 'UPI Only',
      description: 'Google Pay, PhonePe, Paytm, BHIM',
      icon: Smartphone,
      popular: false
    },
    {
      id: 'cards',
      name: 'Cards Only',
      description: 'Credit & Debit Cards',
      icon: CreditCard,
      popular: false
    }
  ];

  const handlePayment = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.contact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Configure payment methods based on selection
    let methods = {};
    if (paymentMethod === 'upi') {
      methods = { upi: true };
    } else if (paymentMethod === 'cards') {
      methods = { card: true };
    } else {
      methods = {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: true,
        paylater: true,
      };
    }

    initiatePayment({
      amount: amount * 100,
      currency: 'INR',
      name: 'SlideForge AI',
      description: `${planName} Plan Subscription`,
      customer: customerInfo,
      methods,
      onSuccess: (response) => {
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${planName} plan!`,
        });
        // Redirect to dashboard or success page
        navigate('/dashboard');
      },
      onFailure: (error) => {
        console.error('Payment failed:', error);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
            <p className="text-muted-foreground">
              Choose your preferred payment method for {planName} plan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  All payments are secured with 256-bit SSL encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div key={method.id} className="relative">
                        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === method.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-primary/50'
                        }`}>
                          {method.popular && (
                            <div className="absolute -top-2 left-4">
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Most Popular
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Label htmlFor={method.id} className="font-medium cursor-pointer">
                                  {method.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  {method.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>

                <Separator />

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Billing Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact">Phone Number *</Label>
                    <Input
                      id="contact"
                      value={customerInfo.contact}
                      onChange={(e) => setCustomerInfo({...customerInfo, contact: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{planName} Plan</span>
                  <span className="font-medium">₹{amount}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Billing Cycle</span>
                  <span>Monthly</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{amount}</span>
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• 14-day free trial included</p>
                  <p>• Cancel anytime</p>
                  <p>• Secure payment processing</p>
                </div>
                
                <Button 
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Processing..." : `Pay ₹${amount}`}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle } from "lucide-react";

export default function AgeVerification() {
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyAgeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/auth/verify-age', {
        method: 'POST',
        body: JSON.stringify({ confirmed: true }),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch user data to update authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Age Verified",
        description: "You now have access to all content on the platform.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm you are 18 or older to continue.",
        variant: "destructive",
      });
      return;
    }
    verifyAgeMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-green-500/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-400">
            Age Verification Required
          </CardTitle>
          <CardDescription className="text-gray-300">
            This platform contains mature content for users 18 and older
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">18+ Content Warning</p>
                <p>
                  This Rick and Morty fanwork archive contains mature themes, 
                  explicit content, and is intended for adult audiences only.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="age-confirm"
                checked={confirmed}
                onCheckedChange={setConfirmed}
                className="border-green-500 data-[state=checked]:bg-green-500"
              />
              <label
                htmlFor="age-confirm"
                className="text-sm text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that I am 18 years of age or older and wish to view mature content
              </label>
            </div>

            <Button
              onClick={handleVerify}
              disabled={!confirmed || verifyAgeMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-black font-semibold"
            >
              {verifyAgeMutation.isPending ? "Verifying..." : "Verify Age & Continue"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              By continuing, you acknowledge that you meet the age requirement 
              and agree to view mature content responsibly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}